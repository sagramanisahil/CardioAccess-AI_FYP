import { useCallback, useEffect, useMemo, useState } from "react";
import AppContext from "./app-context";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const EMPTY_DATA = [];
const INPUT_BUCKET = "case-inputs";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const VALID_GENDERS = ["male", "female", "other", "not_specified"];

function failure(message, extra = {}) {
  return { ok: false, message, ...extra };
}

function displaySize(bytes) {
  if (bytes == null || !Number.isFinite(Number(bytes))) return "Size unavailable";
  const value = Number(bytes);
  return value >= 1048576
    ? `${(value / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

async function sha256(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function modalityFromRow(row) {
  const files = Array.isArray(row.uploaded_files) ? row.uploaded_files : [];
  const hasEcg = Boolean(row.has_ecg) || files.some((file) => file.modality === "ecg");
  const hasEcho = Boolean(row.has_echo) || files.some((file) => file.modality === "echo");
  if (hasEcg && hasEcho) return "both";
  if (hasEcg) return "ecg";
  if (hasEcho) return "echo";
  return null;
}

function recordFromRow(row) {
  const modality = modalityFromRow(row);
  const patientName = row.patient_name ?? null;
  const patientAge = row.patient_age ?? null;
  const patientGender = row.patient_gender ?? null;

  const record = {
    id: row.case_code || row.id,
    caseCode: row.case_code || row.id,
    databaseId: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || null,
    ownerId: row.owner_id,
    status: row.status,
    notes: row.notes || "",
    has_ecg: Boolean(row.has_ecg),
    has_echo: Boolean(row.has_echo),
    pairEligible: Boolean(row.pair_eligible),
    screeningDate: row.created_at?.slice(0, 10) || "",
    modality,
    paired: modality === "both",
    patientId: row.case_code || row.id,
    patientName: patientName || "Patient details unavailable",
    patientAlias: patientName || "Patient details unavailable",
    age: patientAge,
    sex: patientGender,
    patientGender,
    clinical: row.notes || "",
    ecg: null,
    echo: null,
    fusion: null,
    triage: null,
    triageSource: null,
    lowConfidence: false,
    lowConfidenceModalities: [],
    aiReport: null,
    referrals: [],
    triageReason: row.status === "draft"
      ? "This case is saved as a draft. No analysis result is available."
      : "No analysis result has been loaded.",
  };

  for (const file of Array.isArray(row.uploaded_files) ? row.uploaded_files : []) {
    const fileInfo = {
      id: file.id,
      name: file.original_name,
      sizeLabel: displaySize(file.size_bytes),
      detail: "Stored in private case storage",
      storagePath: file.storage_path,
      bucket: file.bucket,
      mimeType: file.mime_type,
      uploadedAt: file.uploaded_at,
    };
    if (file.modality === "ecg") record.ecgFile = fileInfo;
    if (file.modality === "echo") record.echoFile = fileInfo;
  }
  return record;
}

async function getAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");
  return session.access_token;
}

async function apiRequest(path, options = {}) {
  const token = await getAccessToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not connect to the FastAPI backend.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg || JSON.stringify(item)).join("; ")
        : `Backend request failed (${response.status}).`;
    throw new Error(message);
  }
  return body;
}

async function createDraftCase({ notes, patientName, patientAge, patientGender }) {
  return apiRequest("/api/v1/cases", {
    method: "POST",
    body: JSON.stringify({
      notes: notes || null,
      patient_name: patientName,
      patient_age: patientAge,
      patient_gender: patientGender,
    }),
  });
}

function buildFilePath(userId, caseId, modality, file) {
  const extension = file.name.toLowerCase().match(/(\.nii\.gz|\.[^.]+)$/)?.[0] || "";
  return `${userId}/${caseId}/${modality}/${crypto.randomUUID()}${extension}`;
}

async function uploadInputFile({ userId, caseId, modality, file }) {
  const path = buildFilePath(userId, caseId, modality, file);
  const checksum = await sha256(file);
  const mimeType = file.type || "application/octet-stream";
  const { error } = await supabase.storage.from(INPUT_BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`);
  return {
    modality,
    bucket: INPUT_BUCKET,
    storage_path: path,
    original_name: file.name,
    mime_type: mimeType,
    size_bytes: file.size,
    sha256: checksum,
  };
}

export function AppProvider({ children }) {
  const { user, settings, updateSettings, updateProfile, changePassword } = useAuth();
  const [cases, setCases] = useState(EMPTY_DATA);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState("");
  const canScreen = user?.active === true && ["Clinician", "Nurse"].includes(user?.role);

  const refreshCases = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setCases(EMPTY_DATA);
      setCasesLoading(false);
      return failure("Sign in and configure Supabase to load cases.");
    }
    if (user.role === "Admin") {
      setCases(EMPTY_DATA);
      setCasesError("");
      setCasesLoading(false);
      return { ok: true, cases: [] };
    }
    setCasesLoading(true);
    setCasesError("");
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*, uploaded_files(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const records = (data || []).map(recordFromRow);
      setCases(records);
      return { ok: true, cases: records };
    } catch (error) {
      setCasesError(error.message);
      return failure(error.message);
    } finally {
      setCasesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || user.role === "Admin") {
      setCases(EMPTY_DATA);
      setCasesError("");
      setCasesLoading(false);
      return;
    }
    void refreshCases();
  }, [user, refreshCases]);

  const submitCase = useCallback(async (draft) => {
    if (!canScreen || !isSupabaseConfigured) {
      return failure("Only active Clinician and Nurse accounts can create screening cases.");
    }
    if (!draft?.ecgFile && !draft?.echoFile) {
      return failure("Choose at least one valid input file.");
    }

    const patientName = String(draft.patient_name ?? draft.patientName ?? "").trim();
    const rawAge = draft.patient_age ?? draft.patientAge;
    const patientAge = rawAge === "" || rawAge == null ? NaN : Number(rawAge);
    const patientGender = String(draft.patient_gender ?? draft.patientGender ?? "").trim().toLowerCase();
    const notes = typeof draft.notes === "string"
      ? draft.notes.trim()
      : typeof draft.clinical === "string" ? draft.clinical.trim() : "";

    if (!patientName || patientName.length > 150) {
      return failure("Patient name is required and must not exceed 150 characters.");
    }
    if (!Number.isInteger(patientAge) || patientAge < 0 || patientAge > 120) {
      return failure("Patient age must be a whole number between 0 and 120.");
    }
    if (!VALID_GENDERS.includes(patientGender)) {
      return failure("Choose a valid patient gender.");
    }
    if (notes.length > 500) return failure("Case notes cannot exceed 500 characters.");

    let createdCase;
    try {
      createdCase = await createDraftCase({ notes, patientName, patientAge, patientGender });
    } catch (error) {
      return failure(`Could not create case: ${error.message}`);
    }

    const caseId = createdCase?.case_id;
    const caseCode = createdCase?.case_code;
    if (!caseId) return failure("The backend did not return a case ID.");

    const inputs = [["ecg", draft.ecgFile], ["echo", draft.echoFile]]
      .filter(([, file]) => Boolean(file));
    const uploadedFiles = [];
    const registeredFiles = [];

    for (const [modality, file] of inputs) {
      let metadata;
      try {
        metadata = await uploadInputFile({ userId: user.id, caseId, modality, file });
        uploadedFiles.push(metadata);
      } catch (error) {
        void refreshCases();
        return failure(`Case ${caseCode || caseId} was created, but ${modality.toUpperCase()} upload failed: ${error.message}`, {
          caseId, caseCode, uploadedFiles, registeredFiles, pendingRegistration: true,
        });
      }
      try {
        const registered = await apiRequest(`/api/v1/cases/${caseId}/files`, {
          method: "POST",
          body: JSON.stringify(metadata),
        });
        registeredFiles.push(registered);
      } catch (error) {
        void refreshCases();
        return failure(`Case ${caseCode || caseId} was created, but ${modality.toUpperCase()} registration failed: ${error.message}. Check case history before retrying.`, {
          caseId, caseCode, uploadedFiles, registeredFiles, pendingRegistration: true,
        });
      }
    }

    await refreshCases();
    return {
      ok: true,
      caseId,
      caseCode,
      uploadedFiles,
      registeredFiles,
      message: "Case created and files registered. Analysis has not been started.",
    };
  }, [user, canScreen, refreshCases]);

  // Resolve the database UUID rather than the human-readable case code.
  const resolveCaseId = useCallback((caseRef) => {
    if (caseRef && typeof caseRef === "object") {
      return caseRef.databaseId || caseRef.case_id || caseRef.caseId || null;
    }
    if (typeof caseRef !== "string") return null;
    const found = cases.find((item) =>
      item.databaseId === caseRef || item.id === caseRef || item.caseCode === caseRef
    );
    return found?.databaseId || (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(caseRef) ? caseRef : null);
  }, [cases]);

  const updateCase = useCallback(async (caseRef, changes = {}) => {
    if (!canScreen || !isSupabaseConfigured) {
      return failure("Only active Clinician and Nurse accounts can edit screening cases.");
    }
    const caseId = resolveCaseId(caseRef);
    if (!caseId) return failure("Case not found. Refresh the case list and try again.");
    const knownCase = cases.find((item) => item.databaseId === caseId);
    if (knownCase && (knownCase.ownerId !== user.id || knownCase.status !== "draft")) {
      return failure("Only your own draft cases can be edited.");
    }
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      return failure("Invalid patient details.");
    }

    const payload = {};
    const rawName = changes.patient_name ?? changes.patientName;
    const rawAge = changes.patient_age ?? changes.patientAge ?? changes.age;
    const rawGender = changes.patient_gender ?? changes.patientGender ?? changes.sex;
    if (rawName !== undefined) {
      const name = String(rawName).trim();
      if (!name || name.length > 150) return failure("Patient name must be 1–150 characters.");
      payload.patient_name = name;
    }
    if (rawAge !== undefined) {
      const age = rawAge === "" || rawAge === null ? NaN : Number(rawAge);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        return failure("Patient age must be a whole number between 0 and 120.");
      }
      payload.patient_age = age;
    }
    if (rawGender !== undefined) {
      const gender = String(rawGender).trim().toLowerCase();
      if (!VALID_GENDERS.includes(gender)) return failure("Choose a valid patient gender.");
      payload.patient_gender = gender;
    }
    if (Object.keys(payload).length === 0) return failure("No patient changes were provided.");

    try {
      const response = await apiRequest(`/api/v1/cases/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const refreshed = await refreshCases();
      return {
        ok: true,
        caseId,
        data: response,
        message: refreshed.ok
          ? "Patient details updated successfully."
          : "Patient details saved, but the case list could not refresh. Please reload the page.",
        refreshError: refreshed.ok ? null : refreshed.message,
      };
    } catch (error) {
      return failure(error.message || "Could not update patient details.");
    }
  }, [canScreen, cases, user, resolveCaseId, refreshCases]);

  const deleteCase = useCallback(async (caseRef) => {
    if (!canScreen || !isSupabaseConfigured) {
      return failure("Only active Clinician and Nurse accounts can delete screening cases.");
    }
    const caseId = resolveCaseId(caseRef);
    if (!caseId) return failure("Case not found. Refresh the case list and try again.");
    const knownCase = cases.find((item) => item.databaseId === caseId);
    if (knownCase && (knownCase.ownerId !== user.id || knownCase.status !== "draft")) {
      return failure("Only your own draft cases can be deleted.");
    }
    try {
      const response = await apiRequest(`/api/v1/cases/${encodeURIComponent(caseId)}`, {
        method: "DELETE",
      });
      // The backend is responsible for Storage cleanup, DB cascade and audit logging.
      setCases((current) => current.filter((item) => item.databaseId !== caseId));
      const refreshed = await refreshCases();
      return {
        ok: true,
        caseId,
        data: response,
        message: refreshed.ok
          ? "Draft case deleted successfully."
          : "Delete request succeeded, but the case list could not refresh. Please reload the page.",
        refreshError: refreshed.ok ? null : refreshed.message,
      };
    } catch (error) {
      return failure(error.message || "Could not delete the draft case.");
    }
  }, [canScreen, cases, user, resolveCaseId, refreshCases]);

  const value = useMemo(() => ({
    user,
    users: EMPTY_DATA,
    cases,
    casesLoading,
    casesError,
    referrals: EMPTY_DATA,
    audit: EMPTY_DATA,
    settings,
    updateSettings,
    updateProfile,
    changePassword,
    submitCase,
    refreshCases,
    updateCase,
    deleteCase,
    updateReferral: async () => failure("Automated referral management is not part of the current screening workflow."),
    updateUser: async () => failure("User administration must use the protected FastAPI admin API."),
  }), [user, cases, casesLoading, casesError, settings, updateSettings, updateProfile, changePassword, submitCase, refreshCases, updateCase, deleteCase]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
