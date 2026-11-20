import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  FileText,
  HeartPulse,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import Button from "../components/ui/Button";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { useApp } from "../hooks/useApp";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

const MAX_NOTES_LENGTH = 500;

const FILE_RULES = {
  ecg: {
    title: "ECG Recording",
    accept: ".csv,.npy,.zip",
    extensions: [".csv", ".npy", ".zip"],
    maxSize: 10 * 1024 * 1024,
    maxLabel: "10 MB",
    description: "CSV, NPY, or WFDB ZIP",
    hint: "For WFDB, place the matching .hea and .dat files together in one .zip archive.",
  },
  echo: {
    title: "Echocardiogram Study",
    accept: ".mp4,.avi,.dcm,.nii,.nii.gz",
    extensions: [".mp4", ".avi", ".dcm", ".nii", ".nii.gz"],
    maxSize: 100 * 1024 * 1024,
    maxLabel: "100 MB",
    description: "MP4, AVI, DICOM (.dcm), NII, or NII.GZ",
    hint: "Upload an ultrasound study containing the necessary frames for your analysis.",
  },
};

const SCREENING_MODES = [
  {
    id: "ecg",
    title: "ECG",
    subtitle: "Electrocardiogram screening",
    description:
      "Upload an ECG recording for supported rhythm screening and conditional MI-related analysis.",
    icon: Activity,
  },
  {
    id: "echo",
    title: "Echo",
    subtitle: "Echocardiography screening",
    description:
      "Upload an echocardiogram for ventricular measurements and ejection fraction screening.",
    icon: HeartPulse,
  },
  {
    id: "both",
    title: "Multimodal",
    subtitle: "ECG + Echocardiography",
    description:
      "Upload both ECG and Echo files. Multimodal eligibility is verified separately.",
    icon: AudioLines,
  },
];

function validateFile(type, file) {
  const rule = FILE_RULES[type];

  if (!rule) {
    return "Unsupported file type.";
  }

  if (!file) {
    return `Please upload the required ${rule.title}.`;
  }

  const name = file.name.toLowerCase();

  if (
    !rule.extensions.some((extension) =>
      name.endsWith(extension)
    )
  ) {
    return `Invalid ${rule.title} format. Accepted formats: ${rule.description}.`;
  }

  if (file.size <= 0) {
    return "The uploaded file cannot be empty.";
  }

  if (file.size > rule.maxSize) {
    return `${rule.title} must not exceed ${rule.maxLabel}.`;
  }

  return "";
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

export default function NewCasePage() {
  const navigate = useNavigate();

  const { submitCase } = useApp();
  const { notify } = useToast();
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkRole() {
      setCheckingRole(true);
      setAuthorized(false);
      if (loading) return;
      if (!user?.id || user.active !== true) {
        if (active) setCheckingRole(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();
      if (active) {
        setAuthorized(!error && data?.is_active === true &&
          ["clinician", "nurse"].includes(String(data?.role || "").toLowerCase()));
        setCheckingRole(false);
      }
    }
    void checkRole();
    return () => { active = false; };
  }, [user?.id, user?.active, loading]);

  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);

  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [ecgFile, setEcgFile] = useState(null);
  const [echoFile, setEchoFile] = useState(null);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const needsECG =
    mode === "ecg" || mode === "both";

  const needsEcho =
    mode === "echo" || mode === "both";

  const selectedMode = SCREENING_MODES.find(
    (item) => item.id === mode
  );

  // Screening is available only after an explicit clinical role check.
  const openModal = (selected) => {
    if (busy || !authorized) return;

    setMode(selected);
    setStep(1);
    setNotes("");
    setPatientName("");
    setPatientAge("");
    setPatientGender("");
    setEcgFile(null);
    setEchoFile(null);
    setError("");
    setFieldErrors({});
  };

  const closeModal = () => {
    if (busy) return;

    setMode(null);
    setStep(1);
    setError("");
    setFieldErrors({});
  };

  const validateInformation = () => {
    const errors = {};
    const name = patientName.trim();
    if (!name) errors.patientName = "Patient name is required.";
    else if (name.length > 150) errors.patientName = "Patient name must not exceed 150 characters.";

    if (!/^\d+$/.test(String(patientAge)) || Number(patientAge) > 120) {
      errors.patientAge = "Enter a valid patient age between 0 and 120.";
    }
    if (!["male", "female", "other", "not_specified"].includes(patientGender)) {
      errors.patientGender = "Select a patient gender.";
    }
    if (notes.trim().length > MAX_NOTES_LENGTH) {
      errors.notes = "Case notes must not exceed 500 characters.";
    }
    return errors;
  };

  const changeField = (field, setter) => (value) => {
    setter(value);
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const nextStep = () => {
    const errors = validateInformation();
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length) return;
    setStep(2);
  };

  const previousStep = () => {
    if (busy) return;

    setError("");
    setStep(1);
  };

  const selectFile = (type, file) => {
    if (!file || busy) return;

    const message = validateFile(type, file);

    if (message) {
      setFieldErrors((previous) => ({ ...previous, [type]: message }));
      return;
    }

    setFieldErrors((previous) => ({ ...previous, [type]: "" }));
    if (type === "ecg") {
      setEcgFile(file);
    } else {
      setEchoFile(file);
    }

    setError("");
  };

  const removeFile = (type) => {
    if (busy) return;

    if (type === "ecg") {
      setEcgFile(null);
    } else {
      setEchoFile(null);
    }

    setFieldErrors((previous) => ({ ...previous, [type]: "" }));
    setError("");
  };

  const canSubmit =
    step === 2 &&
    authorized &&
    !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || busy) return;

    setError("");
    const errors = validateInformation();
    if (needsECG) {
      const message = validateFile("ecg", ecgFile);
      if (message) errors.ecg = message;
    }
    if (needsEcho) {
      const message = validateFile("echo", echoFile);
      if (message) errors.echo = message;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      if (errors.patientName || errors.patientAge || errors.patientGender || errors.notes) {
        setStep(1);
      }
      return;
    }

    setBusy(true);

    try {
      const result = await submitCase({
        notes: notes.trim() || null,
        patient_name: patientName.trim(),
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        ecgFile: needsECG ? ecgFile : null,
        echoFile: needsEcho ? echoFile : null,
      });

      const caseId =
        result?.caseId ||
        result?.case_id ||
        result?.case?.id;

      const caseCode =
        result?.caseCode ||
        result?.case_code ||
        result?.case?.case_code;

      if (!result?.ok) {
        const message = result?.pendingRegistration
          ? "The case was created, but file registration is incomplete. Check your existing cases before submitting again."
          : result?.message ||
            "Unable to submit the screening case.";

        setError(message);
        notify(message);
        return;
      }

      if (!caseId) {
        const message =
          "Submission returned no case ID. Check your case history before trying again.";

        setError(message);
        notify(message);
        return;
      }

      notify(
        caseCode
          ? `Case ${caseCode} submitted successfully.`
          : "Screening case submitted successfully."
      );

      setMode(null);
      navigate(`/cases/${caseId}`);
    } catch (err) {
      const message =
        err?.message ||
        "An unexpected error occurred during submission.";

      setError(message);
      notify(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || checkingRole) return <PageContainer><p className="p-6 text-sm text-slate-600">Checking screening permissions...</p></PageContainer>;
  if (!authorized) return <PageContainer><div role="alert" className="card p-6"><h2 className="font-semibold">Screening access restricted</h2><p className="mt-2 text-sm">Only active Clinician and Nurse accounts can create screening cases.</p></div></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Screening"
        title="New Screening"
        description="Enter patient information and upload the required medical recordings for a screening case."
      />

      <section className="card p-6">
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            Select Screening Modality
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Select a screening type to begin
            the two-step case submission process.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SCREENING_MODES.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openModal(item.id)}
                disabled={busy}
                className="group flex min-h-52 flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-clinic-blue">
                  <Icon size={25} />
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-navy-950">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs font-medium text-clinic-blue">
                  {item.subtitle}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <span className="mt-auto pt-5 text-sm font-semibold text-blue-600">
                  Start Screening
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <ShieldCheck
          size={20}
          className="shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-semibold text-blue-950">
            Privacy-first case management
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-900">
            Patient details are confidential and must be accessible only to authorized clinical users.
            Do not put phone numbers, CNICs, or other identifiers in notes.
            A unique pseudonymous case code is
            generated automatically when the case
            is created.
          </p>
        </div>
      </div>

      {mode && (
        <ScreeningModal
          mode={selectedMode}
          step={step}
          notes={notes}
          setNotes={changeField("notes", setNotes)}
          patientName={patientName}
          setPatientName={changeField("patientName", setPatientName)}
          patientAge={patientAge}
          setPatientAge={changeField("patientAge", setPatientAge)}
          patientGender={patientGender}
          setPatientGender={changeField("patientGender", setPatientGender)}
          ecgFile={ecgFile}
          echoFile={echoFile}
          needsECG={needsECG}
          needsEcho={needsEcho}
          onNext={nextStep}
          onBack={previousStep}
          onClose={closeModal}
          onFile={selectFile}
          onRemove={removeFile}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          busy={busy}
          error={error}
          fieldErrors={fieldErrors}
        />
      )}
    </PageContainer>
  );
}

function ScreeningModal({
  mode,
  step,
  notes,
  setNotes,
  patientName,
  setPatientName,
  patientAge,
  setPatientAge,
  patientGender,
  setPatientGender,
  ecgFile,
  echoFile,
  needsECG,
  needsEcho,
  onNext,
  onBack,
  onClose,
  onFile,
  onRemove,
  onSubmit,
  canSubmit,
  busy,
  error,
  fieldErrors,
}) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeCallbackRef = useRef(onClose);

  useEffect(() => {
    closeCallbackRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeRef.current?.focus();

    return () => {
      document.body.style.overflow =
        previousOverflow;

      previousFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!busy) {
          event.preventDefault();
          closeCallbackRef.current();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        modalRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'
        );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [busy]);

  const Icon = mode?.icon || Activity;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="screening-modal-title"
        className={`my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          mode?.id === "both"
            ? "max-w-3xl"
            : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-clinic-blue">
              <Icon size={23} />
            </span>

            <div>
              <h2
                id="screening-modal-title"
                className="font-display text-xl font-semibold text-navy-950"
              >
                {mode?.title} Screening
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Step {step} of 2 —{" "}
                {step === 1
                  ? "Case Information"
                  : "Upload Files"}
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            aria-label="Close screening modal"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                1
              </span>

              <span className="text-xs font-semibold text-slate-700">
                Case Information
              </span>
            </div>

            <div className="h-px w-8 bg-slate-200" />

            <div className="flex flex-1 items-center justify-end gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </span>

              <span className="text-xs font-semibold text-slate-700">
                Upload Files
              </span>
            </div>
          </div>
        </div>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="space-y-5 overflow-y-auto px-6 py-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {step === 1 ? (
              <CaseInformation
                notes={notes}
                setNotes={setNotes}
                patientName={patientName}
                setPatientName={setPatientName}
                patientAge={patientAge}
                setPatientAge={setPatientAge}
                patientGender={patientGender}
                setPatientGender={setPatientGender}
                mode={mode}
                fieldErrors={fieldErrors}
              />
            ) : (
              <FileUploadStep
                mode={mode}
                ecgFile={ecgFile}
                echoFile={echoFile}
                needsECG={needsECG}
                needsEcho={needsEcho}
                onFile={onFile}
                onRemove={onRemove}
                disabled={busy}
                fieldErrors={fieldErrors}
              />
            )}


          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <Button
                  type="button"
                  onClick={onNext}
                  disabled={busy}
                >
                  <span className="inline-flex items-center gap-2">
                    Next: Upload Files
                    <ArrowRight size={16} />
                  </span>
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onBack}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Submitting...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Submit Case
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function CaseInformation({
  notes,
  setNotes,
  patientName,
  setPatientName,
  patientAge,
  setPatientAge,
  patientGender,
  setPatientGender,
  mode,
  fieldErrors,
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <FileText
            size={20}
            className="text-clinic-blue"
          />

          <h3 className="font-display text-lg font-semibold text-navy-950">
            Case Information
          </h3>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the required patient details and optional screening context.
          The system will generate a unique
          pseudonymous case identifier automatically.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Selected Modality
        </p>

        <p className="mt-1 text-sm font-semibold text-navy-950">
          {mode?.title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {mode?.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="patient-name" className="label">Patient Name *</label>
          <input id="patient-name" className={`field mt-2 w-full ${fieldErrors.patientName ? "border-red-400" : ""}`} aria-invalid={Boolean(fieldErrors.patientName)} aria-describedby={fieldErrors.patientName ? "patient-name-error" : undefined} value={patientName}
            maxLength={150} required autoComplete="off"
            onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" />
          {fieldErrors.patientName && <p id="patient-name-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.patientName}</p>}
        </div>
        <div>
          <label htmlFor="patient-age" className="label">Age (years) *</label>
          <input id="patient-age" className={`field mt-2 w-full ${fieldErrors.patientAge ? "border-red-400" : ""}`} aria-invalid={Boolean(fieldErrors.patientAge)} aria-describedby={fieldErrors.patientAge ? "patient-age-error" : undefined} type="number" min="0" max="120"
            required value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="0–120" />
          {fieldErrors.patientAge && <p id="patient-age-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.patientAge}</p>}
        </div>
        <div>
          <label htmlFor="patient-gender" className="label">Gender *</label>
          <select id="patient-gender" className={`field mt-2 w-full ${fieldErrors.patientGender ? "border-red-400" : ""}`} aria-invalid={Boolean(fieldErrors.patientGender)} aria-describedby={fieldErrors.patientGender ? "patient-gender-error" : undefined} required value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="not_specified">Not specified</option>
          </select>
          {fieldErrors.patientGender && <p id="patient-gender-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.patientGender}</p>}
        </div>
      </div>

      <div>
        <label
          htmlFor="case-notes"
          className="label"
        >
          Case Notes (Optional)
        </label>

        <textarea
          id="case-notes"
          className={`field mt-2 min-h-32 w-full ${fieldErrors.notes ? "border-red-400" : ""}`}
          aria-invalid={Boolean(fieldErrors.notes)}
          aria-describedby={fieldErrors.notes ? "case-notes-error" : undefined}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          maxLength={MAX_NOTES_LENGTH}
          placeholder="Enter non-identifying clinical context, if needed..."
        />

        {fieldErrors.notes && <p id="case-notes-error" role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.notes}</p>}

        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
          <span>
            Do not include direct patient identifiers.
          </span>

          <span className="shrink-0">
            {notes.length}/{MAX_NOTES_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <Info
          size={18}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-xs leading-5 text-blue-900">
          Patient name, age, and gender are confidential case information.
          Do not enter phone numbers or CNICs in notes. The backend creates the
          case code and associates it with
          your authenticated account.
        </p>
      </div>
    </div>
  );
}

function FileUploadStep({
  mode,
  ecgFile,
  echoFile,
  needsECG,
  needsEcho,
  onFile,
  onRemove,
  disabled,
  fieldErrors,
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Upload
            size={20}
            className="text-clinic-blue"
          />

          <h3 className="font-display text-lg font-semibold text-navy-950">
            Upload Screening Files
          </h3>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode?.id === "both"
            ? "Both ECG and Echo recordings are required for this submission."
            : `Upload the required ${
                mode?.id === "ecg"
                  ? "ECG recording"
                  : "echocardiogram study"
              }.`}
        </p>
      </div>

      <div
        className={`grid gap-4 ${
          mode?.id === "both"
            ? "md:grid-cols-2"
            : ""
        }`}
      >
        {needsECG && (
          <UploadField
            type="ecg"
            file={ecgFile}
            onFile={onFile}
            onRemove={onRemove}
            disabled={disabled}
            error={fieldErrors.ecg}
          />
        )}

        {needsEcho && (
          <UploadField
            type="echo"
            file={echoFile}
            onFile={onFile}
            onRemove={onRemove}
            disabled={disabled}
            error={fieldErrors.echo}
          />
        )}
      </div>

      {mode?.id === "both" && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs leading-5 text-amber-900">
            Select one ECG recording and one Echo study for the same patient.
            The ECG accepts CSV, NPY, or a ZIP containing paired WFDB files;
            Echo accepts MP4, AVI, DICOM, NII, or NII.GZ.
            Uploading both does not automatically establish multimodal fusion eligibility.
          </p>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-navy-950">
          Submission Summary
        </h4>

        <div className="mt-3 space-y-2">
          {needsECG && (
            <SummaryRow
              title="ECG"
              file={ecgFile}
            />
          )}

          {needsEcho && (
            <SummaryRow
              title="Echo"
              file={echoFile}
            />
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Files are uploaded only after
          you click Submit Case.
          Processing begins only when
          the backend successfully queues
          the analysis.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ title, file }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600">
        {title}
      </span>

      {file ? (
        <span className="flex min-w-0 items-center gap-2 font-medium text-emerald-700">
          <CheckCircle2
            size={16}
            className="shrink-0"
          />

          <span className="max-w-48 truncate">
            {file.name}
          </span>
        </span>
      ) : (
        <span className="text-slate-400">
          Required
        </span>
      )}
    </div>
  );
}

function UploadField({
  type,
  file,
  onFile,
  onRemove,
  disabled,
  error,
}) {
  const rule = FILE_RULES[type];

  return (
    <div>
      <label className="label mb-2 block">
        {rule.title}
        <span className="ml-1 text-red-600">*</span>
      </label>

      {file ? (
        <div className="flex min-h-36 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={22}
            className="shrink-0 text-emerald-600"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {file.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatSize(file.size)}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              File selected
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(type)}
            disabled={disabled}
            aria-label={`Remove ${rule.title}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>
      ) : (
        <label
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/50 ${
            disabled
              ? "pointer-events-none opacity-60"
              : ""
          }`}
        >
          <Upload
            size={24}
            className="text-clinic-blue"
          />

          <span className="mt-3 text-sm font-semibold text-navy-950">
            Choose {rule.title}
          </span>

          <span className="mt-1 text-xs text-slate-500">
            {rule.description}
          </span>

          <span className="mt-1 text-xs text-slate-400">
            Maximum {rule.maxLabel}
          </span>

          <span className="mt-2 text-xs leading-5 text-slate-500">
            {rule.hint}
          </span>

          <input
            type="file"
            className="sr-only"
            accept={rule.accept}
            disabled={disabled}
            onChange={(event) => {
              const selectedFile =
                event.target.files?.[0];

              onFile(type, selectedFile);
              event.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

