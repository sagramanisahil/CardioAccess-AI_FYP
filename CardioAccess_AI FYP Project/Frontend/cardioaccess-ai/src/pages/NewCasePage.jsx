import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AudioLines, FileAudio2, FileVideo2, HeartPulse, Upload, X } from "lucide-react";
import Button from "../components/ui/Button";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import { useApp } from "../hooks/useApp";
import { useToast } from "../hooks/useToast";

const MODES = [
  { id: "ecg", label: "ECG", detail: "12-lead rhythm screen", icon: Activity },
  { id: "echo", label: "ECHO", detail: "Ejection fraction screen", icon: HeartPulse },
  { id: "both", label: "Multimodal ECG + ECHO", detail: "Both inputs required", icon: AudioLines },
];

const today = new Date().toISOString().slice(0, 10);
const MAX_ECG_BYTES = 10 * 1024 * 1024;
const MAX_ECHO_BYTES = 100 * 1024 * 1024;

const FILE_RULES = {
  ecg: {
    label: "ECG recording",
    accept: ".zip,.csv",
    extensions: [".zip", ".csv"],
    maxBytes: MAX_ECG_BYTES,
    maxLabel: "10 MB",
    description: "WFDB ZIP archive or CSV with 12 lead columns",
    Icon: FileAudio2,
  },
  echo: {
    label: "Echocardiogram study",
    accept: ".avi,.mp4,.nii,.nii.gz",
    extensions: [".avi", ".mp4", ".nii", ".nii.gz"],
    maxBytes: MAX_ECHO_BYTES,
    maxLabel: "100 MB",
    description: "AVI, MP4, or NIfTI image sequence",
    Icon: FileVideo2,
  },
};

function formatFileSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function NewCasePage() {
  const navigate = useNavigate();
  const { submitCase } = useApp();
  const { notify } = useToast();
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    age: "",
    sex: "Female",
    clinical: "",
    screeningDate: today,
    modality: "ecg",
    ecgFile: null,
    echoFile: null,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const addFile = (modality, file) => {
    if (!file) return;
    const rules = FILE_RULES[modality];
    const lowerName = file.name.toLowerCase();
    if (!rules.extensions.some((extension) => lowerName.endsWith(extension))) {
      setError(`${rules.label} must be ${rules.description.toLowerCase()}.`);
      return;
    }
    if (file.size > rules.maxBytes) {
      setError(`${rules.label} must be ${rules.maxLabel} or smaller.`);
      return;
    }
    setError("");
    setForm((current) => ({ ...current, [`${modality}File`]: file }));
  };

  const removeFile = (modality) => {
    setForm((current) => ({ ...current, [`${modality}File`]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^PT-\d{4,}$/i.test(form.patientId.trim()) && form.patientId.trim().length < 3) {
      setError("Enter a patient ID.");
      return;
    }
    if (form.patientName.trim() && form.patientName.trim().length < 2) {
      setError("Enter at least two characters for the patient alias.");
      return;
    }
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Enter an age between 1 and 120.");
      return;
    }
    if (!form.sex) {
      setError("Select sex.");
      return;
    }
    if (form.clinical.trim().length < 8) {
      setError("Add a short clinical note.");
      return;
    }
    if (!form.screeningDate || form.screeningDate > today) {
      setError("Choose a screening date that is not in the future.");
      return;
    }
    if (form.modality === "ecg" && !form.ecgFile) {
      setError("Select an ECG recording to continue.");
      return;
    }
    if (form.modality === "echo" && !form.echoFile) {
      setError("Select an echocardiogram study to continue.");
      return;
    }
    if (form.modality === "both" && (!form.ecgFile || !form.echoFile)) {
      setError("Multimodal screening requires both an ECG recording and an echocardiogram study.");
      return;
    }
    setBusy(true);
    const result = await submitCase({
        patientId: form.patientId.trim(),
        patientName: form.patientName.trim(),
        age,
        sex: form.sex,
        clinical: form.clinical.trim(),
        screeningDate: form.screeningDate,
        modality: form.modality,
        paired: form.modality === "both",
        ecgFile: form.ecgFile,
        echoFile: form.echoFile,
      });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      notify(result.message);
      return;
    }
    const next = form.modality === "echo" ? "echo" : form.modality === "both" ? "multimodal" : "ecg";
    navigate(`/cases/${result.case.id}/${next}`);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Intake"
        title="New screening"
        description="Enter pseudonymous case details, choose a screening mode, and select the required input files."
      />
      <form onSubmit={submit} className="space-y-6">
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="font-display text-base font-semibold">Patient information</h2>
            <p className="mt-1 text-xs text-slate-500">Use a pseudonymous patient code. Do not enter direct identifiers.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="label">Patient ID</span><input className="field" value={form.patientId} onChange={set("patientId")} placeholder="PT-10920" /></label>
            <label><span className="label">Patient alias (optional)</span><input className="field" value={form.patientName} onChange={set("patientName")} placeholder="Optional pseudonym" /></label>
            <label><span className="label">Age</span><input className="field" inputMode="numeric" value={form.age} onChange={set("age")} /></label>
            <label>
              <span className="label">Sex</span>
              <select className="field" value={form.sex} onChange={set("sex")}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="label">Relevant clinical information</span>
              <textarea className="field min-h-24" value={form.clinical} onChange={set("clinical")} placeholder="Symptoms, history, and why screening was requested." />
            </label>
            <label>
              <span className="label">Screening date</span>
              <input className="field" type="date" max={today} value={form.screeningDate} onChange={set("screeningDate")} />
            </label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <div>
            <h2 className="font-display text-base font-semibold">Screening modality</h2>
            <p className="mt-1 text-xs text-slate-500">Multimodal requires both an ECG and an ECHO study.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const selected = form.modality === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setError("");
                  setForm((current) => ({ ...current, modality: mode.id }));
                }}
                className={`modality-card modality-${mode.id} ${selected ? "modality-on" : ""}`}
              >
                <Icon size={18} className={selected ? "text-white" : "text-clinic-blue"} />
                <span>
                  <span className={`block text-sm font-semibold ${selected ? "text-white" : "text-navy-950"}`}>{mode.label}</span>
                  <span className={`block text-xs ${selected ? "text-white/80" : "text-slate-500"}`}>{mode.detail}</span>
                </span>
              </button>
            );
          })}
          </div>

        </section>

        <section className="card space-y-4 p-5">
          <div>
            <h2 className="font-display text-base font-semibold">Input files</h2>
            <p className="mt-1 text-xs text-slate-500">Files are selected in this form. Upload and analysis start after the storage and FastAPI services are connected.</p>
          </div>
          <div className={`grid gap-4 ${form.modality === "both" ? "md:grid-cols-2" : "max-w-2xl"}`}>
            {form.modality !== "echo" && (
              <UploadField modality="ecg" file={form.ecgFile} onFile={addFile} onRemove={removeFile} />
            )}
            {form.modality !== "ecg" && (
              <UploadField modality="echo" file={form.echoFile} onFile={addFile} onRemove={removeFile} />
            )}
          </div>
        </section>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit case"}</Button>
      </form>
    </PageContainer>
  );
}

function UploadField({ modality, file, onFile, onRemove }) {
  const rules = FILE_RULES[modality];
  const Icon = rules.Icon;
  const inputId = `${modality}-upload`;

  return (
    <div>
      <label htmlFor={inputId} className="label mb-2 block">{rules.label}</label>
      {file ? (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <Icon size={20} className="shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(file.size)} · selected, not uploaded</p>
          </div>
          <button type="button" className="icon-btn" aria-label={`Remove ${rules.label}`} onClick={() => onRemove(modality)}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-clinic-blue hover:bg-blue-50/50">
          <Upload size={20} className="text-clinic-blue" />
          <span className="mt-2 text-sm font-semibold text-navy-950">Choose {modality === "ecg" ? "ECG recording" : "ECHO study"}</span>
          <span className="mt-1 text-xs text-slate-500">{rules.description}</span>
          <span className="mt-1 text-xs text-slate-400">Maximum {rules.maxLabel}</span>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept={rules.accept}
            onChange={(event) => {
              onFile(modality, event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
