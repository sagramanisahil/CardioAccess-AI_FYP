import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AudioLines, HeartPulse } from "lucide-react";
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
    ecgReady: true,
    echoReady: true,
  });
  const [error, setError] = useState("");
  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (!/^PT-\d{4,}$/i.test(form.patientId.trim()) && form.patientId.trim().length < 3) {
      setError("Enter a patient ID.");
      return;
    }
    if (form.patientName.trim().length < 2) {
      setError("Enter the patient name.");
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
    if (form.modality === "ecg" && !form.ecgReady) {
      setError("Confirm that an ECG recording is available.");
      return;
    }
    if (form.modality === "echo" && !form.echoReady) {
      setError("Confirm that an ECHO study is available.");
      return;
    }
    if (form.modality === "both" && (!form.ecgReady || !form.echoReady)) {
      setError("Multimodal screening needs both an eligible ECG and an eligible ECHO for this patient.");
      return;
    }
    const record = submitCase({
      patientId: form.patientId.trim(),
      patientName: form.patientName.trim(),
      age,
      sex: form.sex,
      clinical: form.clinical.trim(),
      screeningDate: form.screeningDate,
      modality: form.modality,
      paired: form.modality === "both",
      fail: /unreadable/i.test(form.clinical),
    });
    notify("Screening started. Simulated analysis is running.");
    const next = form.modality === "echo" ? "echo" : form.modality === "both" ? "multimodal" : "ecg";
    navigate(`/cases/${record.id}/${next}`);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Intake"
        title="New screening"
        description="Record the patient and choose a modality. Analysis on the next screen uses simulated demo signals, not an uploaded study."
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="label">Patient ID</span><input className="field" value={form.patientId} onChange={set("patientId")} placeholder="PT-10920" /></label>
            <label><span className="label">Patient name</span><input className="field" value={form.patientName} onChange={set("patientName")} /></label>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Continue</Button>
        </section>

        <aside className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modality</p>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const selected = form.modality === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setForm((current) => ({ ...current, modality: mode.id }))}
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

          <div className="card space-y-3 p-4 text-sm">
            {form.modality !== "echo" && (
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={form.ecgReady} onChange={set("ecgReady")} />
                <span>ECG recording available · simulated 12-lead input at 250 Hz</span>
              </label>
            )}
            {form.modality !== "ecg" && (
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={form.echoReady} onChange={set("echoReady")} />
                <span>ECHO study available · simulated apical frames for EF screening</span>
              </label>
            )}
            {form.modality === "both" && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                Multimodal fusion runs only when both eligible ECG and ECHO inputs are confirmed for the same patient.
              </p>
            )}
            {form.modality === "ecg" && <p className="text-xs leading-5 text-slate-500">The ECG workspace will show a simulated Lead II trace and a four-class screening result.</p>}
            {form.modality === "echo" && <p className="text-xs leading-5 text-slate-500">The ECHO workspace will show simulated frames, EDV, ESV, and an EF band.</p>}
          </div>
        </aside>
      </form>
    </PageContainer>
  );
}
