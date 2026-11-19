
import { Link, NavLink } from "react-router-dom";
import {
  AlertCircle,
  ClipboardList,
  FileText,
  LoaderCircle,
} from "lucide-react";

import Badge from "../ui/Badge";

import {
  caseStatus,
  formatWhen,
  patientOf,
} from "../../data/format";

function getCaseId(record) {
  return record?.databaseId || record?.id;
}

function getCaseCode(record) {
  return (
    record?.caseCode ||
    record?.case_code ||
    record?.id ||
    "Not available"
  );
}

function getCreatedAt(record) {
  return (
    record?.createdAt ||
    record?.created_at ||
    null
  );
}

function getTriage(record) {
  if (typeof record?.triage === "string") {
    return record.triage;
  }

  if (
    record?.triage &&
    typeof record.triage === "object"
  ) {
    return (
      record.triage.category ||
      record.triage.label ||
      null
    );
  }

  return null;
}

function isLowConfidence(record) {
  return (
    record?.lowConfidence === true ||
    record?.confidenceFlag === "low" ||
    record?.confidenceFlag === "low_confidence" ||
    (
      Array.isArray(record?.lowConfidenceModalities) &&
      record.lowConfidenceModalities.length > 0
    )
  );
}

function getModality(record) {
  if (
    (record?.has_ecg && record?.has_echo) ||
    record?.modality === "both"
  ) {
    return "ECG + Echo";
  }

  if (
    record?.has_ecg ||
    record?.ecgFile ||
    record?.modality === "ecg"
  ) {
    return "ECG";
  }

  if (
    record?.has_echo ||
    record?.echoFile ||
    record?.modality === "echo"
  ) {
    return "Echo";
  }

  return "Not recorded";
}

function hasEcg(record) {
  return Boolean(
    record?.has_ecg ||
    record?.ecgFile ||
    record?.ecg ||
    record?.modality === "ecg" ||
    record?.modality === "both"
  );
}

function hasEcho(record) {
  return Boolean(
    record?.has_echo ||
    record?.echoFile ||
    record?.echo ||
    record?.modality === "echo" ||
    record?.modality === "both"
  );
}

function getDisplayCategory(record) {
  const triage = getTriage(record);

  if (triage) {
    return triage;
  }

  if (
    record?.status === "draft" ||
    record?.status === "queued" ||
    record?.status === "processing"
  ) {
    return "Pending analysis";
  }

  if (record?.status === "failed") {
    return "Analysis failed";
  }

  if (record?.status === "partially_completed") {
    return "Partially completed";
  }

  if (
    record?.status === "completed" &&
    hasEcg(record) &&
    !hasEcho(record)
  ) {
    return "ECG class only";
  }

  return "Result unavailable";
}

export function WorkspaceNav({ caseId, modality }) {
  const tabs = [
    {
      to: `/cases/${caseId}`,
      label: "Results",
      end: true,
    },
    {
      to: `/cases/${caseId}/ecg`,
      label: "ECG",
      show: modality !== "echo",
    },
    {
      to: `/cases/${caseId}/echo`,
      label: "Echo",
      show: modality !== "ecg",
    },
    {
      to: `/cases/${caseId}/multimodal`,
      label: "Multimodal",
      show: modality === "both",
    },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs
        .filter((tab) => tab.show !== false)
        .map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? "border-clinic-blue text-clinic-blue"
                  : "border-transparent text-slate-500 hover:text-navy-950"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
    </div>
  );
}

export function PatientStrip({ record }) {
  const person = patientOf(record);
  const createdAt = getCreatedAt(record);

  const date = createdAt
    ? formatWhen(createdAt).day
    : "Not recorded";

  const category = getDisplayCategory(record);
  const status = caseStatus(record);

  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-[180px]">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Patient
        </div>

        <div className="font-display text-lg font-semibold text-navy-950">
          {person?.name || "Pseudonymous patient"}
        </div>

        <div className="text-sm text-slate-500">
          {person?.id || "Not recorded"}
        </div>
      </div>

      <Meta
        label="Screening"
        value={getCaseCode(record)}
      />

      <Meta
        label="Date"
        value={date}
      />

      <Meta
        label="Modality"
        value={getModality(record)}
      />

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Badge tone={category}>
          {category}
        </Badge>

        <Badge tone={status}>
          {status}
        </Badge>

        {isLowConfidence(record) && (
          <Badge tone="Needs Review">
            Low Confidence
          </Badge>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="text-sm font-medium text-navy-950">
        {value}
      </div>
    </div>
  );
}

export function ProcessingPanel({ record }) {
  if (!record) return null;

  if (record.status === "draft") {
    return (
      <section className="card border-l-4 border-l-blue-500 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-950">
          Screening draft
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          This case has been created but analysis
          has not been requested. No screening
          prediction is available yet.
        </p>
      </section>
    );
  }

  if (record.status === "queued") {
    return (
      <section className="card border-l-4 border-l-amber-500 p-6">
        <div className="flex items-center gap-3">
          <LoaderCircle
            size={20}
            className="text-amber-600"
          />

          <h2 className="font-display text-lg font-semibold text-navy-950">
            Analysis queued
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          This case is queued for analysis.
          Screening results will become available
          when backend processing completes.
        </p>
      </section>
    );
  }

  if (record.status === "processing") {
    return (
      <section className="card p-6">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />

        <div className="mt-4 h-3 w-full max-w-lg animate-pulse rounded bg-slate-100" />

        <div className="mt-2 h-3 w-2/3 max-w-md animate-pulse rounded bg-slate-100" />

        <p className="mt-4 text-sm text-slate-600">
          The analysis service is processing this
          case. No final screening result should
          be assumed until processing completes.
        </p>
      </section>
    );
  }

  if (record.status === "partially_completed") {
    return (
      <section className="card border-l-4 border-l-amber-500 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle
            size={20}
            className="text-amber-600"
          />

          <h2 className="font-display text-lg font-semibold text-navy-950">
            Analysis partially completed
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Some analysis outputs may be available,
          but the complete screening workflow
          has not finished successfully. Review
          only the results actually returned by
          the backend.
        </p>
      </section>
    );
  }

  if (record.status === "failed") {
    return (
      <section className="card border-l-4 border-l-red-600 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-950">
          Analysis unavailable
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {record.error ||
            "The analysis could not be completed. No final screening result is available."}
        </p>
      </section>
    );
  }

  return null;
}

export function SupportNote() {
  return (
    <p className="text-xs leading-5 text-slate-500">
      CardioAccess AI provides preliminary
      screening support only. Results, triage
      categories, and confidence indicators
      are not definitive diagnoses. A qualified
      healthcare professional must interpret
      the findings and determine appropriate
      next steps.
    </p>
  );
}

/*
  Compatibility export:

  Existing pages may still import
  ReferralSummaryAction.

  The old referral-summary functionality is
  replaced by the AI Summary Report display.

  This component does not generate reports.
*/
export function ReferralSummaryAction({
  record,
  referral: _referral,
}) {
  if (!record) return null;

  const caseId = getCaseId(record);

  const report =
    record.aiReport ||
    record.ai_report ||
    null;

  const hasReport = Boolean(
    report &&
    (
      typeof report === "string" ||
      report.id ||
      report.content ||
      report.summary ||
      report.report_text
    )
  );

  const analysisComplete =
    record.status === "completed" ||
    record.status === "partially_completed";

  if (!analysisComplete) {
    return null;
  }

  const triage = getTriage(record);

  const flagged =
    triage === "Needs Review" ||
    triage === "Urgent Referral" ||
    isLowConfidence(record);

  return (
    <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="max-w-xl">
        <div className="flex items-center gap-2">
          <FileText
            size={19}
            className="text-clinic-blue"
          />

          <h2 className="font-display text-base font-semibold">
            AI Summary Report
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {hasReport
            ? "An AI-generated informational summary is available for this screening. Review it alongside the underlying findings and uncertainty information."
            : "No AI Summary Report is currently available for this case. Reports are produced by the backend analysis workflow, not generated manually from this page."}
        </p>

        {flagged && (
          <p className="mt-2 flex items-start gap-2 text-sm text-amber-700">
            <ClipboardList
              size={16}
              className="mt-0.5 shrink-0"
            />

            This screening has a review flag.
            A healthcare professional should
            assess the available results.
          </p>
        )}
      </div>

      {hasReport && caseId && (
        <Link
          to={`/cases/${caseId}`}
          className="btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        >
          View Case Results
        </Link>
      )}
    </section>
  );
}
