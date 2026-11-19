import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Eye, Pencil, Trash2, SlidersHorizontal, RotateCcw, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import { caseStatus, categoryOf, formatWhen, modalityLabel, patientOf } from "../data/format";
import { useCases } from "../hooks/useCases";
import { useApp } from "../hooks/useApp";

const PAGE_SIZE = 8;
const GENDERS = [
  ["male", "Male"], ["female", "Female"], ["other", "Other"],
  ["not_specified", "Prefer not to say"],
];
const INITIAL_FILTERS = { modality: "All", category: "All", status: "All", sort: "newest" };

function initialEdit(item) {
  return {
    patient_name: item.patientName === "Patient details unavailable" ? "" : (item.patientName || ""),
    patient_age: item.age == null ? "" : String(item.age),
    patient_gender: item.patientGender || item.sex || "",
  };
}

export default function CaseLogPage() {
  const { cases = [], casesLoading, casesError } = useCases();
  const { user, updateCase, deleteCase } = useApp();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ patient_name: "", patient_age: "", patient_gender: "" });
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [notice, setNotice] = useState("");

  const canModify = (item) =>
    user?.active === true && ["Clinician", "Nurse"].includes(user?.role) &&
    String(item.ownerId) === String(user.id) && item.status === "draft";

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setQuery("");
    setPage(1);
  };
  const activeFilterCount = [filters.modality, filters.category, filters.status].filter((value) => value !== "All").length;
  const categories = useMemo(() => ["All", ...new Set(cases.map(categoryOf))], [cases]);

  const rows = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return cases.filter((item) => {
      const person = patientOf(item);
      const text = `${person.name} ${person.id} ${item.id} ${item.caseCode || ""}`.toLowerCase();
      if (searchTerm && !text.includes(searchTerm)) return false;
      if (filters.modality !== "All" && item.modality !== filters.modality) return false;
      if (filters.status !== "All" && caseStatus(item) !== filters.status) return false;
      if (filters.category !== "All" && categoryOf(item) !== filters.category) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sort === "name") return patientOf(a).name.localeCompare(patientOf(b).name);
      if (filters.sort === "category") return categoryOf(a).localeCompare(categoryOf(b));
      const aDate = a.createdAt || "";
      const bDate = b.createdAt || "";
      return filters.sort === "oldest" ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    });
  }, [cases, query, filters]);

  const visible = rows.slice(0, page * PAGE_SIZE);
  const hasFilters = Boolean(query.trim()) || activeFilterCount > 0 || filters.sort !== "newest";

  const startEdit = (item) => {
    setOpen(null);
    setEditing(item);
    setForm(initialEdit(item));
    setDialogError("");
    setNotice("");
  };
  const startDelete = (item) => {
    setOpen(null);
    setDeleting(item);
    setDialogError("");
    setNotice("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing || busy) return;
    const name = form.patient_name.trim();
    const age = form.patient_age.trim() === "" ? NaN : Number(form.patient_age);
    if (!name || name.length > 150) return setDialogError("Enter a patient name between 1 and 150 characters.");
    if (!Number.isInteger(age) || age < 0 || age > 120) return setDialogError("Enter a whole-number age from 0 to 120.");
    if (!GENDERS.some(([value]) => value === form.patient_gender)) return setDialogError("Select a gender option.");
    setBusy(true);
    setDialogError("");
    try {
      const result = await updateCase(editing.databaseId, {
        patient_name: name, patient_age: age, patient_gender: form.patient_gender,
      });
      if (!result?.ok) return setDialogError(result?.message || "Unable to save patient details.");
      setEditing(null);
      setNotice(result.message || "Patient details updated successfully.");
    } catch (error) {
      setDialogError(error?.message || "Unable to save patient details.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setDialogError("");
    try {
      const result = await deleteCase(deleting.databaseId);
      if (!result?.ok) return setDialogError(result?.message || "Unable to delete this case.");
      setDeleting(null);
      setNotice(result.message || "Draft case deleted successfully.");
    } catch (error) {
      setDialogError(error?.message || "Unable to delete this case.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <div className="pointer-events-none mb-5 h-2 rounded-full bg-gradient-to-r from-teal-400 via-sky-500 to-indigo-500" aria-hidden="true" />
      <PageHeader eyebrow="Cases" title="Patient cases" description="Find, review, and manage your screening cases." />

      {casesError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Could not load cases: {casesError}</div>}
      {notice && (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 size={17} aria-hidden="true" />{notice}</span>
          <button type="button" className="font-semibold" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <section className="mb-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-teal-50/50 p-4 shadow-sm sm:p-5" aria-label="Search and filter cases">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search cases</span>
            <Search size={19} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search patient name or case ID..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${showFilters || activeFilterCount ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
              <SlidersHorizontal size={17} aria-hidden="true" /> Filters
              {activeFilterCount > 0 && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">{activeFilterCount}</span>}
              <ChevronDown size={15} aria-hidden="true" className={showFilters ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            <label className="sr-only" htmlFor="case-sort">Sort cases</label>
            <select id="case-sort" value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400">
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Patient name</option><option value="category">Category</option>
            </select>
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <FilterSelect label="Modality" value={filters.modality} onChange={(value) => setFilter("modality", value)} options={["All", "ecg", "echo", "both"]} labels={{ ecg: "ECG", echo: "Echo", both: "Multimodal" }} />
            <FilterSelect label="Category" value={filters.category} onChange={(value) => setFilter("category", value)} options={categories} />
            <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter("status", value)} options={["All", "Awaiting analysis", "Queued", "Processing", "Completed", "Failed"]} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>{casesLoading ? "Loading cases..." : `${rows.length} ${rows.length === 1 ? "case" : "cases"} found`}</span>
          {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800"><RotateCcw size={14} aria-hidden="true" /> Clear filters</button>}
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState title={casesLoading ? "Loading cases" : "No cases found"} text={casesLoading ? "Retrieving your saved screening cases." : "Try a different search or clear the filters."} />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Patient case list">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-teal-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr><th className="px-5 py-4">Patient</th><th className="px-4 py-4">Screening date</th><th className="px-4 py-4">Modality</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => {
                  const person = patientOf(item);
                  return (
                    <tr key={item.databaseId || item.id} className="transition-colors hover:bg-sky-50/50">
                      <td className="px-5 py-4"><div className="font-semibold text-slate-900">{person.name}</div><div className="mt-1 font-mono text-xs text-sky-700">{person.id}</div></td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">{item.createdAt ? formatWhen(item.createdAt).day : "—"}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.modality === "both" ? "border-violet-200 bg-violet-50 text-violet-700" : item.modality === "ecg" ? "border-sky-200 bg-sky-50 text-sky-700" : item.modality === "echo" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{modalityLabel(item.modality)}</span></td>
                      <td className="px-4 py-4"><Badge>{categoryOf(item)}</Badge></td>
                      <td className="px-4 py-4"><Badge tone={caseStatus(item)}>{caseStatus(item)}</Badge></td>
                      <td className="px-5 py-4"><div className="flex items-center justify-end gap-1.5">
                        <button type="button" title="View details" aria-label={`View details for ${person.id}`} onClick={() => setOpen(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Eye size={15} aria-hidden="true" /> View</button>
                        {canModify(item) && <>
                          <button type="button" title="Edit patient details" aria-label={`Edit ${person.id}`} onClick={() => startEdit(item)} className="rounded-lg bg-sky-50 p-2.5 text-sky-700 transition hover:bg-sky-100"><Pencil size={17} aria-hidden="true" /></button>
                          <button type="button" title="Delete draft case" aria-label={`Delete ${person.id}`} onClick={() => startDelete(item)} className="rounded-lg bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"><Trash2 size={17} aria-hidden="true" /></button>
                        </>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
            <span>Showing {visible.length} of {rows.length} cases</span>
            {visible.length < rows.length && <button type="button" className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setPage((value) => value + 1)}>Load more cases</button>}
          </div>
        </section>
      )}

      {open && (
        <Modal title="Case details" onClose={() => setOpen(null)}>
          <div className="mb-5 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-teal-50 p-4"><div className="font-semibold text-slate-900">{patientOf(open).name}</div><div className="mt-1 text-xs text-slate-500">{patientOf(open).id}</div></div>
          <dl className="space-y-1 text-sm">
            <DetailRow label="Age" value={patientOf(open).age ?? "—"} />
            <DetailRow label="Gender" value={GENDERS.find(([value]) => value === (open.patientGender || open.sex))?.[1] || "—"} />
            <DetailRow label="Case status" value={caseStatus(open)} />
            <DetailRow label="Modality" value={modalityLabel(open.modality)} />
            <DetailRow label="Category" value={categoryOf(open)} />
            <DetailRow label="Clinical note" value={patientOf(open).clinical || "—"} />
          </dl>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {canModify(open) && <button type="button" onClick={() => startEdit(open)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit details</button>}
            <Link to={`/cases/${open.id}`} className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setOpen(null)}>Open full result</Link>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit patient details" onClose={() => { if (!busy) setEditing(null); }}>
          <p className="mb-5 text-sm text-slate-500">Update the patient information for <span className="font-semibold text-slate-700">{editing.caseCode || editing.id}</span>.</p>
          <form onSubmit={saveEdit} className="space-y-4">
            <FormField label="Patient name" hint="As registered for this screening case">
              <input autoFocus className="field mt-1 w-full" value={form.patient_name} maxLength={150} required disabled={busy} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} placeholder="Enter patient name" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Age"><input className="field mt-1 w-full" type="number" min="0" max="120" step="1" value={form.patient_age} required disabled={busy} onChange={(event) => setForm((current) => ({ ...current, patient_age: event.target.value }))} placeholder="Age in years" /></FormField>
              <FormField label="Gender"><select className="field mt-1 w-full" value={form.patient_gender} required disabled={busy} onChange={(event) => setForm((current) => ({ ...current, patient_gender: event.target.value }))}><option value="">Select gender</option>{GENDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
            </div>
            {dialogError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dialogError}</p>}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" disabled={busy} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{busy ? "Saving changes..." : "Save changes"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete draft case" onClose={() => { if (!busy) setDeleting(null); }}>
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800"><AlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">This action cannot be undone</p><p className="mt-1 text-sm">The draft case and its associated screening files will be permanently removed.</p></div></div>
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold text-slate-900">{deleting.caseCode || deleting.id}</span>?</p>
          {dialogError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{dialogError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" onClick={() => setDeleting(null)}>Keep case</button>
            <button type="button" disabled={busy} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={confirmDelete}>{busy ? "Deleting..." : "Delete case"}</button>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

function FilterSelect({ label, value, onChange, options, labels = {} }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}<select className="field mt-1.5 w-full" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select></label>;
}
function FormField({ label, hint, children }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{hint && <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>}{children}</label>;
}
function DetailRow({ label, value }) {
  return <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5"><dt className="text-slate-500">{label}</dt><dd className="max-w-[65%] text-right font-medium text-slate-900">{value}</dd></div>;
}
