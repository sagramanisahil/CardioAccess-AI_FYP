
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";

import {
  formatWhen,
  patientOf,
} from "../data/format";

import { useCases } from "../hooks/useCases";

const FILTERS = [
  "All",
  "Urgent Referral",
  "Needs Review",
  "Low Confidence",
];

function getTriage(record) {
  if (typeof record.triage === "string") {
    return record.triage;
  }

  if (
    record.triage &&
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
    record.lowConfidence === true ||
    record.confidenceFlag === "low" ||
    record.confidenceFlag === "low_confidence" ||
    (
      Array.isArray(record.lowConfidenceModalities) &&
      record.lowConfidenceModalities.length > 0
    )
  );
}

function getReviewFlags(record) {
  const flags = [];
  const triage = getTriage(record);

  if (triage === "Urgent Referral") {
    flags.push("Urgent Referral");
  }

  if (triage === "Needs Review") {
    flags.push("Needs Review");
  }

  if (isLowConfidence(record)) {
    flags.push("Low Confidence");
  }

  return flags;
}

function getPriority(flags) {
  if (flags.includes("Urgent Referral")) {
    return 0;
  }

  if (flags.includes("Needs Review")) {
    return 1;
  }

  return 2;
}

function getReviewDescription(flags) {
  if (flags.includes("Urgent Referral")) {
    return "Screening output flagged for urgent professional assessment.";
  }

  if (flags.includes("Needs Review")) {
    return "Screening output requires professional review.";
  }

  return "Model confidence is low. Review the available results and uncertainty information.";
}

function getModality(record) {
  if (record.has_ecg && record.has_echo) {
    return "ECG + Echo";
  }

  if (record.has_ecg || record.ecgFile || record.ecg) {
    return "ECG";
  }

  if (record.has_echo || record.echoFile || record.echo) {
    return "Echo";
  }

  if (record.modality === "both") {
    return "ECG + Echo";
  }

  if (record.modality === "ecg") {
    return "ECG";
  }

  if (record.modality === "echo") {
    return "Echo";
  }

  return "Not recorded";
}

export default function ReferralQueuePage() {
  const {
    cases = [],
    casesLoading,
    casesError,
  } = useCases();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const flaggedCases = useMemo(() => {
    return cases
      .map((record) => ({
        record,
        flags: getReviewFlags(record),
      }))
      .filter((item) => item.flags.length > 0);
  }, [cases]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return flaggedCases
      .filter(
        (item) =>
          filter === "All" ||
          item.flags.includes(filter)
      )
      .filter((item) => {
        if (!search) return true;

        const person = patientOf(item.record);

        const searchable = [
          person.name,
          person.id,
          item.record.caseCode,
          item.record.id,
          ...item.flags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      })
      .sort((a, b) => {
        const priorityDifference =
          getPriority(a.flags) -
          getPriority(b.flags);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          new Date(b.record.createdAt || 0).getTime() -
          new Date(a.record.createdAt || 0).getTime()
        );
      });
  }, [flaggedCases, filter, query]);

  const urgentCount = flaggedCases.filter(
    (item) =>
      item.flags.includes("Urgent Referral")
  ).length;

  const reviewCount = flaggedCases.filter(
    (item) =>
      item.flags.includes("Needs Review")
  ).length;

  const lowConfidenceCount = flaggedCases.filter(
    (item) =>
      item.flags.includes("Low Confidence")
  ).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Screening Support"
        title="Screening Review"
        description="Review screening cases flagged for professional attention based on available triage and confidence results."
      />

      {/* Clinical safety notice */}
      <section className="card border-l-4 border-l-blue-600 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert
            size={22}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <h2 className="font-semibold text-navy-950">
              Clinical review required
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              CardioAccess AI provides preliminary
              screening support only. Screening categories
              and confidence flags are not diagnoses or
              autonomous referral decisions. A qualified
              healthcare professional must interpret the
              results and determine appropriate next steps.
            </p>
          </div>
        </div>
      </section>

      {/* Summary counts */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Flagged Cases"
          value={flaggedCases.length}
          subtitle="Cases requiring attention"
          color="blue"
        />

        <SummaryCard
          title="Urgent Referral"
          value={urgentCount}
          subtitle="Urgent screening flags"
          color="red"
        />

        <SummaryCard
          title="Needs Review"
          value={reviewCount}
          subtitle="Professional review flags"
          color="amber"
        />

        <SummaryCard
          title="Low Confidence"
          value={lowConfidenceCount}
          subtitle="Uncertain model outputs"
          color="purple"
        />
      </div>

      {/* Search and filters */}
      <section className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search case code or screening"
          />
        </div>

        <label className="text-xs font-medium text-slate-500">
          Review category

          <select
            className="field mt-1"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            {FILTERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Case results */}
      {casesError ? (
        <section
          role="alert"
          className="card border-l-4 border-l-red-600 p-5"
        >
          <h2 className="font-semibold text-red-700">
            Unable to load screening cases
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {casesError}
          </p>
        </section>
      ) : casesLoading ? (
        <section className="card p-6 text-sm text-slate-600">
          Loading screening cases...
        </section>
      ) : rows.length === 0 ? (
        <EmptyState
          title={
            flaggedCases.length === 0
              ? "No flagged screening results available"
              : "No matching screening cases"
          }
          text={
            flaggedCases.length === 0
              ? "No review flags are currently available for your account. Draft, pending, or unprocessed cases are not treated as normal results."
              : "Try changing the search or review category."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ record, flags }) => {
            const person = patientOf(record);
            const urgent = flags.includes(
              "Urgent Referral"
            );

            const needsReview = flags.includes(
              "Needs Review"
            );

            const accent = urgent
              ? "bg-red-600"
              : needsReview
                ? "bg-amber-500"
                : "bg-purple-600";

            const shadow = urgent
              ? "shadow-[0_12px_30px_rgba(220,38,38,0.08)]"
              : needsReview
                ? "shadow-[0_12px_30px_rgba(217,119,6,0.08)]"
                : "shadow-[0_12px_30px_rgba(124,58,237,0.08)]";

            return (
              <article
                key={record.databaseId || record.id}
                className={`queue-card card flex flex-wrap items-center gap-4 px-4 py-4 ${shadow}`}
              >
                <span
                  className={`h-12 w-1.5 shrink-0 rounded-full ${accent}`}
                  aria-hidden="true"
                />

                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-navy-950">
                      {person.name}
                    </h2>

                    {flags.map((flag) => (
                      <Badge key={flag}>
                        {flag}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {record.caseCode ||
                      record.case_code ||
                      record.id}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getReviewDescription(flags)}
                  </p>
                </div>

                <div className="min-w-[100px] text-sm text-slate-600">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Modality
                  </div>

                  <p className="mt-1">
                    {getModality(record)}
                  </p>
                </div>

                <div className="min-w-[110px] text-sm text-slate-600">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Screening Date
                  </div>

                  <p className="mt-1">
                    {record.createdAt
                      ? formatWhen(record.createdAt).day
                      : "Not recorded"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {urgent && (
                    <AlertTriangle
                      size={18}
                      className="text-red-600"
                      aria-label="Urgent screening flag"
                    />
                  )}

                  <Link
                    to={`/cases/${record.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900"
                  >
                    Review Case
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Review guidance */}
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <ClipboardList
            size={20}
            className="mt-0.5 shrink-0 text-clinic-blue"
          />

          <div>
            <h2 className="font-semibold text-navy-950">
              About screening review
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This page highlights available screening
              outputs requiring professional attention.
              Low-confidence predictions must be interpreted
              cautiously. Open a case to inspect available
              ECG/Echo findings, explanations, uncertainty
              indicators, and AI summary reports.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This page does not initiate referrals,
              generate referral letters, send notifications,
              or make treatment decisions.
            </p>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <section
      className={`rounded-xl border p-4 ${
        colors[color] || colors.blue
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs opacity-80">
        {subtitle}
      </p>
    </section>
  );
}

