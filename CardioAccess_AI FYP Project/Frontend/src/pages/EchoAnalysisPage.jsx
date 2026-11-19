import { Link, useParams } from "react-router-dom";
import EchoViewer from "../components/echo/EchoViewer";
import { PatientStrip, ProcessingPanel, ReferralSummaryAction, SupportNote, WorkspaceNav } from "../components/screening/CaseChrome";
import Badge from "../components/ui/Badge";
import PageContainer from "../components/ui/PageContainer";
import { efBand } from "../data/format";
import { useScreening } from "../hooks/useScreening";

export default function EchoAnalysisPage() {
  const { caseId } = useParams();
  const { record, referral } = useScreening(caseId);
  if (!record) return <section className="card p-6 text-sm">This screening is not in your workspace.</section>;
  const band = record.echo ? efBand(record.echo.ef) : null;

  return (
    <PageContainer>
      <WorkspaceNav caseId={record.id} modality={record.modality} />
      <PatientStrip record={record} />
      <ProcessingPanel record={record} />
      {record.status === "completed" && !record.echo && (
        <section className="card p-6 text-sm text-slate-600">This screening has no ECHO input, so echo measurements are not shown.</section>
      )}
      {record.echo && (
        <>
          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Echocardiography viewer</h2>
                <p className="text-sm text-slate-500">{record.echoFile?.name || "Simulated clip"} · {record.echo.frameCount} frames · {record.echo.fps} fps</p>
              </div>
              {record.triage && <Badge>{record.triage}</Badge>}
            </div>
            <EchoViewer echo={record.echo} />
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <article className="card p-5">
              <h2 className="font-display text-base font-semibold">Screening interpretation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {band
                  ? `The illustrated EF of ${Number(record.echo.ef).toFixed(1)}% falls in the ${band} band.`
                  : "EF could not be shown."}
                {record.echo.lowConfidence ? " Uncertainty is high, so the applied category is Needs Review." : ""}
                {" "}Applied category: {record.triage || "not assigned"}.
              </p>
              <p className="mt-3 text-xs text-slate-500">{record.triageReason}</p>
            </article>
            <article className="card p-5">
              <h2 className="font-display text-base font-semibold">Analysis summary</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>EDV {record.echo.edv ?? "—"} mL</li>
                <li>ESV {record.echo.esv ?? "—"} mL</li>
                <li>EF {record.echo.efAvailable ? `${Number(record.echo.ef).toFixed(1)}%` : "Unavailable"}</li>
                <li>ED frame {record.echo.edFrame} · ES frame {record.echo.esFrame}</li>
              </ul>
              <p className="mt-3 text-xs leading-5 text-slate-500">Measurements and frames are simulated demo content, not a clinical study result.</p>
            </article>
          </section>
          <Link to={`/cases/${record.id}`} className="text-sm font-semibold text-clinic-blue">Open screening result</Link>
          <ReferralSummaryAction record={record} referral={referral} />
        </>
      )}
      <SupportNote />
    </PageContainer>
  );
}
