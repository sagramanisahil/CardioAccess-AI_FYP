import { Link, useParams } from "react-router-dom";
import ECGWaveform from "../components/ecg/ECGWaveform";
import { PatientStrip, ProcessingPanel, ReferralSummaryAction, SupportNote, WorkspaceNav } from "../components/screening/CaseChrome";
import Badge from "../components/ui/Badge";
import PageContainer from "../components/ui/PageContainer";
import { useScreening } from "../hooks/useScreening";

export default function EcgAnalysisPage() {
  const { caseId } = useParams();
  const { record, referral } = useScreening(caseId);
  if (!record) return <Missing />;

  return (
    <PageContainer>
      <WorkspaceNav caseId={record.id} modality={record.modality} />
      <PatientStrip record={record} />
      <ProcessingPanel record={record} />
      {record.status === "completed" && !record.ecg && (
        <section className="card p-6 text-sm text-slate-600">This screening has no ECG input, so an ECG result is not shown.</section>
      )}
      {record.ecg && (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.7fr]">
          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Lead II waveform</h2>
                <p className="text-sm text-slate-500">{record.ecgFile?.name} · {record.ecg.durationSec}s · sampling frequency {record.ecg.samplingHz} Hz</p>
              </div>
              <Badge tone={record.ecg.predictedClass}>{record.ecg.predictedClass}</Badge>
            </div>
            <ECGWaveform
              predictedClass={record.ecg.predictedClass}
              seed={Number(record.id.slice(-4))}
              quality={record.ecg.lowConfidence ? "Limited" : "Suitable"}
            />
          </section>
          <aside className="space-y-4">
            <section className="card p-5">
              <h2 className="font-display text-base font-semibold">Analysis result</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Screening class: <span className="font-semibold text-navy-950">{record.ecg.predictedClass}</span>. This labels the simulated trace for review. It is not a diagnosis.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Simulated demo confidence</p>
              <p className="mt-1 font-display text-2xl font-semibold text-navy-950">{record.ecg.confidence.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Shown only as simulated demo data. Entropy {record.ecg.entropy.toFixed(2)}.</p>
            </section>
            <section className="card p-5">
              <h2 className="font-display text-base font-semibold">Explainability</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Classes: Normal, Arrhythmia, Ischemic (MI-related), Other Abnormal.</li>
                <li>Highlighted bands on the trace are illustrative, not measured intervals.</li>
                <li>{record.ecg.lowConfidence ? "The demo confidence is limited, so the class should be read with extra caution." : "The demo signal was marked suitable for this illustration."}</li>
                <li>Heart rate shown for the illustration: {record.ecg.heartRate} bpm.</li>
              </ul>
            </section>
            <Link to={`/cases/${record.id}`} className="inline-flex text-sm font-semibold text-clinic-blue">Open screening result</Link>
          </aside>
        </div>
      )}
      {record.ecg && <ReferralSummaryAction record={record} referral={referral} />}
      <SupportNote />
    </PageContainer>
  );
}

function Missing() {
  return <section className="card p-6 text-sm text-slate-600">This screening is not in your workspace.</section>;
}
