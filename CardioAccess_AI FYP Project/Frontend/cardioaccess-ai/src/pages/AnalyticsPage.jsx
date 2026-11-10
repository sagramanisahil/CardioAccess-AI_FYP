import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../components/ui/ChartCard";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import { modalityLabel } from "../data/format";
import { useCases } from "../hooks/useCases";

const COLORS = ["#16A34A", "#D97706", "#DC2626", "#7C3AED"];

export default function AnalyticsPage() {
  const { cases, referrals } = useCases();
  const [range, setRange] = useState("all");

  const filtered = useMemo(() => {
    if (range === "all") return cases;
    const days = range === "3" ? 3 : 1;
    const latest = cases.reduce((max, item) => (item.createdAt > max ? item.createdAt : max), "2026-11-01");
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const stamp = cutoff.toISOString().slice(0, 10);
    return cases.filter((item) => item.createdAt.slice(0, 10) >= stamp);
  }, [cases, range]);

  const volume = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const day = item.createdAt.slice(5, 10);
      map.set(day, (map.get(day) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count }));
  }, [filtered]);

  const outcomes = [
    { name: "Normal", value: filtered.filter((item) => item.triage === "Normal").length },
    { name: "Needs Review", value: filtered.filter((item) => item.triage === "Needs Review").length },
    { name: "Urgent Referral", value: filtered.filter((item) => item.triage === "Urgent Referral").length },
    { name: "ECG class only", value: filtered.filter((item) => item.status === "completed" && !item.triage).length },
  ];

  const modalities = ["ecg", "echo", "both"].map((key) => ({
    name: modalityLabel(key),
    count: filtered.filter((item) => item.modality === key).length,
  }));

  const referralIds = new Set(filtered.map((item) => item.id));
  const trendMap = new Map();
  referrals.filter((item) => referralIds.has(item.caseId)).forEach((item) => {
    const day = item.createdAt.slice(5, 10);
    const row = trendMap.get(day) || { day, review: 0, urgent: 0 };
    if (item.triage === "Urgent Referral") row.urgent += 1;
    else row.review += 1;
    trendMap.set(day, row);
  });
  const trends = [...trendMap.values()].sort((a, b) => a.day.localeCompare(b.day));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Demonstration activity in this browser. These charts are not model accuracy, sensitivity, or validation metrics."
        actions={(
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
            {[
              ["all", "All demo dates"],
              ["3", "Latest 3 days"],
              ["1", "Latest day"],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setRange(id)} className={`rounded-md px-3 py-1.5 font-medium ${range === id ? "bg-navy-950 text-white" : "text-slate-600"}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Screening volume" subtitle="Demo cases over time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area dataKey="count" stroke="#0D9488" fill="#0D9488" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Outcome distribution" subtitle="Referral triage, with ECG-only cases separated">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes.filter((item) => item.value)} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80}>
                  {outcomes.filter((item) => item.value).map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Modality usage" subtitle="ECG, ECHO, and paired screenings">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modalities}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Referral trends" subtitle="Needs Review and Urgent Referral only">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="review" stackId="r" fill="#D97706" name="Needs Review" />
                <Bar dataKey="urgent" stackId="r" fill="#DC2626" name="Urgent Referral" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
