const STYLES = {
  Normal: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  "Needs Review": "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  "Urgent Referral": "bg-red-50 text-red-700 ring-1 ring-red-200",
  Arrhythmia: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  "Ischemic (MI-related)": "bg-red-50 text-red-700 ring-1 ring-red-200",
  "Other Abnormal": "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  "No category": "bg-slate-100 text-slate-600",
  Completed: "bg-emerald-50 text-emerald-700",
  Processing: "bg-blue-50 text-blue-700",
  Failed: "bg-violet-50 text-violet-700",
  Open: "bg-blue-50 text-blue-700",
  "In review": "bg-amber-50 text-amber-800",
  "Summary ready": "bg-indigo-50 text-indigo-700",
  Closed: "bg-slate-100 text-slate-600",
  Actioned: "bg-emerald-50 text-emerald-700",
  Active: "bg-emerald-50 text-emerald-700",
  Deactivated: "bg-red-50 text-red-700",
  "Email unverified": "bg-slate-100 text-slate-600",
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-violet-50 text-violet-700",
};

const DOT = {
  Normal: "bg-emerald-500",
  "Needs Review": "bg-amber-500",
  "Urgent Referral": "bg-red-500",
  Arrhythmia: "bg-amber-500",
  "Ischemic (MI-related)": "bg-red-500",
  "Other Abnormal": "bg-amber-600",
  "No category": "bg-slate-400",
  Completed: "bg-emerald-500",
  Processing: "bg-blue-500",
  Failed: "bg-violet-500",
  Open: "bg-blue-500",
  Actioned: "bg-emerald-500",
  Active: "bg-emerald-500",
  Deactivated: "bg-red-500",
};

export default function Badge({ children, tone, dot = true }) {
  const key = tone || children;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[key] || STYLES.neutral}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[key] || "bg-slate-400"}`} />}
      {children}
    </span>
  );
}

export function triageTone(triage) {
  return triage || "No category";
}
