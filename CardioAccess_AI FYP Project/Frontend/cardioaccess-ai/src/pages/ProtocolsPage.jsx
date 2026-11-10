import { Activity, GitMerge, HeartPulse, ShieldAlert } from "lucide-react";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

export default function ProtocolsPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Reference"
        title="Screening protocols"
        description="How this demonstration labels ECG classes, echo measurements, fusion eligibility, and referral triage."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-clinic-blue"><Activity size={18} /><h2 className="font-display text-lg font-semibold text-navy-950">ECG screening categories</h2></div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {["Normal", "Arrhythmia", "Ischemic (MI-related)", "Other Abnormal"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-navy-950" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-slate-500">ECG-only cases show the class. They do not assign a referral triage category and do not enter the queue by themselves.</p>
        </section>

        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-teal-700"><HeartPulse size={18} /><h2 className="font-display text-lg font-semibold text-navy-950">ECHO measurements</h2></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-slate-50 px-2 py-3"><div className="text-xs text-slate-500">EDV</div><div className="font-semibold">End-diastolic volume</div></div>
            <div className="rounded-lg bg-slate-50 px-2 py-3"><div className="text-xs text-slate-500">ESV</div><div className="font-semibold">End-systolic volume</div></div>
            <div className="rounded-lg bg-slate-50 px-2 py-3"><div className="text-xs text-slate-500">EF</div><div className="font-semibold">Ejection fraction</div></div>
          </div>
          <div className="mt-4 space-y-2">
            <Band label="EF > 50%" name="Normal" tone="bg-emerald-500" width="w-full" />
            <Band label="40% < EF ≤ 50%" name="Needs Review" tone="bg-amber-500" width="w-4/5" />
            <Band label="EF ≤ 40%" name="Urgent Referral" tone="bg-red-600" width="w-3/5" />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">High EF uncertainty overrides the band to Needs Review. Values in this app are simulated.</p>
        </section>

        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-clinic-blue"><GitMerge size={18} /><h2 className="font-display text-lg font-semibold text-navy-950">Multimodal eligibility</h2></div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <div className="rounded-lg border border-slate-200 px-3 py-4 text-center font-medium">Eligible ECG</div>
            <span className="text-slate-400">+</span>
            <div className="rounded-lg border border-slate-200 px-3 py-4 text-center font-medium">Eligible ECHO</div>
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">Both, for the same patient</p>
          <div className="mx-auto mt-2 h-6 w-px bg-slate-300" />
          <div className="mx-auto w-fit rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white">Combined interpretation</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">If only one modality is available, fusion stays unavailable. A fused category is never invented from a single input.</p>
        </section>

        <section className="card card-hover p-5">
          <div className="flex items-center gap-2 text-red-700"><ShieldAlert size={18} /><h2 className="font-display text-lg font-semibold text-navy-950">Referral triage</h2></div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900"><strong>Normal.</strong> No referral is created.</li>
            <li className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950"><strong>Needs Review.</strong> Enters the referral queue.</li>
            <li className="rounded-lg bg-red-50 px-3 py-2 text-red-900"><strong>Urgent Referral.</strong> Enters the queue with priority.</li>
          </ul>
          <p className="mt-4 text-xs leading-5 text-slate-500">Triage supports a clinician’s referral decision. It is not a diagnosis.</p>
        </section>
      </div>
    </PageContainer>
  );
}

function Band({ label, name, tone, width }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{name}</span></div>
      <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${tone} ${width}`} /></div>
    </div>
  );
}
