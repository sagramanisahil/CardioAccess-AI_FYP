import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Eye, EyeOff, Loader2, Menu, X } from "lucide-react";
import Button from "../ui/Button";
import Logo from "../layout/Logo";
import { isEmail, passwordChecks } from "../../data/format";
import { ADMIN_EMAIL, DEMO_PASSWORD } from "../../data/seed";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const NAV = [
  ["#gap", "Screening"],
  ["#modalities", "Modalities"],
  ["#workflow", "Workflow"],
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GOOGLE_ACCOUNTS = [
  { name: "Dr. A. Memon", email: "clinician@bhu-sukkur.pk" },
  { name: "Sana Rajput", email: "sana.r@bhu-sukkur.pk" },
  { name: "Dr. Hira Google", email: "hira.clinic@gmail.com" },
];

export default function AuthShell({ initialGate = null }) {
  const [menu, setMenu] = useState(false);
  const [gate, setGate] = useState(initialGate);
  const [focus, setFocus] = useState("echo");
  const [ef, setEf] = useState(46);

  useEffect(() => {
    setGate(initialGate);
  }, [initialGate]);

  useEffect(() => {
    if (!gate) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setGate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gate]);

  const band = ef > 50 ? "Normal" : ef > 40 ? "Needs Review" : "Urgent Referral";

  return (
    <div className="kazi-page">
      <header className="kazi-top">
        <div className="kazi-top-inner">
          <Logo light compact />
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Page">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-slate-300 transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <button type="button" className="hidden text-sm font-medium text-slate-200 hover:text-white sm:inline" onClick={() => setGate("signin")}>Sign in</button>
            <button type="button" className="kazi-cta" onClick={() => setGate("register")}>Create account</button>
            <button type="button" className="icon-btn mobile-nav-toggle text-slate-200" aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu((value) => !value)}>
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="border-t border-white/10 px-4 py-3 lg:hidden">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setMenu(false)}>{label}</a>
            ))}
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5" onClick={() => { setMenu(false); setGate("signin"); }}>Sign in</button>
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5" onClick={() => { setMenu(false); setGate("register"); }}>Create account</button>
          </div>
        )}
      </header>

      <section className="kazi-hero">
        <div>
          <p className="kazi-pill"><span className="kazi-dot" /> Primary-care cardiac screening</p>
          <h1 className="kazi-title">One workspace for <span>ECG, echo,</span> and referral support.</h1>
          <p className="kazi-lede">
            CardioAccess AI helps clinicians and nurses review an ECG class, an echo ejection-fraction band, and a combined result when both studies belong to the same patient. It supports screening and referral. It is not a diagnosis.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="kazi-cta inline-flex items-center gap-2" onClick={() => setGate("signin")}>Sign in <span aria-hidden>→</span></button>
            <a href="#modalities" className="kazi-ghost">Explore modalities</a>
          </div>
          <a href="#workflow" className="mt-4 inline-block text-sm font-medium text-sky-400 hover:text-sky-300">See how a case moves to referral →</a>
        </div>
        <Preview focus={focus} setFocus={setFocus} ef={ef} setEf={setEf} band={band} />
      </section>

      <section id="gap" className="kazi-section">
        <p className="kazi-kicker">The screening gap</p>
        <h2 className="kazi-h2">Separate reads slow the referral decision.</h2>
        <p className="kazi-lede mx-auto text-center">Primary-care teams need one place to see the ECG class, the echo measurements, and whether a referral should be opened.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["ECG class is not a referral", "The four ECG classes are Normal, Arrhythmia, Ischemic (MI-related), and Other Abnormal. An ECG-only result does not assign a referral triage by itself."],
            ["Echo needs an EF band", "EDV, ESV, and EF are shown together. EF above 50% is Normal, above 40% and up to 50% needs review, and 40% or below is an urgent referral."],
            ["One modality cannot fuse", "Multimodal fusion runs only when an eligible ECG and an eligible echo are available for the same patient. A fused result is never invented from one study."],
          ].map(([title, body]) => (
            <article key={title} className="kazi-card">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="kazi-section pt-0">
        <p className="kazi-kicker">Separate review vs CardioAccess</p>
        <div className="kazi-table-wrap">
          <table className="kazi-table">
            <thead>
              <tr>
                <th />
                <th>Separate review</th>
                <th className="text-sky-300">With CardioAccess AI</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ECG", "Class kept apart from the referral queue", "Four-class screening result on a simulated Lead II trace at 250 Hz"],
                ["Echocardiography", "Volumes and EF reviewed without a shared band", "EDV, ESV, and an EF band with an illustrative segmentation overlay"],
                ["Multimodal", "ECG and echo never meet", "Combined interpretation only when both inputs are eligible"],
                ["Referral", "Normal cases mixed into follow-up lists", "Queue holds Needs Review and Urgent Referral only"],
              ].map(([name, oldWay, next]) => (
                <tr key={name}>
                  <th>{name}</th>
                  <td><span className="text-rose-300">×</span> {oldWay}</td>
                  <td><span className="text-sky-300">✓</span> {next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="modalities" className="kazi-section">
        <p className="kazi-kicker">Three inputs, one workspace</p>
        <h2 className="kazi-h2">Focused views for each modality.</h2>
        <p className="kazi-lede mx-auto text-center">Choose a card to change the preview above. These panels explain the demonstration. They are not a live analysis.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            ["ecg", "ECG screening", "Four-class result", "Normal, Arrhythmia, Ischemic (MI-related), or Other Abnormal. Confidence figures are labelled as simulated demo data."],
            ["echo", "ECHO screening", "EF band", "Move the illustrative EF in the preview. The band follows the screening thresholds and does not diagnose disease."],
            ["fusion", "Multimodal fusion", "Both required", "ECG and echo status are shown together. Fusion stays unavailable until both eligible inputs exist."],
          ].map(([id, title, tag, body]) => (
            <button key={id} type="button" onClick={() => { setFocus(id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`kazi-card text-left ${focus === id ? "kazi-card-on" : ""}`}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">{tag}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="workflow" className="kazi-section">
        <p className="kazi-kicker">How a case connects</p>
        <h2 className="kazi-h2">From intake to a referral summary.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["1", "Submit the case", "Record the patient, the screening date, and ECG, echo, or both. The demonstration then builds a simulated result in the browser."],
            ["2", "Review the study", "Open the ECG waveform or the echo frames, measurements, and EF band. Explanations stay next to the result."],
            ["3", "Triage and refer", "Normal stays out of the queue. Needs Review and Urgent Referral can open a summary that matches the screening result."],
          ].map(([n, title, body]) => (
            <article key={n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">{n}</div>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="kazi-section pt-0">
        <p className="kazi-kicker">How the workspace is organised</p>
        <h2 className="kazi-h2">The rules the screens follow.</h2>
        <div className="kazi-stats">
          {[
            ["4", "ECG screening classes"],
            ["3", "Referral triage states"],
            ["2", "Modalities, ECG and echo"],
            ["1", "Fusion rule: both studies required"],
          ].map(([n, label]) => (
            <div key={label}>
              <div className="font-display text-4xl font-semibold text-sky-400">{n}</div>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">These are product rules for this demonstration, not model accuracy or clinical validation metrics.</p>
      </section>

      <footer className="kazi-foot">
        <div>
          <p className="font-display text-sm font-semibold tracking-wide">CARDIOACCESS AI</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">Research screening support for ECG and echocardiography in resource-limited primary care. Sukkur IBA University project.</p>
        </div>
        <Foot title="Access" actions={[["Sign in", "signin"], ["Create account", "register"]]} onOpen={setGate} />
        <Foot title="Modalities" items={["ECG", "Echocardiography", "Multimodal fusion"]} />
        <Foot title="Triage" items={["Normal", "Needs Review", "Urgent Referral"]} />
      </footer>
      <a href="#" className="kazi-topbtn" aria-label="Back to top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}><ArrowUp size={16} /></a>
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
            <p className="pt-2 text-[11px] text-slate-500">Illustrative class mix for the preview. Not a patient result.</p>
          </div>
        )}
        {focus === "echo" && (
          <div>
            <div className="flex items-center gap-5">
              <div className="ef-ring" style={{ "--p": ring }}><strong>{ef}%</strong><span>EF</span></div>
              <div>
                <p className="text-sm font-semibold text-white">{band}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Illustrative ejection fraction. Drag to see the screening band change.</p>
              </div>
            </div>
            <input className="mt-4 w-full accent-sky-400" type="range" min="28" max="68" value={ef} onChange={(event) => setEf(Number(event.target.value))} aria-label="Illustrative ejection fraction" />
          </div>
        )}
        {focus === "fusion" && (
          <div className="space-y-3 text-sm text-slate-300">
            <p className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>ECG input</span><span className="text-emerald-300">Eligible in this preview</span></p>
            <p className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>ECHO input</span><span className="text-amber-300">Toggle below</span></p>
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
        {both ? "Both inputs are marked eligible, so a combined screening category can be shown. This preview does not create a real case." : "Fusion is unavailable. A fused result is not created from ECG alone."}
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
  const { login, loginWithGoogle, register, resetPassword } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("clinician@bhu-sukkur.pk");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "Clinician", facility: "", password: "", confirm: "" });
  const [otherGoogle, setOtherGoogle] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const titles = { signin: "Sign in", register: "Create account", reset: "Reset password", google: "Google sign-in" };

  const submitSignIn = async (event) => {
    event.preventDefault();
    setError("");
    if (!isEmail(email) || !password) {
      setError("Enter a valid email and password.");
      return;
    }
    setBusy(true);
    await wait(500);
    const result = login({ email, password, keepSignedIn: keep });
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
    const checks = passwordChecks(nextPassword, confirm);
    if (!isEmail(email)) {
      setError("Enter the account email.");
      return;
    }
    if (!checks.length || !checks.letterNumber || !checks.match) {
      setError("Use 8 or more characters with a letter and a number, and match the confirmation.");
      return;
    }
    setBusy(true);
    await wait(400);
    const result = resetPassword({ email, password: nextPassword });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setGate("signin");
    notify("Password updated for this browser.");
  };

  const submitRegister = (event) => {
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
    const result = register(form);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    notify("Account created. An administrator verifies the email before sign-in.");
    setGate("signin");
  };

  const submitGoogle = async (account) => {
    setError("");
    if (!isEmail(account.email)) {
      setError("Enter the Google account email.");
      return;
    }
    if (account.name.trim().length < 2) {
      setError("Enter the name on the Google account.");
      return;
    }
    setBusy(true);
    await wait(450);
    const result = loginWithGoogle({ email: account.email, name: account.name, keepSignedIn: keep });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      notify(result.message);
      return;
    }
    notify(result.created ? "Google account added and signed in." : "Signed in with Google.");
    navigate("/");
  };

  return (
    <div className="kazi-overlay" role="presentation" onClick={onClose}>
      <div className="kazi-window kazi-dialog" role="dialog" aria-modal="true" aria-label={titles[gate]} onClick={(event) => event.stopPropagation()}>
        <div className="kazi-window-bar">
          <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
          <span className="text-xs text-slate-400">{titles[gate]}</span>
          <button type="button" className="text-slate-400 hover:text-white" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="kazi-window-body">
          {gate === "signin" && (
            <form className="space-y-4" onSubmit={submitSignIn}>
              <div>
                <p className="text-sm font-semibold text-white">Welcome back</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Sign in to open the screening workspace. The email and password are checked before the workspace opens.</p>
              </div>
              <GoogleButton onClick={() => { setError(""); setGate("google"); }} />
              <p className="text-center text-[11px] uppercase tracking-[0.14em] text-slate-500">or use email</p>
              <label className="block"><span className="kazi-label">Email address</span><input className="kazi-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="block">
                <span className="kazi-label">Password</span>
                <span className="relative block">
                  <input className="kazi-input pr-11" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={keep} onChange={(event) => setKeep(event.target.checked)} className="accent-blue-500" />
                  Remember me
                </label>
                <button type="button" className="font-medium text-sky-300" onClick={() => { setError(""); setGate("reset"); }}>Forgot password</button>
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="text-sm text-sky-300" onClick={() => { setError(""); setGate("register"); }}>Create account</button>
                <Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : null}{busy ? "Signing in" : "Sign in"}</Button>
              </div>
              <p className="text-[11px] leading-5 text-slate-500">Clinician {DEMO_PASSWORD} · clinician@bhu-sukkur.pk<br />Administrator Admin123! · {ADMIN_EMAIL}</p>
            </form>
          )}
          {gate === "register" && (
            <form className="space-y-3" onSubmit={submitRegister}>
              <p className="text-sm font-semibold text-white">Create account</p>
              <GoogleButton onClick={() => { setError(""); setGate("google"); }} />
              <p className="text-center text-[11px] uppercase tracking-[0.14em] text-slate-500">or register with email</p>
              <label className="block"><span className="kazi-label">Full name</span><input className="kazi-input" value={form.name} onChange={set("name")} /></label>
              <label className="block"><span className="kazi-label">Email</span><input className="kazi-input" type="email" value={form.email} onChange={set("email")} /></label>
              <label className="block">
                <span className="kazi-label">Role</span>
                <select className="kazi-input" value={form.role} onChange={set("role")}>
                  <option>Clinician</option>
                  <option>Nurse</option>
                </select>
              </label>
              <label className="block"><span className="kazi-label">Facility</span><input className="kazi-input" value={form.facility} onChange={set("facility")} placeholder="Clinic or unit" /></label>
              <label className="block">
                <span className="kazi-label">Password</span>
                <span className="relative block">
                  <input className="kazi-input pr-11" type={show ? "text" : "password"} value={form.password} onChange={set("password")} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Show password" onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </span>
              </label>
              <label className="block"><span className="kazi-label">Confirm password</span><input className="kazi-input" type="password" value={form.confirm} onChange={set("confirm")} /></label>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="text-sm text-sky-300" onClick={() => { setError(""); setGate("signin"); }}>Sign in</button>
                <Button type="submit">Register</Button>
              </div>
              <p className="text-[11px] leading-5 text-slate-500">A new account needs email verification before sign-in.</p>
            </form>
          )}
          {gate === "google" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">Sign in with Google</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Choose an account. CardioAccess checks that it is active. The administrator email is not accepted here.</p>
              </div>
              {GOOGLE_ACCOUNTS.map((account) => (
                <button key={account.email} type="button" disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 disabled:opacity-60" onClick={() => submitGoogle(account)}>
                  <GoogleMark />
                  <span>
                    <span className="block text-sm font-medium text-white">{account.name}</span>
                    <span className="block text-xs text-slate-400">{account.email}</span>
                  </span>
                </button>
              ))}
              {otherGoogle ? (
                <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); submitGoogle({ name: googleName, email: googleEmail }); }}>
                  <label className="block"><span className="kazi-label">Name on the Google account</span><input className="kazi-input" value={googleName} onChange={(event) => setGoogleName(event.target.value)} /></label>
                  <label className="block"><span className="kazi-label">Google email</span><input className="kazi-input" type="email" value={googleEmail} onChange={(event) => setGoogleEmail(event.target.value)} /></label>
                  <Button type="submit" disabled={busy}>{busy ? "Checking account" : "Continue"}</Button>
                </form>
              ) : (
                <button type="button" className="text-sm font-medium text-sky-300" onClick={() => setOtherGoogle(true)}>Use another account</button>
              )}
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button type="button" className="text-sm text-sky-300" onClick={() => { setError(""); setGate("signin"); }}>Back to sign in</button>
            </div>
          )}
          {gate === "reset" && (
            <form className="space-y-4" onSubmit={submitReset}>
              <p className="text-sm font-semibold text-white">Reset password</p>
              <label className="block"><span className="kazi-label">Email address</span><input className="kazi-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="block"><span className="kazi-label">New password</span><input className="kazi-input" type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} /></label>
              <label className="block"><span className="kazi-label">Confirm password</span><input className="kazi-input" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <div className="flex items-center justify-between">
                <button type="button" className="text-sm text-sky-300" onClick={() => setGate("signin")}>Back</button>
                <Button type="submit" disabled={busy}>{busy ? "Updating" : "Update password"}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
