import { HeartPulse } from "lucide-react";

export default function BrandPanel({ compact = false, framed = false }) {
  const frame = compact
    ? "rounded-3xl p-8"
    : framed
      ? "flex h-full min-h-[720px] flex-col justify-between rounded-3xl px-8 py-10"
      : "flex min-h-screen flex-col justify-between px-8 py-10 lg:px-14";
  return (
    <section className={`hero-panel relative overflow-hidden text-white ${frame}`}>
      <svg className="pointer-events-none absolute inset-x-0 bottom-16 h-28 w-full opacity-30" viewBox="0 0 640 120" fill="none" aria-hidden="true">
        <path d="M0 70 H120 L140 70 L156 28 L176 104 L196 52 L214 70 H640" stroke="#99f6e4" strokeWidth="2.4" />
      </svg>
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <HeartPulse className="text-teal-300" size={20} />
        </div>
        <div>
          <div className="font-display text-lg font-semibold">CardioAccess AI</div>
          <div className="text-[11px] tracking-[0.14em] text-slate-300">MULTIMODAL CARDIAC SCREENING</div>
        </div>
      </div>
      <div className="relative max-w-md">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-teal-200">Primary-care screening support</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.15]">ECG and echocardiography, reviewed together when the case is truly paired.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-200">
          A research prototype for non-specialist teams. It screens a 12-lead ECG, estimates left-ventricular function from echo, and fuses the two only when both files belong to the same patient.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-emerald-100">Normal</span>
          <span className="rounded-xl bg-amber-300/15 px-3 py-2 text-amber-100">Needs Review</span>
          <span className="rounded-xl bg-red-400/15 px-3 py-2 text-red-100">Urgent Referral</span>
        </div>
      </div>
      <p className="relative text-xs leading-5 text-slate-300">
        Sukkur IBA University · FYP 23F-59
        <br />
        Outputs support screening. They do not replace clinical judgement and are not a diagnosis.
      </p>
    </section>
  );
}
