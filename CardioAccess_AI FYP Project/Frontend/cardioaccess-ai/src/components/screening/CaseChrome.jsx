import { Link, NavLink } from "react-router-dom";
import Badge from "../ui/Badge";
import { caseStatus, categoryOf, formatWhen, modalityLabel, patientOf } from "../../data/format";

export function WorkspaceNav({ caseId, modality }) {
  const tabs = [
    { to: `/cases/${caseId}`, label: "Results", end: true },
    { to: `/cases/${caseId}/ecg`, label: "ECG", show: modality !== "echo" },
    { to: `/cases/${caseId}/echo`, label: "ECHO", show: modality !== "ecg" },
    { to: `/cases/${caseId}/multimodal`, label: "Multimodal", show: true },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.filter((tab) => tab.show !== false).map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${isActive ? "border-clinic-blue text-clinic-blue" : "border-transparent text-slate-500 hover:text-navy-950"}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export function PatientStrip({ record }) {
  const person = patientOf(record);
  const when = formatWhen(record.createdAt);
  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-[180px]">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Patient</div>
        <div className="font-display text-lg font-semibold text-navy-950">{person.name}</div>
        <div className="text-sm text-slate-500">{person.id} · {person.age} yrs · {person.sex}</div>
      </div>
      <Meta label="Screening" value={record.id} />
      <Meta label="Date" value={when.day} />
      <Meta label="Modality" value={modalityLabel(record.modality)} />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Badge tone={categoryOf(record)}>{categoryOf(record)}</Badge>
        <Badge tone={caseStatus(record)}>{caseStatus(record)}</Badge>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-medium text-navy-950">{value}</div>
    </div>
  );
}

export function ProcessingPanel({ record }) {
  if (record.status === "processing") {
    return (
      <section className="card p-6">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-3 w-full max-w-lg animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-2/3 max-w-md animate-pulse rounded bg-slate-100" />
        <p className="mt-4 text-sm text-slate-600">Simulated analysis is running in this browser. The result will appear here in a moment.</p>
      </section>
    );
  }
  if (record.status === "failed") {
    return (
      <section className="card border-red-200 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-950">Analysis unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{record.error || record.triageReason}</p>
      </section>
    );
  }
  return null;
}

export function SupportNote() {
  return (
    <p className="text-xs leading-5 text-slate-500">
      These results support screening and referral decisions. They are not a definitive diagnosis.
    </p>
  );
}

export function ReferralSummaryAction({ record, referral }) {
  if (!record || record.status !== "completed") return null;
  const ready = Boolean(referral);
  return (
    <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="max-w-xl">
        <h2 className="font-display text-base font-semibold">Referral summary</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {ready
            ? "This screening is in the referral queue. The summary uses the result already shown on this page."
            : "A summary is available only when the result is Needs Review or Urgent Referral. Normal results and ECG-only classes do not enter the queue."}
        </p>
      </div>
      {ready ? (
        <Link to={`/referrals/${record.id}`} className="btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
          Generate Referral Summary
        </Link>
      ) : (
        <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300">
          Generate Referral Summary
        </button>
      )}
    </section>
  );
}
