import { Link, useParams } from "react-router-dom";
import { PatientStrip, ProcessingPanel, ReferralSummaryAction, SupportNote, WorkspaceNav } from "../components/screening/CaseChrome";
import Badge from "../components/ui/Badge";
import PageContainer from "../components/ui/PageContainer";
import { efBand } from "../data/format";
import { useScreening } from "../hooks/useScreening";

export default function MultimodalPage() {
  const { caseId } = useParams();
  const { record, referral } = useScreening(caseId);
  if (!record) return <section className="card p-6 text-sm">This screening is not in your workspace.</section>;

  const ecgReady = Boolean(record.ecg);
  const echoReady = Boolean(record.echo?.efAvailable);
  const fused = Boolean(record.fusion);

  return (
    <PageContainer>
      <WorkspaceNav caseId={record.id} modality={record.modality} />
      <PatientStrip record={record} />
      <ProcessingPanel record={record} />
      {record.status === "completed" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatusCard title="ECG input" ready={ecgReady} detail={ecgReady ? record.ecg.predictedClass : "No eligible ECG result for this patient."} />
            <StatusCard title="ECHO input" ready={echoReady} detail={echoReady ? `EF ${Number(record.echo.ef).toFixed(1)}% · ${efBand(record.echo.ef)}` : "No eligible ECHO measurements for this patient."} />
          </div>

          {!fused && (
            <section className="card border-amber-200 bg-amber-50 p-5">
              <h2 className="font-display text-base font-semibold text-navy-950">Multimodal fusion is unavailable</h2>
              <p className="mt-2 text-sm leading-6 text-amber-950">
                Fusion is enabled only when both an eligible ECG and an eligible ECHO are available for the same patient.
                A fused result is not created from a single modality.
              </p>
            </section>
          )}

          {fused && (
            <section className="fusion-grid grid gap-4 lg:grid-cols-3">
              <article className="card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">ECG screening result</h2>
                <p className="mt-2 font-display text-xl font-semibold">{record.ecg.predictedClass}</p>
                <p className="mt-2 text-xs text-slate-500">Simulated demo confidence {record.ecg.confidence.toFixed(2)}</p>
              </article>
              <article className="card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">ECHO screening result</h2>
                <p className="mt-2 font-display text-xl font-semibold">{efBand(record.echo.ef)}</p>
                <p className="mt-2 text-xs text-slate-500">Illustrative EF {Number(record.echo.ef).toFixed(1)}%</p>
              </article>
              <article className="card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Combined interpretation</h2>
                <div className="mt-2"><Badge>{record.triage}</Badge></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{record.triageReason}</p>
              </article>
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-display text-base font-semibold">Explainability</h2>
            {fused ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {Object.entries(record.fusion.probabilities).map(([name, value]) => (
                  <li key={name} className="flex items-center justify-between gap-4">
                    <span>{name}</span>
                    <span className="font-medium text-navy-950">{value.toFixed(2)} <span className="text-xs font-normal text-slate-400">simulated</span></span>
                  </li>
                ))}
                <li>Modality balance in this demo: ECG {record.fusion.gateEcg.toFixed(2)} · ECHO {record.fusion.gateEcho.toFixed(2)}.</li>
                <li>These figures explain the simulated fusion. They are not clinical performance metrics.</li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">There is no fusion explanation because both modalities were not eligible together.</p>
            )}
            <div className="mt-4 flex gap-4 text-sm font-semibold">
              {record.ecg && <Link className="text-clinic-blue" to={`/cases/${record.id}/ecg`}>ECG workspace</Link>}
              {record.echo && <Link className="text-clinic-blue" to={`/cases/${record.id}/echo`}>ECHO workspace</Link>}
            </div>
          </section>
          <ReferralSummaryAction record={record} referral={referral} />
        </>
      )}
      <SupportNote />
    </PageContainer>
  );
}

function StatusCard({ title, ready, detail }) {
  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <span className={`text-xs font-semibold ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? "Available" : "Missing"}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </article>
  );
}
