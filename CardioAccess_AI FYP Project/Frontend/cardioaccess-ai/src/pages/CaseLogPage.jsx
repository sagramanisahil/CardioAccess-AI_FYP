import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import { caseStatus, categoryOf, formatWhen, modalityLabel, patientOf } from "../data/format";
import { useCases } from "../hooks/useCases";

const PAGE = 8;

export default function CaseLogPage() {
  const { cases } = useCases();
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const filtered = cases.filter((item) => {
      const person = patientOf(item);
      const blob = `${person.name} ${person.id} ${item.id}`.toLowerCase();
      if (query && !blob.includes(query.trim().toLowerCase())) return false;
      if (modality !== "All" && item.modality !== modality) return false;
      if (status !== "All" && caseStatus(item) !== status) return false;
      if (category !== "All" && categoryOf(item) !== category) return false;
      return true;
    });
    filtered.sort((a, b) => {
      if (sort === "name") return patientOf(a).name.localeCompare(patientOf(b).name);
      if (sort === "category") return categoryOf(a).localeCompare(categoryOf(b));
      return sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt);
    });
    return filtered;
  }, [cases, query, modality, category, status, sort]);

  const visible = rows.slice(0, page * PAGE);
  const categories = ["All", ...new Set(cases.map(categoryOf))];

  return (
    <PageContainer>
      <PageHeader eyebrow="Cases" title="Patient cases" description="Search and filter screening records stored in this browser." />
      <div className="card flex flex-wrap gap-3 p-4">
        <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search name, patient ID, or case" />
        <Select label="Modality" value={modality} onChange={(value) => { setModality(value); setPage(1); }} options={["All", "ecg", "echo", "both"]} labels={{ ecg: "ECG", echo: "ECHO", both: "Multimodal" }} />
        <Select label="Category" value={category} onChange={(value) => { setCategory(value); setPage(1); }} options={categories} />
        <Select label="Status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={["All", "Completed", "Processing", "Failed"]} />
        <Select label="Sort" value={sort} onChange={setSort} options={["newest", "oldest", "name", "category"]} labels={{ newest: "Newest", oldest: "Oldest", name: "Name", category: "Category" }} />
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No cases match" text="Adjust the search or filters." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient name</th>
                <th>Screening date</th>
                <th>Modality</th>
                <th>Screening category</th>
                <th>Case status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const person = patientOf(item);
                return (
                  <tr key={item.id}>
                    <td className="font-medium">{person.id}</td>
                    <td>{person.name}</td>
                    <td>{formatWhen(item.createdAt).day}</td>
                    <td>{modalityLabel(item.modality)}</td>
                    <td><Badge>{categoryOf(item)}</Badge></td>
                    <td><Badge tone={caseStatus(item)}>{caseStatus(item)}</Badge></td>
                    <td>
                      <button type="button" className="text-sm font-semibold text-clinic-blue" onClick={() => setOpen(item)}>View details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {visible.length < rows.length && (
        <button type="button" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setPage((value) => value + 1)}>
          Load more
        </button>
      )}
      {open && (
        <Modal title={patientOf(open).name} onClose={() => setOpen(null)}>
          <dl className="space-y-2 text-sm">
            <Row label="Patient ID" value={patientOf(open).id} />
            <Row label="Age / sex" value={`${patientOf(open).age} · ${patientOf(open).sex}`} />
            <Row label="Case" value={open.id} />
            <Row label="Category" value={categoryOf(open)} />
            <Row label="Clinical note" value={patientOf(open).clinical || "—"} />
          </dl>
          <Link to={`/cases/${open.id}`} className="mt-5 inline-flex rounded-lg bg-clinic-blue px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpen(null)}>
            Open full result
          </Link>
        </Modal>
      )}
    </PageContainer>
  );
}

function Select({ label, value, onChange, options, labels = {} }) {
  return (
    <label className="text-xs font-medium text-slate-500">
      {label}
      <select className="field mt-1 min-w-[140px]" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}
      </select>
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-navy-950">{value}</dd>
    </div>
  );
}
