import { Link } from "react-router-dom";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, FilePlus2, FolderClock, ClipboardList } from "lucide-react";
import Badge from "../components/ui/Badge";
import ChartCard from "../components/ui/ChartCard";
import PageContainer from "../components/ui/PageContainer";
import StatCard from "../components/ui/StatCard";
import { categoryOf, formatWhen, modalityLabel, patientOf } from "../data/format";
import { useAuth } from "../hooks/useAuth";
import { useCases } from "../hooks/useCases";

const COLORS = {
  Normal: "#16A34A",
  "Needs Review": "#D97706",
  "Urgent Referral": "#DC2626",
  "ECG class only": "#7C3AED",
};

export default function DashboardPage() {
  const { user, settings } = useAuth();
  const { cases, referrals } = useCases();
  const completed = cases.filter((item) => item.status === "completed");
  const normal = completed.filter((item) => item.triage === "Normal");
  const review = completed.filter((item) => item.triage === "Needs Review");
  const urgent = completed.filter((item) => item.triage === "Urgent Referral");
  const ecgOnly = completed.filter((item) => !item.triage && item.ecg);
  const recent = [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const open = referrals.filter((item) => item.status !== "Actioned" && item.status !== "Closed");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const byDay = new Map();
  cases.forEach((item) => {
    const key = item.createdAt.slice(5, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  const activity = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count }));
  const outcomes = [
    { name: "Normal", value: normal.length },
    { name: "Needs Review", value: review.length },
    { name: "Urgent Referral", value: urgent.length },
    { name: "ECG class only", value: ecgOnly.length },
  ].filter((item) => item.value > 0);

  return (
    <PageContainer>
      {settings.showBanner !== false && (
        <p className="text-xs text-slate-500">Screening support for referral decisions. Not a diagnosis. Figures on this page are demonstration activity.</p>
      )}
      <section className="dash-hero">
        <div>
          <p className="text-sm text-sky-200">{today}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{greeting}, {user?.name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
            {cases.length} screenings in this workspace. <span className="font-semibold text-sky-300">{open.length} referrals</span> are still open. Counts are demonstration activity.
          </p>
        </div>
        <Link to="/cases/new" className="kazi-cta inline-flex items-center gap-2">
          <FilePlus2 size={16} /> New Screening
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total screenings" value={cases.length} detail={`${completed.length} completed in this demo`} accent="bg-navy-950" />
        <StatCard label="Normal results" value={normal.length} detail="No referral is created" accent="bg-emerald-600" />
        <StatCard label="Needs review" value={review.length} detail={`${open.filter((item) => item.triage === "Needs Review").length} open in the queue`} accent="bg-amber-500" />
        <StatCard label="Urgent referrals" value={urgent.length} detail={`${open.filter((item) => item.triage === "Urgent Referral").length} still open`} accent="bg-red-600" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <ChartCard title="Screening activity" subtitle="Demonstration volume by day">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#E8EEF8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Outcome distribution" subtitle="Referral triage. ECG-only cases stay separate.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2}>
                  {outcomes.map((item) => <Cell key={item.name} fill={COLORS[item.name]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-base font-semibold">Recent patient screenings</h2>
            <Link to="/cases" className="text-sm font-semibold text-clinic-blue">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Modality</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => {
                  const person = patientOf(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/cases/${item.id}`} className="font-medium text-navy-950 hover:text-clinic-blue">{person.name}</Link>
                        <div className="text-xs text-slate-500">{person.id}</div>
                      </td>
                      <td className="text-slate-600">{formatWhen(item.createdAt).day}</td>
                      <td>{modalityLabel(item.modality)}</td>
                      <td><Badge>{categoryOf(item)}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="font-display text-base font-semibold">Referral overview</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <QueueRow label="Open" value={referrals.filter((item) => item.status === "Open").length} />
              <QueueRow label="In review" value={referrals.filter((item) => item.status === "In review").length} />
              <QueueRow label="Actioned" value={referrals.filter((item) => item.status === "Actioned").length} />
              <QueueRow label="Urgent still open" value={open.filter((item) => item.triage === "Urgent Referral").length} tone="text-red-700" />
            </ul>
            <Link to="/referrals" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-clinic-blue">
              Open queue <ArrowRight size={14} />
            </Link>
          </section>
          <section className="card p-5">
            <h2 className="font-display text-base font-semibold">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              <Quick to="/cases/new" icon={FilePlus2} label="Start a screening" />
              <Quick to="/cases" icon={FolderClock} label="Review patient cases" />
              <Quick to="/referrals" icon={ClipboardList} label="Work the referral queue" />
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

function QueueRow({ label, value, tone = "text-navy-950" }) {
  return (
    <li className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${tone}`}>{value}</span>
    </li>
  );
}

function Quick({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="action-link group flex items-center gap-3 rounded-xl border border-blue-100 px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <Icon size={16} className="text-clinic-blue" /> {label}
    </Link>
  );
}
