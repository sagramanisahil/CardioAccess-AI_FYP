import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, ArrowRight, Activity, BrainCircuit, CheckCircle2, ChevronRight,
  ClipboardList, Eye, EyeOff, FileHeart, FileText, HeartPulse,
  Loader2, LockKeyhole, Mail, Menu, ShieldCheck, Stethoscope,
  Users, Waves, X, Sparkles, ArrowUpRight, ScanHeart, CircleDot, Gauge,
} from "lucide-react";
import Button from "../ui/Button";
import Logo from "../layout/Logo";
import { isEmail, passwordChecks } from "../../data/format";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const NAV = [
  ["#capabilities", "What it does"],
  ["#workflow", "How it works"],
  ["#responsible", "Your safety"],
];

const capabilities = [
  { icon: Activity, name: "ECG screening", tag: "ECG", color: "blue", description: "Upload an ECG heart recording to check for signs of an irregular heartbeat or other possible heart problems. The result may also show how sure the system is.", detail: "ECG results · signs that need checking" },
  { icon: HeartPulse, name: "Heart ultrasound (Echo)", tag: "ECHO", color: "teal", description: "Upload a heart ultrasound video. See available heart measurements, including how well the heart pumps blood.", detail: "Heart measurements · pumping strength" },
  { icon: Waves, name: "ECG + Echo together", tag: "ECG + ECHO", color: "violet", description: "When both tests are from the same patient and can be used together, the system can show a combined screening result.", detail: "Both tests must be from the same patient" },
];

const workflow = [
  { icon: ClipboardList, n: "01", title: "Add a patient case", body: "A doctor or nurse enters the patient details and uploads an ECG, a heart ultrasound, or both." },
  { icon: BrainCircuit, n: "02", title: "Check the results", body: "See whether the tests are ready and read the results. The system also shows when a result is unclear." },
  { icon: FileText, n: "03", title: "Read the summary", body: "Read a short summary and see whether the patient may need further medical review." },
  { icon: Stethoscope, n: "04", title: "Plan the next step", body: "A doctor or nurse reviews the information and decides what to do next. The system does not make a diagnosis." },
];

function ColorIcon({ icon: Icon, tone = "blue", size = 21 }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    teal: "bg-teal-50 text-teal-600 ring-teal-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };
  return <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}><Icon size={size} strokeWidth={1.9} /></span>;
}

function LandingPreview({ active, setActive }) {
  const rows = [
    { label: "ECG", status: active === "ecg" ? "Showing example" : "Test option", icon: Activity },
    { label: "Heart ultrasound (Echo)", status: active === "echo" ? "Showing example" : "Test option", icon: HeartPulse },
    { label: "ECG + Echo together", status: active === "fusion" ? "Showing example" : "Needs both tests", icon: Waves },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[530px]">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-tr from-sky-400/20 via-blue-500/10 to-teal-300/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-[0_40px_110px_rgba(0,9,29,.48)] ring-1 ring-white/20">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><HeartPulse size={19} className="text-teal-500" /> Screening workspace</div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Illustrative preview</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Types of heart tests</p><h3 className="mt-1 text-xl font-bold text-[#183458]">Heart tests in one place</h3></div>
            <span className="rounded-xl bg-teal-50 p-2.5 text-teal-600"><ShieldCheck size={21} /></span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["ecg", "ECG"], ["echo", "Echo"], ["fusion", "Fusion"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActive(id)} aria-pressed={active === id} className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${active === id ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>{label}</button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-[#f7faff] p-4">
            {active === "ecg" ? <>
              <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-800">ECG screening</span><span className="text-xs text-blue-600">4 classes</span></div>
              <svg className="mt-3 h-20 w-full" viewBox="0 0 410 86" role="img" aria-label="Illustrative ECG waveform, not a patient recording"><path d="M0 44 H40 l10 -2 8 4 10 -3 8 -14 10 41 10 -62 10 35 15 2 12 -1 H175 l10 -2 8 4 10 -3 8 -14 10 41 10 -62 10 35 15 2 12 -1 H310 l10 -2 8 4 10 -3 8 -14 10 41 10 -62 10 35 15 2 12 -1 H410" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
              <p className="text-xs text-slate-500">Example heartbeat line — not a real patient result</p>
            </> : active === "echo" ? <>
              <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-800">Echo measurements</span><span className="text-xs text-teal-600">When available</span></div>
              <div className="mt-4 grid grid-cols-3 gap-2">{["EDV", "ESV", "EF"].map(x => <div key={x} className="rounded-xl bg-white px-2 py-4 text-center ring-1 ring-slate-100"><div className="text-lg font-bold text-slate-300">—</div><div className="mt-1 text-xs font-semibold text-slate-600">{x}</div></div>)}</div>
              <p className="mt-3 text-xs text-slate-500">Measurements appear when the test is complete</p>
            </> : <>
              <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-800">Paired-input eligibility</span><span className="text-xs text-violet-600">Conditional</span></div>
              <div className="mt-4 flex items-center justify-center gap-2"><span className="rounded-xl bg-blue-100 px-4 py-3 text-sm font-bold text-blue-700">ECG</span><span className="text-slate-400">+</span><span className="rounded-xl bg-teal-100 px-4 py-3 text-sm font-bold text-teal-700">ECHO</span><ChevronRight size={20} className="text-slate-400"/><span className="rounded-xl bg-violet-100 px-3 py-3 text-xs font-bold text-violet-700">Fusion</span></div>
              <p className="mt-4 text-xs text-slate-500">Both ECG and Echo are needed</p>
            </>}
          </div>
          <div className="mt-4 space-y-2">{rows.map(({label,status,icon:Icon}) => <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5"><span className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon size={15} className="text-blue-500"/>{label}</span><span className="text-right text-[11px] text-slate-500">{status}</span></div>)}</div>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] text-slate-500"><ShieldCheck size={14} className="text-teal-600"/> No patient data or live analysis in this preview</div>
      </div>
    </div>
  );
}

export default function AuthShell({ initialGate = null }) {
  const [menu, setMenu] = useState(false);
  const [gate, setGate] = useState(initialGate);
  const [active, setActive] = useState("ecg");
  useEffect(() => { setGate(initialGate); }, [initialGate]);
  useEffect(() => {
    if (!gate) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setGate(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gate]);
  const openGate = (next) => { setMenu(false); setGate(next); };
  return (
    <div className="ca-modern min-h-screen bg-[#f7faff] text-[#183458]">
      <style>{`
        .ca-modern { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .ca-modern .ca-mesh { background-image: radial-gradient(circle at 12% 12%, rgba(42,209,190,.19), transparent 30%), radial-gradient(circle at 88% 18%, rgba(59,130,246,.25), transparent 33%), radial-gradient(circle at 53% 85%, rgba(139,92,246,.14), transparent 34%); }
        .ca-modern .ca-grid { background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px); background-size: 48px 48px; mask-image: linear-gradient(to bottom, black, transparent 95%); }
        .ca-modern .ca-glass { background: rgba(255,255,255,.085); border: 1px solid rgba(255,255,255,.19); backdrop-filter: blur(18px); }
        .ca-modern .ca-shine { background: linear-gradient(115deg,#ffffff 0%,#c4f8f0 48%,#91c5ff 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .ca-modern .ca-hover { transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease; }
        .ca-modern .ca-hover:hover { transform:translateY(-6px); box-shadow:0 25px 60px rgba(16,43,80,.12); }
        .ca-modern .ca-float { animation: ca-float 7s ease-in-out infinite; }
        .ca-modern .ca-pulse { animation: ca-pulse 3.5s ease-in-out infinite; }
        @keyframes ca-float { 0%,100% {transform:translateY(0)} 50% {transform:translateY(-12px)} }
        @keyframes ca-pulse { 0%,100% {opacity:.5} 50% {opacity:1} }
        @media (prefers-reduced-motion:reduce) { .ca-modern .ca-float,.ca-modern .ca-pulse {animation:none} .ca-modern .ca-hover {transition:none} }
      `}</style>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 shadow-[0_4px_24px_rgba(20,49,86,.035)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-5 px-5 lg:px-8">
          <Logo compact />
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Landing page">
            {NAV.map(([href,label]) => <a key={href} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-blue-600">{label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <button type="button" onClick={() => openGate("signin")} className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-[#183458] transition hover:bg-slate-100 sm:inline-flex">Sign in</button>
            <button type="button" onClick={() => openGate("register")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">Create account</button>
            <button type="button" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(v => !v)} className="rounded-lg p-2 text-slate-700 lg:hidden">{menu ? <X size={22}/> : <Menu size={22}/>}</button>
          </div>
        </div>
        {menu && <nav className="border-t border-slate-100 bg-white px-5 py-3 lg:hidden" aria-label="Mobile navigation">{NAV.map(([href,label]) => <a key={href} href={href} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50">{label}</a>)}<button type="button" onClick={() => openGate("signin")} className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-blue-600 sm:hidden">Sign in</button></nav>}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#061a35] text-white">
          <div className="ca-mesh pointer-events-none absolute inset-0"/>
          <div className="ca-grid pointer-events-none absolute inset-0"/>
          <div className="ca-pulse pointer-events-none absolute right-[10%] top-[8%] h-72 w-72 rounded-full border border-cyan-300/10"/>
          <div className="ca-pulse pointer-events-none absolute right-[7%] top-[4%] h-96 w-96 rounded-full border border-blue-300/10"/>
          <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/15 blur-[90px]"/>
          <div className="relative mx-auto grid max-w-[1320px] items-center gap-16 px-5 py-24 lg:min-h-[720px] lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
            <div>
              <div className="ca-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold tracking-[.14em] text-teal-100"><Sparkles size={14} className="text-teal-300"/> HEART SCREENING SUPPORT</div>
              <h1 className="mt-8 max-w-2xl text-[clamp(2.9rem,5.1vw,5.3rem)] font-extrabold leading-[1.055] tracking-[-.055em]">Heart screening made simpler.<br/><span className="ca-shine">Clear information for better care.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-blue-100/85 sm:text-lg">Upload an ECG or heart ultrasound, view the available results, and see when a patient may need more care. Made to help doctors and nurses in clinics with limited resources. It does not replace a doctor’s decision.</p>
              <div className="mt-9 flex flex-wrap gap-3"><button type="button" onClick={() => openGate("signin")} className="group inline-flex items-center gap-2 rounded-2xl bg-[#3b82f6] px-7 py-4 text-sm font-bold text-white shadow-[0_12px_32px_rgba(37,99,235,.32)] transition hover:bg-[#2563eb] hover:shadow-[0_16px_40px_rgba(37,99,235,.45)]">Sign in to start <ArrowRight size={18}/></button><a href="#workflow" className="ca-glass inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-white transition hover:bg-white/20">See how it works <ChevronRight size={18}/></a></div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-blue-100/85"><span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-teal-300"/> Secure accounts</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-300"/> For doctors and nurses</span><span className="inline-flex items-center gap-2"><HeartPulse size={16} className="text-teal-300"/> Screening, not diagnosis</span></div>
            </div>
            <div className="ca-float relative"><LandingPreview active={active} setActive={setActive}/>
              <div className="ca-glass absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:flex lg:-left-10"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/20 text-teal-200"><ShieldCheck size={21}/></span><span><span className="block text-xs font-bold text-white">Designed for clinical teams</span><span className="block text-[11px] text-blue-100/70">For doctors and nurses</span></span></div>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-b border-slate-200 bg-white"><div className="mx-auto grid max-w-[1280px] gap-4 px-5 py-7 text-sm font-semibold text-slate-600 sm:grid-cols-3 lg:px-8"><div className="flex items-center gap-3"><ColorIcon icon={Activity} tone="blue" size={19}/><span>ECG heart test</span></div><div className="flex items-center gap-3"><ColorIcon icon={HeartPulse} tone="teal" size={19}/><span>Heart ultrasound results</span></div><div className="flex items-center gap-3"><ColorIcon icon={Waves} tone="violet" size={19}/><span>ECG and Echo together</span></div></div></section>

        <section id="capabilities" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1200px]"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-blue-600">Heart tests</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-[#183458] sm:text-4xl">Two heart tests. One easy place to check.</h2><p className="mt-4 text-base leading-7 text-slate-600">Choose an ECG test, a heart ultrasound, or both. Each test gives useful information about the heart.</p></div>
          <div className="mt-11 grid gap-5 lg:grid-cols-3">{capabilities.map(({icon,name,tag,color,description,detail}) => <article key={name} className={`ca-hover group relative overflow-hidden rounded-[28px] border bg-white p-7 shadow-[0_12px_35px_rgba(18,44,79,.045)] ${color === "blue" ? "border-blue-100 hover:border-blue-300" : color === "teal" ? "border-teal-100 hover:border-teal-300" : "border-violet-100 hover:border-violet-300"}`}><div className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl ${color === "blue" ? "bg-blue-200/40" : color === "teal" ? "bg-teal-200/40" : "bg-violet-200/40"}`}/><div className="relative flex items-start justify-between"><ColorIcon icon={icon} tone={color}/><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-wider text-slate-600">{tag}</span></div><h3 className="mt-7 text-xl font-bold text-[#183458]">{name}</h3><p className="mt-3 min-h-[112px] text-sm leading-7 text-slate-600">{description}</p><div className="mt-6 border-t border-slate-100 pt-5 text-xs font-bold text-slate-500">{detail}</div></article>)}</div>
        </div></section>

        <section className="relative overflow-hidden bg-[#edf5ff] px-5 py-20 lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl"/>
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm"><CircleDot size={15}/> CLEAR RESULTS, RESPONSIBLE DECISIONS</span>
              <h2 className="mt-6 text-3xl font-extrabold leading-[1.12] tracking-tight text-[#153354] sm:text-5xl">Heart test results.<br/><span className="text-blue-600">Easier to understand.</span></h2>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">See important test results together, with simple notes to help you understand what needs a closer look.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Gauge size={20}/></span><div><p className="font-bold text-[#153354]">Shows when results are unclear</p><p className="mt-1 text-xs leading-6 text-slate-600">Some results may need a closer check</p></div></div>
                <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><ScanHeart size={20}/></span><div><p className="font-bold text-[#153354]">Uses both tests when possible</p><p className="mt-1 text-xs leading-6 text-slate-600">ECG and Echo must belong to the same patient</p></div></div>
              </div>
            </div>
            <div className="relative rounded-[30px] bg-[#0b2446] p-5 shadow-[0_35px_90px_rgba(15,49,92,.22)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><span className="flex items-center gap-2 text-sm font-bold text-white"><HeartPulse size={20} className="text-teal-300"/> Screening insights</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100">Illustrative interface</span></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-xs font-semibold text-blue-200">ECG analysis</p><div className="mt-5 flex h-20 items-center"><svg viewBox="0 0 280 80" className="w-full" role="img" aria-label="Decorative simulated ECG line"><path d="M0 40 H40 l12 -4 10 5 9 -2 9 -20 12 50 11 -63 12 33 H155 l12 -4 10 5 9 -2 9 -20 12 50 11 -63 12 33 H280" stroke="#5eead4" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p className="text-xs text-blue-100/60">Four-class screening support</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p className="text-xs font-semibold text-blue-200">Echo measurements</p><div className="mt-5 flex h-20 items-center justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border-[7px] border-teal-300/60 text-2xl font-extrabold text-white">EF</div></div><p className="text-center text-xs text-blue-100/60">Measurements when available</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Waves size={19}/></span><div><p className="text-sm font-bold text-[#153354]">ECG + Echo result</p><p className="text-xs text-slate-500">Both tests are checked before combining</p></div></div><ArrowUpRight size={19} className="text-blue-600"/></div>
              <p className="mt-4 text-center text-[11px] text-blue-100/65">Example only. No real patient information or diagnosis.</p>
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 bg-white px-5 py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1200px]"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-teal-600">Simple steps</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-[#183458] sm:text-4xl">From uploading a test to checking the result.</h2><p className="mt-4 text-base leading-7 text-slate-600">Follow these four steps to use CardioAccess AI.</p></div><div className="mt-11 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{workflow.map(({icon:Icon,n,title,body}) => <article key={n} className="ca-hover relative rounded-[24px] border border-slate-200 bg-[#f8fbff] p-6"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon size={21}/></span><span className="text-2xl font-extrabold text-blue-200">{n}</span></div><h3 className="mt-7 text-lg font-bold text-[#183458]">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{body}</p></article>)}</div></div></section>

        <section className="px-5 py-20 lg:px-8"><div className="mx-auto grid max-w-[1200px] items-center gap-10 rounded-[30px] bg-gradient-to-br from-[#e8f8f6] to-[#eef4ff] p-7 sm:p-10 lg:grid-cols-2 lg:p-14"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-teal-700">Understanding the results</p><h2 className="mt-4 text-3xl font-bold leading-tight text-[#183458]">Clear results, not just numbers.</h2><p className="mt-4 text-sm leading-8 text-slate-700">See available results, heart measurements, and a short summary. If a result is missing or unclear, the system tells you.</p></div><div className="grid gap-3">{[["Test results", "ECG results, heart measurements, and possible next steps", Activity],["Clear notes and warnings", "Know when a result needs a closer look", BrainCircuit],["Easy-to-read summary", "A short explanation with an important safety note", FileText]].map(([title,body,Icon]) => <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon size={19}/></span><div><h3 className="text-sm font-bold text-[#183458]">{title}</h3><p className="mt-1 text-xs leading-6 text-slate-600">{body}</p></div></div>)}</div></div></section>

        <section id="responsible" className="scroll-mt-24 bg-[#0d284a] px-5 py-20 text-white lg:px-8"><div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[.95fr_1.05fr]"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-teal-300">Your safety and privacy</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">A helpful tool. Your doctor makes the decision.</h2><p className="mt-5 text-sm leading-8 text-blue-100">CardioAccess AI helps with early heart screening. It cannot diagnose a disease or prescribe medicine. A trained healthcare professional must check the results and decide what care is needed.</p></div><div className="grid gap-4 sm:grid-cols-2">{[[ShieldCheck,"Secure sign-in","Only authenticated users can sign in and access permitted cases."],[LockKeyhole,"Private patient files","Patient files and results are kept private."],[Users,"Doctors stay in charge","Doctors and nurses review the results before taking action."],[FileHeart,"Clear warnings","The system tells you if a result is missing or unclear."]].map(([Icon,title,body]) => <div key={title} className="rounded-2xl border border-white/15 bg-white/[.07] p-5"><Icon size={23} className="text-teal-300"/><h3 className="mt-4 text-sm font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-blue-100/85">{body}</p></div>)}</div></div></section>

        <section className="px-5 py-20 lg:px-8"><div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 rounded-[28px] border border-blue-100 bg-white p-8 shadow-lg shadow-slate-200/40 sm:p-12 lg:flex-row lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-600">Get started</p><h2 className="mt-3 text-2xl font-bold text-[#183458] sm:text-3xl">Ready to get started?</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">Sign in to view your cases or start a new screening. New users can create an account.</p></div><button type="button" onClick={() => openGate("signin")} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700">Sign in <ArrowRight size={18}/></button></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-bold text-[#183458]">CardioAccess AI</p><p className="mt-2 max-w-lg text-xs leading-6 text-slate-500">Heart screening support project · Sukkur IBA University · Not a medical diagnosis.</p></div><div className="flex items-center gap-5 text-sm font-semibold"><button type="button" onClick={() => openGate("signin")} className="text-slate-600 hover:text-blue-600">Sign in</button><button type="button" onClick={() => openGate("register")} className="text-blue-600 hover:text-blue-700">Create account</button><a href="#capabilities" className="text-slate-600 hover:text-blue-600">Back to top</a></div></div></footer>
      {gate && <AuthWindow gate={gate} setGate={setGate} onClose={() => setGate(null)} />}
    </div>
  );
}

function Preview({ focus, setFocus, ef, setEf, band }) {
  const ring = Math.max(8, Math.min(100, ef));
  return (
    <div className="kazi-window">
      <div className="kazi-window-bar">
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
        <span className="text-xs text-slate-400">Screening preview · simulated</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">Demo</span>
      </div>
      <div className="kazi-window-body">
        <div className="mb-4 flex gap-2">
          {[["ecg", "ECG"], ["echo", "ECHO"], ["fusion", "Fusion"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFocus(id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${focus === id ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>{label}</button>
          ))}
        </div>
        {focus === "ecg" && (
          <div className="space-y-2">
            {[["Normal", 22], ["Arrhythmia", 14], ["Ischemic (MI-related)", 54], ["Other Abnormal", 10]].map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs text-slate-300"><span>{name}</span><span>{value}%</span></div>
                <div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-400" style={{ width: `${value}%` }} /></div>
              </div>
            ))}
            <p className="pt-2 text-[11px] text-slate-500">Example only. Not a real patient result.</p>
          </div>
        )}
        {focus === "echo" && (
          <div>
            <div className="flex items-center gap-5">
              <div className="ef-ring" style={{ "--p": ring }}><strong>{ef}%</strong><span>EF</span></div>
              <div>
                <p className="text-sm font-semibold text-white">{band}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Example of heart pumping strength. Move the slider to see how the label changes.</p>
              </div>
            </div>
            <input className="mt-4 w-full accent-sky-400" type="range" min="28" max="68" value={ef} onChange={(event) => setEf(Number(event.target.value))} aria-label="Illustrative ejection fraction" />
          </div>
        )}
        {focus === "fusion" && (
          <div className="space-y-3 text-sm text-slate-300">
            <p className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>ECG input</span><span className="text-emerald-300">Shown in example</span></p>
            <p className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>ECHO input</span><span className="text-amber-300">Choose below</span></p>
            <FusionToggle />
          </div>
        )}
      </div>
    </div>
  );
}

function FusionToggle() {
  const [both, setBoth] = useState(false);
  return (
    <div>
      <button type="button" className="kazi-ghost w-full" onClick={() => setBoth((value) => !value)}>
        {both ? "Remove echo input" : "Mark echo as available"}
      </button>
      <p className={`mt-3 rounded-lg px-3 py-2 text-xs leading-5 ${both ? "bg-sky-500/15 text-sky-100" : "bg-amber-500/10 text-amber-100"}`}>
        {both ? "Both tests are selected. A combined example can now be shown. No real case is created." : "Both ECG and Echo are needed to show a combined result."}
      </p>
    </div>
  );
}

function Foot({ title, actions, items, onOpen }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-300">{title.toUpperCase()}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-400">
        {actions?.map(([label, next]) => (
          <li key={label}><button type="button" className="hover:text-white" onClick={() => onOpen(next)}>{label}</button></li>
        ))}
        {items?.map((label) => <li key={label}>{label}</li>)}
      </ul>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#EA4335" d="M9 7.2v3.5h4.9c-.2 1.2-.9 2.2-1.9 2.9l3 2.3C16.7 14.3 18 11.9 18 9c0-.6 0-1.2-.2-1.8H9z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.3c-.8.6-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7l-3.1 2.4C2.4 16.1 5.5 18 9 18z" />
      <path fill="#4A90E2" d="M4 10.7A5.4 5.4 0 0 1 4 7.3L.9 4.9a9 9 0 0 0 0 8.2L4 10.7z" />
      <path fill="#FBBC05" d="M9 3.6c1.3 0 2.5.5 3.4 1.3L15.1 2A9 9 0 0 0 .9 4.9L4 7.3C4.7 5.2 6.7 3.6 9 3.6z" />
    </svg>
  );
}

function GoogleButton({ onClick }) {
  return (
    <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#102A43]" onClick={onClick}>
      <GoogleMark /> Continue with Google
    </button>
  );
}

function AuthWindow({ gate, setGate, onClose }) {
  const { login, loginWithGoogle, register, resetPassword, changePassword, authError } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [form, setForm] = useState({ name: "", email: "", facility: "", password: "", confirm: "" });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const titles = { signin: "Sign in", register: "Create account", reset: "Reset password", "set-password": "Choose a new password" };

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setGate("set-password");
  }, [setGate]);

  const submitSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    if (!isEmail(email) || !password) {
      setFieldErrors({ email: !isEmail(email) ? "Enter a valid email address." : "", password: !password ? "Enter your password." : "" });
      setError("Please check the highlighted fields.");
      return;
    }
    setBusy(true);
    let result;
    try { result = await login({ email, password }); } catch { result = { ok: false, message: "Sign-in failed. Please try again." }; }
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      notify(result.message);
      return;
    }
    notify("Signed in.");
    navigate("/");
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setError("");
    if (!isEmail(email)) {
      setError("Enter the account email.");
      return;
    }
    setBusy(true);
    let result;
    try { result = await resetPassword({ email }); } catch { result = { ok: false, message: "Could not send the reset link. Try again." }; }
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice("If an account exists for that address, a password reset link has been sent.");
  };

  const submitNewPassword = async (event) => {
    event.preventDefault();
    setError("");
    const checks = passwordChecks(nextPassword, confirm);
    if (!checks.length || !checks.letterNumber || !checks.match) {
      setError("Use 8 or more characters with a letter and a number, and match the confirmation.");
      return;
    }
    setBusy(true);
    let result;
    try { result = await changePassword({ nextPassword }); } catch { result = { ok: false, message: "Could not update your password. Try again." }; }
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice("Password updated. You can now sign in with the new password.");
    setNextPassword("");
    setConfirm("");
    window.history.replaceState(null, "", "/signin");
    setGate("signin");
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError("");
    const checks = passwordChecks(form.password, form.confirm);
    if (form.name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!isEmail(form.email)) {
      setError("Enter a valid email.");
      return;
    }
    if (!checks.length || !checks.letterNumber || !checks.match) {
      setError("Use 8 or more characters with a letter and a number, and match the confirmation.");
      return;
    }
    setBusy(true);
    let result;
    try { result = await register(form); } catch { result = { ok: false, message: "Registration failed. Please try again." }; }
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsEmailVerification) {
      setNotice("Account created successfully. Please check your email and click the verification link before signing in.");
      setGate("signin");
      return;
    }
    notify("Account created.");
    onClose();
    navigate("/");
  };

  const submitGoogle = async () => {
    setError("");
    setBusy(true);
    let result;
    try { result = await loginWithGoogle(); } catch { result = { ok: false, message: "Google sign-in failed. Please try again." }; }
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      notify(result.message);
      return;
    }
    notify("Continuing with Google.");
  };

  const switchGate = (next) => { setError(""); setNotice(""); setFieldErrors({}); setGate(next); };
  const inputStyle = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelStyle = "mb-1.5 block text-sm font-semibold text-slate-700";
  const primaryStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";
  const linkStyle = "text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="my-auto w-full max-w-[480px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={titles[gate]}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><HeartPulse size={21} /></span>
            <span className="text-sm font-bold tracking-tight text-[#183153]">CardioAccess AI</span>
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" aria-label="Close authentication window" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="mb-6">
            <h2 className="text-[25px] font-bold tracking-tight text-[#183153]">{gate === "signin" ? "Welcome back" : titles[gate]}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{gate === "signin" ? "Sign in to your secure screening workspace." : gate === "register" ? "Create your account to access CardioAccess AI." : gate === "reset" ? "We'll send a password reset link to your email." : "Choose a strong password for your account."}</p>
          </div>
          {authError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{authError}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
          {gate === "signin" && (
            <form className="space-y-4" onSubmit={submitSignIn} noValidate>
              <div>
                <label htmlFor="auth-email" className={labelStyle}>Email address</label>
                <div className="relative"><Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="auth-email" className={`${inputStyle} pl-11 ${fieldErrors.email ? "border-rose-400" : ""}`} type="email" autoComplete="username" placeholder="name@hospital.com" value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((prev) => ({...prev, email: ""})); }} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "auth-email-error" : undefined} /></div>
                {fieldErrors.email && <p id="auth-email-error" className="mt-1 text-xs text-rose-700">{fieldErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="auth-password" className={labelStyle}>Password</label>
                <div className="relative"><LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="auth-password" className={`${inputStyle} pl-11 pr-12 ${fieldErrors.password ? "border-rose-400" : ""}`} type={show ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((prev) => ({...prev, password: ""})); }} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "auth-password-error" : undefined} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-blue-700" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
                {fieldErrors.password && <p id="auth-password-error" className="mt-1 text-xs text-rose-700">{fieldErrors.password}</p>}
              </div>
              <div className="flex justify-end"><button type="button" className={linkStyle} onClick={() => switchGate("reset")}>Forgot password?</button></div>
              <button type="submit" disabled={busy} className={`${primaryStyle} w-full`}>{busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}{busy ? "Signing in..." : "Sign in securely"}</button>
              <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">or continue with</span><span className="h-px flex-1 bg-slate-200" /></div>
              <button type="button" disabled={busy} onClick={submitGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"><GoogleMark /> Continue with Google</button>
              <p className="pt-2 text-center text-sm text-slate-500">New to CardioAccess AI? <button type="button" className={linkStyle} onClick={() => switchGate("register")}>Create account</button></p>
            </form>
          )}
          {gate === "register" && (
            <form className="space-y-4" onSubmit={submitRegister} noValidate>
              <div><label htmlFor="register-name" className={labelStyle}>Full name</label><input id="register-name" className={inputStyle} autoComplete="name" placeholder="Your full name" value={form.name} onChange={set("name")} /></div>
              <div><label htmlFor="register-email" className={labelStyle}>Email address</label><input id="register-email" className={inputStyle} type="email" autoComplete="email" placeholder="name@hospital.com" value={form.email} onChange={set("email")} /></div>
              <div><label htmlFor="register-facility" className={labelStyle}>Facility (optional)</label><input id="register-facility" className={inputStyle} placeholder="Clinic or unit" value={form.facility} onChange={set("facility")} /></div>
              <div><label htmlFor="register-password" className={labelStyle}>Password</label><div className="relative"><input id="register-password" className={`${inputStyle} pr-12`} type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-700" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="mt-1 text-xs text-slate-500">Use at least 8 characters, including a letter and a number.</p></div>
              <div><label htmlFor="register-confirm" className={labelStyle}>Confirm password</label><input id="register-confirm" className={inputStyle} type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} /></div>
              <button type="submit" disabled={busy} className={`${primaryStyle} w-full`}>{busy ? <Loader2 size={18} className="animate-spin" /> : null}{busy ? "Creating account..." : "Create account"}</button>
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900"><ShieldCheck size={17} className="shrink-0" /><span>New accounts start with the Clinician role. Admins manage role changes and account access.</span></div>
              <p className="text-center text-sm text-slate-500">Already have an account? <button type="button" className={linkStyle} onClick={() => switchGate("signin")}>Sign in</button></p>
              <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">or</span><span className="h-px flex-1 bg-slate-200" /></div>
              <button type="button" disabled={busy} onClick={submitGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><GoogleMark /> Continue with Google</button>
            </form>
          )}
          {gate === "reset" && (
            <form className="space-y-4" onSubmit={submitReset} noValidate>
              <div><label htmlFor="reset-email" className={labelStyle}>Account email</label><input id="reset-email" className={inputStyle} type="email" autoComplete="email" placeholder="name@hospital.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <button type="submit" disabled={busy} className={`${primaryStyle} w-full`}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}{busy ? "Sending..." : "Send reset link"}</button>
              <button type="button" className={`${linkStyle} block w-full text-center`} onClick={() => switchGate("signin")}>Back to sign in</button>
            </form>
          )}
          {gate === "set-password" && (
            <form className="space-y-4" onSubmit={submitNewPassword} noValidate>
              <div><label htmlFor="new-password" className={labelStyle}>New password</label><input id="new-password" className={inputStyle} type="password" autoComplete="new-password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} /></div>
              <div><label htmlFor="confirm-password" className={labelStyle}>Confirm new password</label><input id="confirm-password" className={inputStyle} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div>
              <button type="submit" disabled={busy} className={`${primaryStyle} w-full`}>{busy ? "Updating..." : "Update password"}</button>
            </form>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-slate-500"><ShieldCheck size={14} className="text-teal-600" /> Secure access for authorized healthcare staff</div>
      </div>
    </div>
  );
}
