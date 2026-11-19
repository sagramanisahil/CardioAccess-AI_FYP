
import { useMemo, useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "../components/ui/ChartCard";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import { useCases } from "../hooks/useCases";
import { useAuth } from "../hooks/useAuth";

const COLORS = {
  normal: "#16A34A",
  review: "#D97706",
  urgent: "#DC2626",
  unavailable: "#94A3B8",
};

const AXIS_COLOR = "#64748B";

function getDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDay(day) {
  if (!day) return "";

  const parts = day.split("-");

  if (parts.length !== 3) {
    return day;
  }

  return `${parts[1]}/${parts[2]}`;
}

function normalizeTriage(value) {
  if (!value) return null;

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (normalized === "normal") {
    return "Normal";
  }

  if (normalized === "needs review") {
    return "Needs Review";
  }

  if (normalized === "urgent referral") {
    return "Urgent Referral";
  }

  return null;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "_");
}

function getModality(caseItem) {
  const files = Array.isArray(caseItem.files)
    ? caseItem.files
    : Array.isArray(caseItem.uploaded_files)
      ? caseItem.uploaded_files
      : [];

  const fileModalities = files.map((file) =>
    String(file.modality || "").toLowerCase()
  );

  const hasECG =
    Boolean(caseItem.has_ecg ?? caseItem.hasEcg) ||
    fileModalities.includes("ecg");

  const hasEcho =
    Boolean(caseItem.has_echo ?? caseItem.hasEcho) ||
    fileModalities.includes("echo");

  if (hasECG && hasEcho) return "both";
  if (hasECG) return "ecg";
  if (hasEcho) return "echo";

  const modality = String(
    caseItem.modality || ""
  ).toLowerCase();

  if (["ecg", "echo", "both"].includes(modality)) {
    return modality;
  }

  return "unknown";
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-64 items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold text-navy-950">
          No data available
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { cases = [], casesLoading, casesError } = useCases();

  const { profile } = useAuth();

  const [range, setRange] = useState("all");

  const role = String(
    profile?.role || ""
  ).toLowerCase();

  const isAdmin = role === "admin";

  const authorizedCases = useMemo(() => {
    if (isAdmin) return [];

    return Array.isArray(cases) ? cases : [];
  }, [cases, isAdmin]);

  const filtered = useMemo(() => {
    if (range === "all") {
      return authorizedCases;
    }

    const days = range === "3" ? 3 : 1;

    const today = new Date();

    const cutoff = new Date(today);
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));

    return authorizedCases.filter((item) => {
      const date = new Date(
        item.createdAt || item.created_at || ""
      );

      return (
        !Number.isNaN(date.getTime()) &&
        date >= cutoff &&
        date <= today
      );
    });
  }, [authorizedCases, range]);

  const volume = useMemo(() => {
    const map = new Map();

    filtered.forEach((item) => {
      const day = getDate(
        item.createdAt || item.created_at
      );

      if (!day) return;

      map.set(day, (map.get(day) || 0) + 1);
    });

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        day: formatDay(date),
        count,
      }));
  }, [filtered]);

  const outcomes = useMemo(() => {
    const counts = {
      Normal: 0,
      "Needs Review": 0,
      "Urgent Referral": 0,
      "No category": 0,
    };

    filtered.forEach((item) => {
      const triage = normalizeTriage(
        item.triage
      );

      if (triage) {
        counts[triage] += 1;
        return;
      }

      const status = normalizeStatus(item.status);

      if (
        status === "completed" ||
        status === "partially_completed"
      ) {
        counts["No category"] += 1;
      }
    });

    return [
      {
        name: "Normal",
        value: counts.Normal,
        color: COLORS.normal,
      },
      {
        name: "Needs Review",
        value: counts["Needs Review"],
        color: COLORS.review,
      },
      {
        name: "Urgent Referral",
        value: counts["Urgent Referral"],
        color: COLORS.urgent,
      },
      {
        name: "No category",
        value: counts["No category"],
        color: COLORS.unavailable,
      },
    ].filter((item) => item.value > 0);
  }, [filtered]);

  const modalities = useMemo(() => {
    const counts = {
      ecg: 0,
      echo: 0,
      both: 0,
      unknown: 0,
    };

    filtered.forEach((item) => {
      counts[getModality(item)] += 1;
    });

    return [
      {
        name: "ECG",
        count: counts.ecg,
      },
      {
        name: "Echo",
        count: counts.echo,
      },
      {
        name: "Both",
        count: counts.both,
      },
      {
        name: "Not registered",
        count: counts.unknown,
      },
    ];
  }, [filtered]);

  const trends = useMemo(() => {
    const map = new Map();

    filtered.forEach((item) => {
      const triage = normalizeTriage(item.triage);

      if (
        triage !== "Needs Review" &&
        triage !== "Urgent Referral"
      ) {
        return;
      }

      const date = getDate(
        item.createdAt || item.created_at
      );

      if (!date) return;

      const row = map.get(date) || {
        date,
        day: formatDay(date),
        review: 0,
        urgent: 0,
      };

      if (triage === "Needs Review") {
        row.review += 1;
      } else {
        row.urgent += 1;
      }

      map.set(date, row);
    });

    return [...map.values()].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
  }, [filtered]);

  const totalModalityCount = modalities.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const totalOutcomeCount = outcomes.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const hasTrends = trends.some(
    (item) => item.review > 0 || item.urgent > 0
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description={
          isAdmin
            ? "Clinical case analytics are restricted to authorized clinical users."
            : "Activity summaries from your authorized screening cases. These charts do not represent model accuracy, sensitivity, or validation performance."
        }
        actions={
          !isAdmin ? (
            <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 text-sm">
              {[
                ["all", "All dates"],
                ["3", "Last 3 days"],
                ["1", "Today"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRange(id)}
                  aria-pressed={range === id}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    range === id
                      ? "bg-navy-950 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      {isAdmin ? (
        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold text-navy-950">
            Clinical analytics unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            The administrator role manages user accounts
            and system audit records. Individual clinical
            case histories and screening results are
            restricted to authorized clinicians and nurses.
          </p>
        </section>
      ) : (
        <>
          {casesError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              Screening case data could not be loaded.
              Please try again.
            </div>
          )}

          {casesLoading && (
            <p className="mb-4 text-sm text-slate-500">
              Loading screening analytics...
            </p>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {/* Screening volume */}
            <ChartCard
              title="Screening volume"
              subtitle="Authorized cases created over time"
            >
              {volume.length === 0 ? (
                <EmptyChart
                  message="No screening cases were found for the selected date range."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart data={volume}>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        tick={{
                          fontSize: 12,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        width={32}
                        tick={{
                          fontSize: 12,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Cases"
                        stroke="#0D9488"
                        fill="#0D9488"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Outcome distribution */}
            <ChartCard
              title="Screening outcome distribution"
              subtitle="Available triage categories and completed cases without a category"
            >
              {totalOutcomeCount === 0 ? (
                <EmptyChart
                  message="No completed screening outcomes are available for this date range."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={outcomes}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                      >
                        {outcomes.map((item) => (
                          <Cell
                            key={item.name}
                            fill={item.color}
                          />
                        ))}
                      </Pie>

                      <Tooltip />

                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Modality usage */}
            <ChartCard
              title="Modality usage"
              subtitle="ECG, Echo, and cases containing both modalities"
            >
              {totalModalityCount === 0 ? (
                <EmptyChart
                  message="No registered screening modalities are available for this date range."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart data={modalities}>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        width={32}
                        tick={{
                          fontSize: 12,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="count"
                        name="Cases"
                        fill="#2563EB"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Screening review trends */}
            <ChartCard
              title="Screening review trends"
              subtitle="Needs Review and Urgent Referral screening categories"
            >
              {!hasTrends ? (
                <EmptyChart
                  message="No Needs Review or Urgent Referral screening categories are available for this date range."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart data={trends}>
                      <CartesianGrid
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        tick={{
                          fontSize: 12,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        width={32}
                        tick={{
                          fontSize: 12,
                          fill: AXIS_COLOR,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip />

                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />

                      <Bar
                        dataKey="review"
                        stackId="triage"
                        fill={COLORS.review}
                        name="Needs Review"
                      />

                      <Bar
                        dataKey="urgent"
                        stackId="triage"
                        fill={COLORS.urgent}
                        name="Urgent Referral"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            These charts summarize authorized application
            case records only. Screening categories are
            not diagnoses or confirmed referrals.
            Cases containing both ECG and Echo inputs
            are not necessarily eligible for multimodal
            fusion. Model-validation performance must
            be reported separately from application
            activity.
          </p>
        </>
      )}
    </PageContainer>
  );
}
