
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  FilePlus2,
  FolderClock,
  ClipboardList,
  Users,
} from "lucide-react";

import Badge from "../components/ui/Badge";
import ChartCard from "../components/ui/ChartCard";
import PageContainer from "../components/ui/PageContainer";
import StatCard from "../components/ui/StatCard";

import {
  formatWhen,
  patientOf,
} from "../data/format";

import { useAuth } from "../hooks/useAuth";
import { useCases } from "../hooks/useCases";

const COLORS = {
  Normal: "#16A34A",
  "Needs Review": "#D97706",
  "Urgent Referral": "#DC2626",
  "ECG class only": "#7C3AED",
};

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

function getCaseId(record) {
  return record.databaseId || record.id;
}

function getCreatedAt(record) {
  return record.createdAt || record.created_at || null;
}

function getCaseCode(record) {
  return (
    record.caseCode ||
    record.case_code ||
    record.id ||
    "Unknown case"
  );
}

function getModality(record) {
  if (
    record.has_ecg && record.has_echo ||
    record.modality === "both"
  ) {
    return "ECG + Echo";
  }

  if (
    record.has_ecg ||
    record.ecgFile ||
    record.modality === "ecg"
  ) {
    return "ECG";
  }

  if (
    record.has_echo ||
    record.echoFile ||
    record.modality === "echo"
  ) {
    return "Echo";
  }

  return "Not recorded";
}

function getDisplayCategory(record) {
  const triage = getTriage(record);

  if (triage) {
    return triage;
  }

  if (
    record.status === "draft" ||
    record.status === "queued" ||
    record.status === "processing"
  ) {
    return "Pending analysis";
  }

  if (record.status === "failed") {
    return "Analysis failed";
  }

  if (record.status === "partially_completed") {
    return "Partially completed";
  }

  if (
    record.status === "completed" &&
    (record.ecg || record.ecgResult) &&
    !record.echo &&
    !record.echoResult
  ) {
    return "ECG class only";
  }

  if (record.status === "completed") {
    return "Result unavailable";
  }

  return "Not analyzed";
}

function isEcgOnlyResult(record) {
  return (
    record.status === "completed" &&
    !getTriage(record) &&
    Boolean(record.ecg || record.ecgResult) &&
    !Boolean(record.echo || record.echoResult)
  );
}

function formatCaseDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return formatWhen(value).day;
}

function getActivityData(cases) {
  const byDay = new Map();

  cases.forEach((record) => {
    const createdAt = getCreatedAt(record);

    if (!createdAt) return;

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);

    byDay.set(key, (byDay.get(key) || 0) + 1);
  });

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      day: date.slice(5),
      count,
    }));
}

export default function DashboardPage() {
  const { user, settings } = useAuth();

  const {
    cases = [],
    casesLoading,
    casesError,
  } = useCases();

  const completed = cases.filter(
    (record) => record.status === "completed"
  );

  const normal = cases.filter(
    (record) => getTriage(record) === "Normal"
  );

  const review = cases.filter(
    (record) => getTriage(record) === "Needs Review"
  );

  const urgent = cases.filter(
    (record) => getTriage(record) === "Urgent Referral"
  );

  const lowConfidence = cases.filter(
    isLowConfidence
  );

  const flaggedCases = cases.filter((record) => {
    const triage = getTriage(record);

    return (
      triage === "Needs Review" ||
      triage === "Urgent Referral" ||
      isLowConfidence(record)
    );
  });

  const ecgOnly = cases.filter(isEcgOnlyResult);

  const pending = cases.filter(
    (record) =>
      record.status === "draft" ||
      record.status === "queued" ||
      record.status === "processing"
  );

  const recent = [...cases]
    .sort(
      (a, b) =>
        new Date(getCreatedAt(b) || 0).getTime() -
        new Date(getCreatedAt(a) || 0).getTime()
    )
    .slice(0, 6);

  const activity = getActivityData(cases);

  const outcomes = [
    {
      name: "Normal",
      value: normal.length,
    },
    {
      name: "Needs Review",
      value: review.length,
    },
    {
      name: "Urgent Referral",
      value: urgent.length,
    },
    {
      name: "ECG class only",
      value: ecgOnly.length,
    },
  ].filter((item) => item.value > 0);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const today = new Date().toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const role = String(user?.role || "").toLowerCase();

  const isAdmin = role === "admin";
  const isNurse = role === "nurse";

  const roleDescription = isAdmin
    ? "Manage authorized users and review the screening information available to your account."
    : isNurse
      ? "Submit screenings, inspect available results, and identify cases requiring professional review."
      : "Review patient screenings, available AI findings, and cases flagged for professional attention.";

  return (
    <PageContainer>
      {/* Screening disclaimer */}
      {settings?.showBanner !== false && (
        <p className="text-xs text-slate-500">
          CardioAccess AI provides screening support only,
          not a diagnosis. Statistics reflect available
          records and results, not inferred outcomes.
        </p>
      )}

      {/* Dashboard hero */}
      <section className="dash-hero">
        <div>
          <p className="text-sm text-sky-200">
            {today}
          </p>

          <p className="mt-2 text-sm font-medium text-sky-200">
            {user?.role} workspace
          </p>

          <h1 className="mt-1 font-display text-4xl font-semibold leading-tight">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
            {roleDescription}
          </p>
        </div>

        {isAdmin ? (
          <Link
            to="/admin/users"
            className="kazi-cta inline-flex items-center gap-2"
          >
            <Users size={16} />
            Manage Users
          </Link>
        ) : (
          <Link
            to="/cases/new"
            className="kazi-cta inline-flex items-center gap-2"
          >
            <FilePlus2 size={16} />
            New Screening
          </Link>
        )}
      </section>

      {/* Data loading and error states */}
      {casesError ? (
        <section
          role="alert"
          className="card border-l-4 border-l-red-600 p-5"
        >
          <h2 className="font-display text-base font-semibold">
            Could not load screening cases
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {casesError}
          </p>
        </section>
      ) : casesLoading ? (
        <section className="card p-5 text-sm text-slate-600">
          Loading screening cases...
        </section>
      ) : cases.length === 0 ? (
        <section className="card border-l-4 border-l-clinic-blue p-5">
          <h2 className="font-display text-base font-semibold">
            No screening cases available
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            No cases are currently available to this
            account. Create a screening to begin.
            Results and review flags will appear only
            when analysis data becomes available.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total screenings"
            value={cases.length}
            detail={`${completed.length} completed · ${pending.length} pending`}
            accent="bg-navy-950"
          />

          <StatCard
            label="Normal results"
            value={normal.length}
            detail="Available Normal triage results"
            accent="bg-emerald-600"
          />

          <StatCard
            label="Needs review"
            value={review.length}
            detail="Cases with review triage flags"
            accent="bg-amber-500"
          />

          <StatCard
            label="Urgent Referral"
            value={urgent.length}
            detail="Urgent screening flags"
            accent="bg-red-600"
          />
        </div>
      )}

      {/* Screening charts */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <ChartCard
          title="Screening activity"
          subtitle="Case submissions by date"
        >
          <div className="h-64">
            {activity.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No screening activity available.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={activity}>
                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 12,
                      fill: "#E8EEF8",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                      fill: "#E8EEF8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Screening outcome distribution"
          subtitle="Available triage results and ECG-only classifications"
        >
          <div className="h-64">
            {outcomes.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
                No analyzed screening outcomes are
                available yet.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={outcomes}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {outcomes.map((item) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[item.name]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Recent cases and review overview */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-base font-semibold">
              Recent patient screenings
            </h2>

            <Link
              to="/cases"
              className="text-sm font-semibold text-clinic-blue"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Date</th>
                  <th>Modality</th>
                  <th>Screening result</th>
                </tr>
              </thead>

              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No cases are available for this account.
                    </td>
                  </tr>
                )}

                {recent.map((record) => {
                  const person = patientOf(record);
                  const category = getDisplayCategory(record);

                  return (
                    <tr key={getCaseId(record)}>
                      <td>
                        <Link
                          to={`/cases/${getCaseId(record)}`}
                          className="font-medium text-navy-950 hover:text-clinic-blue"
                        >
                          {getCaseCode(record)}
                        </Link>

                        {person?.name &&
                          person.name !== "Pseudonymous patient" && (
                            <div className="text-xs text-slate-500">
                              {person.name}
                            </div>
                          )}
                      </td>

                      <td className="text-slate-600">
                        {formatCaseDate(
                          getCreatedAt(record)
                        )}
                      </td>

                      <td>
                        {getModality(record)}
                      </td>

                      <td>
                        <Badge>
                          {category}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          {/* Screening Review overview */}
          {!isAdmin && !isNurse && (
            <section className="card p-5">
              <h2 className="font-display text-base font-semibold">
                Screening Review
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Cases flagged for professional attention
              </p>

              <ul className="mt-4 space-y-3 text-sm">
                <ReviewRow
                  label="Total flagged cases"
                  value={flaggedCases.length}
                />

                <ReviewRow
                  label="Needs Review"
                  value={review.length}
                />

                <ReviewRow
                  label="Urgent Referral"
                  value={urgent.length}
                  tone="text-red-700"
                />

                <ReviewRow
                  label="Low confidence"
                  value={lowConfidence.length}
                  tone="text-purple-700"
                />
              </ul>

              <Link
                to="/referrals"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-clinic-blue"
              >
                Open Screening Review
                <ArrowRight size={14} />
              </Link>
            </section>
          )}

          {/* Quick actions */}
          <section className="card p-5">
            <h2 className="font-display text-base font-semibold">
              Quick actions
            </h2>

            <div className="mt-3 grid gap-2">
              {!isAdmin && (
                <Quick
                  to="/cases/new"
                  icon={FilePlus2}
                  label="Start a screening"
                />
              )}

              <Quick
                to="/cases"
                icon={FolderClock}
                label="Review patient cases"
              />

              {!isAdmin && !isNurse && (
                <Quick
                  to="/referrals"
                  icon={ClipboardList}
                  label="Open Screening Review"
                />
              )}
            </div>
          </section>

          {/* Review guidance */}
          {!isAdmin && (
            <section className="card p-5">
              <h2 className="font-display text-base font-semibold">
                Clinical review guidance
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Screening flags help identify cases
                requiring professional attention.
                Results must be interpreted by a
                qualified healthcare professional.
                The system does not automatically
                initiate referrals or make treatment
                decisions.
              </p>
            </section>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function ReviewRow({
  label,
  value,
  tone = "text-navy-950",
}) {
  return (
    <li className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-600">
        {label}
      </span>

      <span className={`font-semibold ${tone}`}>
        {value}
      </span>
    </li>
  );
}

function Quick({
  to,
  icon: Icon,
  label,
}) {
  return (
    <Link
      to={to}
      className="action-link group flex items-center gap-3 rounded-xl border border-blue-100 px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <Icon
        size={16}
        className="text-clinic-blue"
      />

      {label}
    </Link>
  );
}
