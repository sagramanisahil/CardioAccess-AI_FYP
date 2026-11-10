import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import Badge from "../components/ui/Badge";
import PageContainer from "../components/ui/PageContainer";
import { efBand, formatWhen, modalityLabel, nextAction, patientOf } from "../data/format";
import { useScreening } from "../hooks/useScreening";
import { useToast } from "../hooks/useToast";

export default function ReferralSummaryPage() {
  const { caseId } = useParams();
  const { record, referral } = useScreening(caseId);
  const { notify } = useToast();

  if (!record || !referral || (record.triage !== "Needs Review" && record.triage !== "Urgent Referral")) {
    return (
      <section className="card p-6 text-sm leading-6 text-slate-600">
        A referral summary is available only for Needs Review and Urgent Referral results.
        <div className="mt-3"><Link className="font-semibold text-clinic-blue" to="/referrals">Back to queue</Link></div>
      </section>
    );
  }

  const person = patientOf(record);
  const when = formatWhen(record.createdAt);

  return (
    <PageContainer>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referral</p>
          <h1 className="font-display text-2xl font-semibold">Referral summary</h1>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => {
            notify("Opening the print dialog.");
            window.print();
          }}
        >
          <Printer size={16} /> Print
        </button>
      </div>

      <article className="print-sheet card p-6 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="font-display text-lg font-semibold">CardioAccess AI</p>
            <p className="text-sm text-slate-500">Screening referral summary</p>
          </div>
          <Badge>{record.triage}</Badge>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <Block title="Patient">
            <p>{person.name}</p>
            <p>{person.id}</p>
            <p>{person.age} years · {person.sex}</p>
            <p>{person.clinical}</p>
          </Block>
          <Block title="Screening">
            <p>Case {record.id}</p>
            <p>Referral {referral.id}</p>
            <p>{when.both}</p>
            <p>{modalityLabel(record.modality)}</p>
            <p>Status: {referral.status}</p>
          </Block>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Findings</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {record.ecg && <li>ECG screening class: {record.ecg.predictedClass}. Lead II, {record.ecg.samplingHz} Hz. Simulated demo trace.</li>}
            {record.echo?.efAvailable && (
              <li>
                ECHO: EDV {record.echo.edv} mL, ESV {record.echo.esv} mL, EF {Number(record.echo.ef).toFixed(1)}% ({efBand(record.echo.ef)} band). Simulated demo measurements.
              </li>
            )}
            {record.fusion && <li>Combined interpretation uses both modalities: {record.triage}.</li>}
            <li>{record.triageReason}</li>
          </ul>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Block title="Triage category">{record.triage}</Block>
          <Block title="Referral recommendation">{nextAction(record)}</Block>
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          This summary matches the screening result for {record.id}. It supports referral decisions and is not a definitive diagnosis.
        </p>
      </article>
      <Link to="/referrals" className="no-print text-sm font-semibold text-clinic-blue">Back to queue</Link>
    </PageContainer>
  );
}

function Block({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-1 text-sm leading-6 text-navy-950">{children}</div>
    </div>
  );
}
