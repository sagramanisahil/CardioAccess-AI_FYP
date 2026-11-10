import { useEffect, useMemo, useState } from "react";
import { caseCode, referralCode } from "../data/format";
import { ADMIN_EMAIL, ADMIN_ID, buildSeed, isAdminUser, seedUsers } from "../data/seed";
import { buildAnalysis, describeFile, profileFor, shouldCreateReferral } from "../data/simulate";
import AppContext from "./app-context";

const STORAGE_KEY = "cardioaccess-demo-v4";

function hashText(value) {
  let hash = 0;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

function blankState() {
  const seed = buildSeed();
  return {
    users: seedUsers(),
    sessionUserId: null,
    keepSignedIn: true,
    cases: seed.cases,
    referrals: seed.referrals,
    audit: seed.audit,
    settings: {},
  };
}

function loadState() {
  const base = blankState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) {
      const sessionId = sessionStorage.getItem(`${STORAGE_KEY}-session`);
      return sessionId ? { ...base, sessionUserId: sessionId, keepSignedIn: false } : base;
    }
    return { ...base, ...saved, users: saved.users?.length ? saved.users : base.users };
  } catch {
    return base;
  }
}

function kindFromDraft(draft, salt) {
  if (draft.fail) return "failed";
  if (draft.modality === "ecg") return "ecg-only";
  if (draft.modality === "echo") {
    const band = salt % 3;
    if (band === 0) return "echo-urgent";
    if (band === 1) return "echo-review";
    return "echo-normal";
  }
  if (!draft.paired) return salt % 2 === 0 ? "echo-review" : "echo-normal";
  const band = salt % 4;
  if (band === 0) return "fusion-urgent";
  if (band === 1) return "fusion-review";
  if (band === 2) return "fusion-review-low";
  return "fusion-normal";
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const { sessionUserId, keepSignedIn, ...persisted } = state;
    if (keepSignedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, sessionUserId, keepSignedIn }));
      sessionStorage.removeItem(`${STORAGE_KEY}-session`);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, sessionUserId: null, keepSignedIn }));
      if (sessionUserId) sessionStorage.setItem(`${STORAGE_KEY}-session`, sessionUserId);
      else sessionStorage.removeItem(`${STORAGE_KEY}-session`);
    }
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => {
      setState((current) => {
        const now = Date.now();
        let changed = false;
        const audit = [...current.audit];
        const referrals = [...current.referrals];
        const cases = current.cases.map((item) => {
          if (item.status !== "processing" || !item.completesAt || item.completesAt > now) return item;
          changed = true;
          if (item.pendingFail) {
            audit.unshift({
              id: `a-${now}`,
              time: new Date().toISOString(),
              event: "ANALYSIS_FAILED",
              target: item.id,
              actor: "system",
            });
            return {
              ...item,
              status: "failed",
              error: "Failed (unreadable file)",
              triage: null,
              triageReason: "The file could not be read. No prediction is shown.",
              completesAt: null,
              timeline: [
                ...item.timeline.filter((step) => step.done),
                { label: "Analysis failed", time: new Date().toLocaleTimeString("en-GB"), done: true },
              ],
            };
          }
          const analysis = buildAnalysis(item.pending);
          const completed = {
            ...item,
            status: "completed",
            ...analysis,
            completesAt: null,
            pending: null,
            error: null,
            timeline: item.timeline.map((step) => ({ ...step, done: true, time: step.time || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) })),
          };
          audit.unshift({
            id: `a-${now}-${item.id}`,
            time: new Date().toISOString(),
            event: analysis.fusion ? "TRIAGE_GENERATED" : "ANALYSIS_COMPLETED",
            target: item.id,
            actor: "system",
          });
          if (shouldCreateReferral(analysis.triage) && !referrals.some((row) => row.caseId === item.id)) {
            referrals.unshift({
              id: referralCode(item.id),
              caseId: item.id,
              triage: analysis.triage,
              status: "Open",
              createdAt: new Date().toISOString(),
              ownerId: item.ownerId,
              sample: false,
            });
          }
          return completed;
        });
        return changed ? { ...current, cases, referrals, audit } : current;
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const user = state.users.find((item) => item.id === state.sessionUserId) || null;

  const api = useMemo(() => {
    const openSession = (account, keepSignedIn, eventName) => {
      setState((current) => ({
        ...current,
        keepSignedIn,
        sessionUserId: account.id,
        users: current.users.map((item) =>
          item.id === account.id ? { ...item, lastSignIn: new Date().toISOString() } : item,
        ),
        audit: [
          {
            id: `a-login-${Date.now()}`,
            time: new Date().toISOString(),
            event: eventName,
            target: account.email,
            actor: account.email,
          },
          ...current.audit,
        ],
      }));
      return { ok: true };
    };

    const accountStatus = (account) => {
      if (!account.verified) return "Verify your email before signing in. An administrator can verify it from the users screen.";
      if (!account.active) return "This account is deactivated. Ask an administrator to reactivate it.";
      if (account.role === "Admin" && !isAdminUser(account)) return "Only the administrator email can open an admin session.";
      return "";
    };

    const login = ({ email, password, keepSignedIn }) => {
      const normalized = email.trim().toLowerCase();
      const account = state.users.find((item) => item.email.toLowerCase() === normalized);
      if (normalized === ADMIN_EMAIL && (!account || !isAdminUser(account))) {
        return { ok: false, message: "This email is reserved for the administrator." };
      }
      if (account?.provider === "google") {
        return { ok: false, message: "This account signs in with Google." };
      }
      if (!account || account.password !== password) {
        return { ok: false, message: "Invalid email or password." };
      }
      const blocked = accountStatus(account);
      if (blocked) return { ok: false, message: blocked };
      return openSession(account, keepSignedIn, "SIGN_IN");
    };

    const loginWithGoogle = ({ email, name, keepSignedIn }) => {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized.includes("@")) return { ok: false, message: "Choose a Google account email." };
      if (normalized === ADMIN_EMAIL) {
        return { ok: false, message: "The administrator signs in with the admin email and password only." };
      }
      const existing = state.users.find((item) => item.email.toLowerCase() === normalized);
      if (existing) {
        if (existing.role === "Admin") {
          return { ok: false, message: "The administrator signs in with the admin email and password only." };
        }
        const blocked = accountStatus(existing);
        if (blocked) return { ok: false, message: blocked };
        return openSession(existing, keepSignedIn, "GOOGLE_SIGN_IN");
      }
      const account = {
        id: `u-${Date.now()}`,
        name: String(name || "Google user").trim() || "Google user",
        email: normalized,
        password: null,
        provider: "google",
        role: "Clinician",
        facility: "Google account",
        verified: true,
        active: true,
        lastSignIn: null,
      };
      setState((current) => ({
        ...current,
        keepSignedIn,
        sessionUserId: account.id,
        users: [{ ...account, lastSignIn: new Date().toISOString() }, ...current.users],
        audit: [
          {
            id: `a-google-${account.id}`,
            time: new Date().toISOString(),
            event: "GOOGLE_SIGN_IN",
            target: account.email,
            actor: account.email,
          },
          ...current.audit,
        ],
      }));
      return { ok: true, created: true };
    };

    const logout = () => setState((current) => ({ ...current, sessionUserId: null }));

    const register = (draft) => {
      const email = draft.email.trim().toLowerCase();
      if (email === ADMIN_EMAIL) {
        return { ok: false, message: "This email is reserved for the administrator." };
      }
      if (state.users.some((item) => item.email.toLowerCase() === email)) {
        return { ok: false, message: "An account already exists for this email." };
      }
      const account = {
        id: `u-${Date.now()}`,
        name: draft.name.trim(),
        email,
        password: draft.password,
        role: draft.role === "Nurse" ? "Nurse" : "Clinician",
        facility: draft.facility?.trim() || "Not recorded",
        provider: "password",
        verified: false,
        active: true,
        lastSignIn: null,
      };
      setState((current) => ({
        ...current,
        users: [account, ...current.users],
        audit: [
          {
            id: `a-reg-${account.id}`,
            time: new Date().toISOString(),
            event: "USER_REGISTERED",
            target: email,
            actor: email,
          },
          ...current.audit,
        ],
      }));
      return { ok: true, email };
    };

    const verifyEmail = (email) => {
      const account = state.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!account) return { ok: false, message: "This verification link is invalid or expired." };
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === account.id ? { ...item, verified: true } : item)),
      }));
      return { ok: true };
    };

    const resetPassword = ({ email, password }) => {
      const account = state.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!account) return { ok: false, message: "This recovery link is invalid or expired." };
      if (isAdminUser(account)) return { ok: false, message: "The administrator password is not reset from this window." };
      if (account.provider === "google") return { ok: false, message: "This account signs in with Google." };
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === account.id ? { ...item, password } : item)),
      }));
      return { ok: true };
    };

    const changePassword = ({ currentPassword, nextPassword }) => {
      if (!user || user.password !== currentPassword) {
        return { ok: false, message: "Current password is incorrect." };
      }
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === user.id ? { ...item, password: nextPassword } : item)),
      }));
      return { ok: true };
    };

    const updateProfile = (patch) => {
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === user?.id ? { ...item, ...patch } : item)),
      }));
    };

    const updateSettings = (patch) => {
      if (!user) return;
      setState((current) => ({
        ...current,
        settings: { ...current.settings, [user.id]: { ...current.settings[user.id], ...patch } },
      }));
    };

    const submitCase = (draft) => {
      const numbers = state.cases.map((item) => Number(item.id.slice(-6)));
      const next = Math.max(131, ...numbers) + 1;
      const id = caseCode(next);
      const modality = draft.modality || (draft.echoFile && draft.ecgFile ? "both" : draft.ecgFile ? "ecg" : "echo");
      const paired = modality === "both" && draft.paired !== false;
      const salt = hashText(`${draft.patientId || ""}|${draft.patientName || draft.patientAlias || ""}|${draft.clinical || draft.notes || ""}|${draft.ecgFile?.name || ""}|${draft.echoFile?.name || ""}`);
      const kind = kindFromDraft({ ...draft, modality, paired }, salt);
      const createdAt = new Date().toISOString();
      const pending = {
        modality,
        paired,
        profile: profileFor(kind === "failed" ? "echo-normal" : kind, salt),
      };
      const syntheticEcg = { name: `sim_ecg_${id}.csv`, size: 1_200_000 };
      const syntheticEcho = { name: `sim_a4c_${id}.mp4`, size: 14_000_000 };
      const record = {
        id,
        createdAt,
        screeningDate: draft.screeningDate || createdAt.slice(0, 10),
        ownerId: user.id,
        notes: draft.clinical || draft.notes || "",
        clinical: draft.clinical || draft.notes || "",
        patientId: draft.patientId?.trim() || "",
        patientName: draft.patientName?.trim() || draft.patientAlias?.trim() || "",
        patientAlias: draft.patientAlias?.trim() || draft.patientName?.trim() || "",
        age: draft.age ?? draft.ageBand ?? "Not recorded",
        ageBand: draft.ageBand || (draft.age ? String(draft.age) : "Not recorded"),
        sex: draft.sex || "Not recorded",
        sample: false,
        paired,
        durationSec: 10,
        modality,
        ecgFile:
          modality === "echo"
            ? null
            : {
                ...(draft.ecgFile ? describeFile(draft.ecgFile) : describeFile(syntheticEcg)),
                detail: "Simulated demo input · resampled to 250 Hz",
              },
        echoFile:
          modality === "ecg"
            ? null
            : {
                ...(draft.echoFile ? describeFile(draft.echoFile) : describeFile(syntheticEcho)),
                detail: "Simulated demo clip · illustrative frames",
              },
        status: "processing",
        ecg: null,
        echo: null,
        fusion: null,
        triage: null,
        triageSource: null,
        triageReason: "Simulated analysis is running in this browser.",
        lowConfidenceModalities: [],
        error: null,
        timeline: [{ label: "Submitted", time: new Date().toLocaleTimeString("en-GB"), done: true }, { label: "Analysing", time: null, done: false }],
        completesAt: Date.now() + 2200,
        pending,
        pendingFail: kind === "failed" || draft.fail,
      };
      setState((current) => ({
        ...current,
        cases: [record, ...current.cases],
        audit: [
          {
            id: `a-case-${id}`,
            time: createdAt,
            event: "CASE_SUBMITTED",
            target: id,
            actor: user.email,
          },
          ...current.audit,
        ],
      }));
      return record;
    };

    const updateReferral = (id, status) => {
      setState((current) => ({
        ...current,
        referrals: current.referrals.map((item) => (item.id === id ? { ...item, status } : item)),
        audit: [
          {
            id: `a-ref-${Date.now()}`,
            time: new Date().toISOString(),
            event: "REFERRAL_UPDATED",
            target: `${id} → ${status}`,
            actor: user?.email || "unknown",
          },
          ...current.audit,
        ],
      }));
    };

    const updateUser = (id, patch) => {
      if (!isAdminUser(user)) return { ok: false, message: "Only the administrator can change accounts." };
      const target = state.users.find((item) => item.id === id);
      if (!target) return { ok: false, message: "That account is not in this workspace." };
      if (isAdminUser(target) && (patch.role && patch.role !== "Admin" || patch.active === false)) {
        return { ok: false, message: "The administrator account stays active with the Admin role." };
      }
      if (patch.role === "Admin" && target.id !== ADMIN_ID) {
        return { ok: false, message: "The Admin role is reserved for the administrator email." };
      }
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        audit: [
          {
            id: `a-user-${Date.now()}`,
            time: new Date().toISOString(),
            event: patch.verified ? "EMAIL_VERIFIED" : patch.role ? "ROLE_CHANGED" : patch.active === false ? "USER_DEACTIVATED" : "USER_REACTIVATED",
            target: patch.role ? `${target?.email} → ${patch.role}` : target?.email,
            actor: user.email,
          },
          ...current.audit,
        ],
      }));
      return { ok: true };
    };

    return {
      login,
      loginWithGoogle,
      logout,
      register,
      verifyEmail,
      resetPassword,
      changePassword,
      updateProfile,
      updateSettings,
      submitCase,
      updateReferral,
      updateUser,
    };
  }, [state.users, state.cases, user]);

  const value = {
    ...state,
    user,
    settings: {
      emailAlerts: true,
      reviewReminders: true,
      reminderThreshold: 0.7,
      showBanner: true,
      ...state.settings[user?.id],
    },
    ...api,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
