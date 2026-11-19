import { HeartPulse } from "lucide-react";

export default function Logo({ light = false, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${light ? "bg-white/10 text-teal-200 ring-1 ring-white/15" : "bg-navy-950 text-white"}`}>
        <HeartPulse size={18} strokeWidth={2.1} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate font-display text-[15px] font-semibold tracking-tight ${light ? "text-white" : "text-navy-950"}`}>
          CardioAccess AI
        </span>
        {!compact && (
          <span className={`block truncate text-[11px] font-medium ${light ? "text-slate-300" : "text-slate-500"}`}>
            Cardiovascular Screening
          </span>
        )}
      </span>
    </div>
  );
}
