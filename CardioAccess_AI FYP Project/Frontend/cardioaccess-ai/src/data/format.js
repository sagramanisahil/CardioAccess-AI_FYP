export function caseCode(n) {
  return `CA-2026-${String(n).padStart(6, "0")}`;
}

export function referralCode(caseId) {
  return `RF-${caseId.slice(3)}`;
}

export function formatWhen(iso) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const clock = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { day, time, both: `${day}, ${time}`, clock };
}

export function modalityLabel(modality) {
  if (modality === "both") return "Multimodal ECG + ECHO";
  if (modality === "ecg") return "ECG";
  if (modality === "echo") return "ECHO";
  return "—";
}

export function categoryOf(record) {
  if (!record) return "—";
  if (record.status === "processing") return "Processing";
  if (record.status === "failed") return "Failed";
  if (record.triage) return record.triage;
  if (record.ecg?.predictedClass) return record.ecg.predictedClass;
  return "No category";
}

export function caseStatus(record) {
  if (record?.status === "completed") return "Completed";
  if (record?.status === "processing") return "Processing";
  if (record?.status === "failed") return "Failed";
  return record?.status || "—";
}

export function patientOf(record) {
  return {
    id: record?.patientId || "—",
    name: record?.patientName || record?.patientAlias || "Unnamed patient",
    age: record?.age ?? "—",
    sex: record?.sex || "—",
    clinical: record?.clinical || record?.notes || "",
    date: record?.screeningDate || record?.createdAt?.slice(0, 10) || "",
  };
}

export function efBand(ef) {
  if (ef == null || Number.isNaN(Number(ef))) return null;
  if (ef > 50) return "Normal";
  if (ef > 40) return "Needs Review";
  return "Urgent Referral";
}

export function nextAction(record) {
  if (!record) return "";
  if (record.status === "processing") return "Analysis is still running in this browser.";
  if (record.status === "failed") return "Repeat the recording. No screening category was produced.";
  if (record.triage === "Urgent Referral") return "Priority referral for clinician review. This is screening support, not a diagnosis.";
  if (record.triage === "Needs Review") return "Route to the referral queue for clinician review before a decision.";
  if (record.triage === "Normal") return "No referral is created. Continue routine care according to local protocol.";
  if (record.ecg) return "ECG class is shown for screening support. A referral triage category is not assigned from ECG alone.";
  return "Review the available screening information.";
}

export function initials(name) {
  return name
    .split(" ")
    .filter((part) => part && part !== "Dr.")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function passwordChecks(password, confirm) {
  return {
    length: password.length >= 8,
    letterNumber: /[A-Za-z]/.test(password) && /\d/.test(password),
    match: password.length > 0 && password === confirm,
  };
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const ECG_ACCEPT = [".zip", ".csv", ".hea", ".dat"];
export const ECHO_ACCEPT = [".avi", ".mp4", ".nii", ".gz"];

export function extensionOk(name, allowed) {
  const lower = name.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
