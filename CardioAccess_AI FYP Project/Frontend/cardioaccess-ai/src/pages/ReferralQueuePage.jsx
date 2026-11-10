import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import { formatWhen, patientOf } from "../data/format";
import { useCases } from "../hooks/useCases";
import { useToast } from "../hooks/useToast";

const STATUSES = ["Open", "In review", "Actioned", "Closed"];

export default function ReferralQueuePage() {
  const { cases, referrals, updateReferral } = useCases();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    return referrals
      .map((item) => ({ ...item, record: cases.find((row) => row.id === item.caseId) }))
      .filter((item) => item.record && (item.triage === "Needs Review" || item.triage === "Urgent Referral"))
      .filter((item) => priority === "All" || item.triage === priority)
      .filter((item) => status === "All" || item.status === status)
      .filter((item) => {
        const person = patientOf(item.record);
        const blob = `${person.name} ${person.id} ${item.id}`.toLowerCase();
        return !query || blob.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => {
        if (a.triage !== b.triage) return a.triage === "Urgent Referral" ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [referrals, cases, query, priority, status]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Referrals"
        title="Referral queue"
        description="Only Needs Review and Urgent Referral cases appear here. Normal results are not queued."
      />
      <div className="card flex flex-wrap gap-3 p-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search patient or referral" />
        <label className="text-xs font-medium text-slate-500">
          Priority
          <select className="field mt-1" value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option>All</option>
            <option>Urgent Referral</option>
            <option>Needs Review</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Status
          <select className="field mt-1" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Queue is clear" text="No matching review or urgent referrals." />
      ) : (
        <div className="space-y-3">
          {rows.map((item) => {
            const person = patientOf(item.record);
            const urgent = item.triage === "Urgent Referral";
            return (
              <article key={item.id} className={`queue-card card flex flex-wrap items-center gap-4 px-4 py-4 ${urgent ? "shadow-[0_12px_30px_rgba(220,38,38,0.08)]" : "shadow-[0_12px_30px_rgba(217,119,6,0.08)]"}`}>
                <span className={`h-12 w-1.5 rounded-full ${urgent ? "bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)]" : "bg-amber-500 shadow-[0_0_12px_rgba(217,119,6,0.65)]"}`} aria-hidden="true" />
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-navy-950">{person.name}</h2>
                    <Badge>{item.triage}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{person.id} · {item.record.id} · {item.id}</p>
                </div>
                <div className="text-sm text-slate-600">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Screening result</div>
                  {item.triage}
                </div>
                <div className="text-sm text-slate-600">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date</div>
                  {formatWhen(item.createdAt).day}
                </div>
                <label className="text-xs font-medium text-slate-500">
                  Referral status
                  <select
                    className="field mt-1"
                    value={item.status}
                    onChange={(event) => {
                      updateReferral(item.id, event.target.value);
                      notify(`Referral ${item.id} marked ${event.target.value}.`);
                    }}
                  >
                    {STATUSES.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <Link to={`/referrals/${item.caseId}`} className="rounded-lg bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-900">
                  View referral
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
