import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Flag } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EchoViewer from "../echo/EchoViewer";
import LeadWaveform, { TwelveLead } from "../ecg/LeadWaveform";
import { LEADS } from "../ecg/leads";
import { downloadText } from "../../data/format";
import { summaryText } from "../../data/summaryText";
import { ECG_CLASSES } from "../../data/simulate";

const BAR = {
  Normal: "bg-emerald-500",
  Arrhythmia: "bg-blue-500",
  "Ischemic (MI-related)": "bg-red-500",
  "Other Abnormal": "bg-violet-500",
};

const BANNER = {
  Normal: "border-l-emerald-500 bg-emerald-50/80",
  "Needs Review": "border-l-amber-500 bg-amber-50/80",
  "Urgent Referral": "border-l-red-500 bg-red-50/80",
  "No category": "border-l-slate-300 bg-slate-50",
};

export function TriageBanner({ record, referral }) {
  const label = record.triage || "No category";
  return (
    <div className={`card flex flex-wrap items-center justify-between gap-4 border-l-4 p-5 ${BANNER[label] || BANNER["No category"]}`}>
      <div className="flex items-start gap-3">
        <Badge tone={label}>{label}</Badge>
        <div>
          <p className="max-w-3xl text-sm leading-6 text-slate-700">{record.triageReason}</p>
          <p className="mt-1 text-xs text-slate-500">Screening support only. This is not a confirmed diagnosis.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {record.lowConfidenceModalities?.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
            <Flag size={12} /> Low confidence: {record.lowConfidenceModalities.join(", ")}
          </span>
        )}
        <Button variant="secondary" onClick={() => downloadText(`${record.id}-summary.txt`, summaryText(record))}>
          <Download size={14} /> Summary
        </Button>
        {referral && (
          <Link to={`/referrals/${record.id}`} className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-clinic-blue ring-1 ring-slate-200">
            Referral summary
          </Link>
        )}
      </div>
    </div>
  );
}

export function EcgPanel({ record, expanded = false }) {
  const [lead, setLead] = useState("II");
  const [allLeads, setAllLeads] = useState(false);
  if (!record.ecg) {
    return (
      <section className="card p-5">
        <h2 className="font-display text-base font-semibold">ECG analysis</h2>
        <p className="mt-2 text-sm text-slate-500">No ECG file was submitted for this case. Fusion is not shown from an echo-only record.</p>
      </section>
    );
  }
  const seed = Number(record.id.slice(-4));
  const ordered = [...ECG_CLASSES].sort(
    (a, b) => record.ecg.probabilities[b] - record.ecg.probabilities[a],
  );
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clinic-mute">Electrocardiogram</p>
          <h2 className="font-display text-lg font-semibold">ECG analysis</h2>
          <p className="mt-1 text-xs text-slate-500">{record.ecg.model} · {record.ecg.samplingHz} Hz · 10 s window · simulated Grad-CAM saliency</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Predicted class</div>
          <div className="font-display text-base font-semibold">{record.ecg.predictedClass}</div>
          {record.ecg.lowConfidence && <div className="mt-1"><Badge tone="purple">confidence {record.ecg.confidence.toFixed(2)}</Badge></div>}
        </div>
      </div>
      {allLeads ? (
        <TwelveLead predictedClass={record.ecg.predictedClass} seed={seed} />
      ) : (
        <LeadWaveform predictedClass={record.ecg.predictedClass} seed={seed} lead={lead} />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {LEADS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setAllLeads(false);
              setLead(item);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!allLeads && lead === item ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAllLeads(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${allLeads ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          All 12 leads
        </button>
      </div>
      {lead !== "II" && !allLeads && (
        <p className="mt-2 text-xs text-slate-500">Classification uses the standardized recording. This lead is a simulated display trace.</p>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2.5">
          {ordered.map((name) => (
            <div key={name} className="grid grid-cols-[minmax(0,150px)_1fr_36px] items-center gap-2 text-xs">
              <span className={name === record.ecg.predictedClass ? "font-semibold text-slate-800" : "text-slate-500"}>{name}</span>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${BAR[name]}`} style={{ width: `${record.ecg.probabilities[name] * 100}%` }} />
              </div>
              <span className="text-right text-slate-500">{record.ecg.probabilities[name].toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <div className="font-semibold text-slate-700">Confidence and uncertainty</div>
          <p className="mt-1">Confidence {record.ecg.confidence.toFixed(2)} is the probability of the predicted class. Predictive entropy {record.ecg.entropy.toFixed(2)} is the uncertainty across the four classes. They are not interchangeable.</p>
          <p className="mt-2">{record.ecg.lowConfidence ? "Entropy exceeds the review threshold and is flagged for professional review." : "Entropy is within the demonstration threshold."}</p>
          {expanded && <p className="mt-2">Heart rate on the simulated trace is about {record.ecg.heartRate} bpm.</p>}
        </div>
      </div>
      <details className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Technical details</summary>
        <p className="mt-2 leading-5">Compatible demonstration files are treated as 12-lead recordings resampled to 250 Hz. The waveform is a simulated trace for the predicted class. Pink bands are a simulated Grad-CAM explanation, not a device measurement and not proof of clinical correctness. Other lead views are display traces and are not separately classified.</p>
      </details>
    </section>
  );
}

export function EchoPanel({ record }) {
  if (!record.echo) {
    return (
      <section className="card p-5">
        <h2 className="font-display text-base font-semibold">Echocardiography analysis</h2>
        <p className="mt-2 text-sm text-slate-500">No echocardiography file was submitted for this case.</p>
      </section>
    );
  }
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clinic-mute">Echocardiography</p>
          <h2 className="font-display text-lg font-semibold">Left ventricular assessment</h2>
          <p className="mt-1 text-xs text-slate-500">{record.echo.model} · simulated ED and ES frames</p>
        </div>
        {record.echo.lowConfidence && <Badge tone="purple">Low confidence</Badge>}
      </div>
      <EchoViewer echo={record.echo} />
      <details className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Technical details</summary>
        <p className="mt-2 leading-5">ED and ES frames, the LV outline, EDV, ESV, and EF are simulated demonstration outputs. Screening confidence is the reduced-EF probability. Uncertainty is the spread around the EF estimate. They are not interchangeable, and they are not a diagnosis.</p>
      </details>
    </section>
  );
}

export function FusionPanel({ record }) {
  if (record.modality !== "both") {
    return (
      <section className="card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clinic-mute">Multimodal</p>
        <h2 className="font-display text-lg font-semibold">Fusion not available</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Fusion runs only when both an ECG and an echocardiogram are submitted and marked as the same case. A single modality never displays a fused result.</p>
      </section>
    );
  }
  if (!record.paired || !record.fusion) {
    return (
      <section className="card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clinic-mute">Multimodal</p>
        <h2 className="font-display text-lg font-semibold">Pairing not confirmed</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Both files were received, but pairing was not confirmed, so the fusion model was not run. Each modality can still be reviewed on its own.</p>
      </section>
    );
  }
  const probs = record.fusion.probabilities;
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Patient-paired · fusion eligible</p>
        <h2 className="font-display text-lg font-semibold">Combined screening result</h2>
        <p className="mt-1 text-xs text-slate-500">{record.fusion.model} · simulated gated fusion · uncertainty {record.fusion.uncertainty.toFixed(2)}</p>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-2.5">
          {Object.entries(probs).map(([name, value]) => (
            <div key={name} className="grid grid-cols-[140px_1fr_36px] items-center gap-2 text-xs">
              <span className="font-medium text-slate-700">{name}</span>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-clinic-blue" style={{ width: `${value * 100}%` }} />
              </div>
              <span className="text-right">{value.toFixed(2)}</span>
            </div>
          ))}
          <p className="pt-2 text-xs leading-5 text-slate-500">Confidence is the fused probability of the selected category. Uncertainty {record.fusion.uncertainty.toFixed(2)} describes spread in the fused output. They are separate values.</p>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-500">Modality contribution · simulated gate weights</div>
          <div className="gate-bar">
            <div className="flex items-center bg-clinic-blue px-3" style={{ width: `${record.fusion.gateEcg * 100}%` }}>
              ECG {record.fusion.gateEcg.toFixed(2)}
            </div>
            <div className="flex items-center justify-end bg-teal-600 px-3" style={{ width: `${record.fusion.gateEcho * 100}%` }}>
              Echo {record.fusion.gateEcho.toFixed(2)}
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Gate weights are a simulated demonstration of modality reliance. They are not a clinical attribution of cause.</p>
        </div>
      </div>
    </section>
  );
}

export function Timeline({ record }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-display text-base font-semibold">Processing timeline</h2>
      <ol className="flex flex-wrap gap-3">
        {record.timeline.map((step) => (
          <li key={step.label} className="min-w-[140px] flex-1 rounded-2xl bg-slate-50 px-3 py-3">
            <span className={`mb-2 block h-2 w-2 rounded-full ${step.done ? "bg-emerald-500" : "bg-slate-300 pulse-dot"}`} />
            <div className="text-sm font-medium">{step.label}</div>
            <div className="text-xs text-slate-400">{step.time || "In progress"}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StatusNotice({ record }) {
  if (record.status === "processing") {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-3 text-sm text-blue-800">
          <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-clinic-blue" />
          Simulated analysis is running. This page updates when the demonstration result is ready.
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-3 w-2/3 rounded-full" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (record.status === "failed") {
    return <div className="card border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-800">{record.error}. No class, EF, or triage value was invented for this file.</div>;
  }
  return null;
}
