import { Link, useParams } from "react-router-dom";
import { PatientStrip, ProcessingPanel, SupportNote, WorkspaceNav } from "../components/screening/CaseChrome";
import Badge from "../components/ui/Badge";
import PageContainer from "../components/ui/PageContainer";
import { categoryOf, efBand, modalityLabel, nextAction } from "../data/format";
import { useScreening } from "../hooks/useScreening";

const TONE = {
  Normal: "border-emerald-200 bg-emerald-50",
  "Needs Review": "border-amber-200 bg-amber-50",
  "Urgent Referral": "border-red-200 bg-red-50",
};

export default function CaseResultPage() {
  const { caseId } = useParams();
  const { record, referral } = useScreening(caseId);
  if (!record) return <section className="card p-6 text-sm">This screening is not in your workspace.</section>;
  const category = categoryOf(record);
  const tone = TONE[record.triage] || "border-slate-200 bg-white";

  return (
    <PageContainer>
      <WorkspaceNav caseId={record.id} modality={record.modality} />
      <PatientStrip record={record} />
      <ProcessingPanel record={record} />
      {record.status === "completed" && (
        <>
          <section className={`result-slab rounded-2xl border px-5 py-6 ${tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Screening category</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold text-navy-950">{category}</h1>
              {record.triage && <Badge>{record.triage}</Badge>}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{record.triageReason}</p>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="card p-5">
              <h2 className="font-display text-base font-semibold">Key findings</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Modality: {modalityLabel(record.modality)}</li>
                {record.ecg && <li>ECG class: {record.ecg.predictedClass}</li>}
                {record.echo?.efAvailable && <li>Illustrative EF {Number(record.echo.ef).toFixed(1)}% · band {efBand(record.echo.ef)}</li>}
                {record.fusion && <li>Combined category from both modalities: {record.triage}</li>}
                {!record.fusion && record.modality === "both" && <li>Fusion was not produced. Both eligible inputs were not confirmed.</li>}
              </ul>
            </article>
            <article className="card p-5">
              <h2 className="font-display text-base font-semibold">Measurements</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {record.ecg && <li>Lead II · {record.ecg.samplingHz} Hz · illustrative rate {record.ecg.heartRate} bpm</li>}
                {record.echo?.efAvailable && (
                  <>
                    <li>EDV {record.echo.edv} mL · ESV {record.echo.esv} mL</li>
                    <li>EF {Number(record.echo.ef).toFixed(1)}% · simulated demo values</li>
                  </>
                )}
                {!record.ecg && !record.echo?.efAvailable && <li>No measurements are available.</li>}
              </ul>
            </article>
          </div>

          <section className="card p-5">
            <h2 className="font-display text-base font-semibold">Explainability summary</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {record.ecg ? `The ECG illustration was drawn for the class “${record.ecg.predictedClass}”. ` : ""}
              {record.echo?.efAvailable ? "ECHO volumes and the segmentation overlay are simulated. " : ""}
              {record.fusion ? "The combined category uses both demo inputs. " : ""}
              Confidence figures, when shown, are labelled as simulated demo data.
            </p>
            <p className="mt-3 text-sm font-medium text-navy-950">Recommended next action</p>
            <p className="mt-1 text-sm text-slate-600">{nextAction(record)}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to={`/cases/${record.id}/${record.modality === "echo" ? "echo" : "ecg"}`} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-slate-50">
              View case details
            </Link>
            {referral && (
              <Link to={`/referrals/${record.id}`} className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900">
                Generate Referral Summary
              </Link>
            )}
            <Link to="/" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-clinic-blue hover:bg-blue-50">
              Return to dashboard
            </Link>
          </div>
        </>
      )}
      <SupportNote />
    </PageContainer>
  );
}
