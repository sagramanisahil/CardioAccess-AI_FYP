import { useState } from "react";
import Button from "../components/ui/Button";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import { initials, passwordChecks } from "../data/format";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function SettingsPage() {
  const { user, settings, updateProfile, updateSettings, changePassword } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [facility, setFacility] = useState(user?.facility || "");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const saveProfile = async () => {
    if (name.trim().length < 2) return;
    const result = await updateProfile({ name: name.trim(), facility: facility.trim() });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    notify("Profile saved.");
  };

  const savePassword = async () => {
    setError("");
    const checks = passwordChecks(nextPassword, confirm);
    if (!checks.length || !checks.letterNumber || !checks.match) {
      setError("Use at least 8 characters with a letter and a number, and match both fields.");
      return;
    }
    const result = await changePassword({ nextPassword });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNextPassword("");
    setConfirm("");
    notify("Password updated in this browser.");
  };

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader eyebrow="Account" title="Settings" description="Profile, notifications, display, and password for your account." />

      <section className="card card-hover p-5">
        <h2 className="font-display text-base font-semibold">User profile</h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-950 text-sm font-semibold text-white">{user ? initials(user.name) : ""}</div>
          <div>
            <div className="font-medium">{user?.role}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>
        <label className="label mt-4">Full name</label>
        <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
        <label className="label mt-4">Facility</label>
        <input className="field" value={facility} onChange={(event) => setFacility(event.target.value)} />
        <label className="label mt-4">Email</label>
        <input className="field bg-slate-50" readOnly value={user?.email || ""} />
        <Button className="mt-4" onClick={saveProfile}>Save profile</Button>
      </section>

      <section className="card card-hover p-5">
        <h2 className="font-display text-base font-semibold">Notification preferences</h2>
        <Toggle label="Alerts for urgent referrals" checked={settings.emailAlerts} onChange={async (value) => { const result = await updateSettings({ emailAlerts: value }); notify(result.ok ? "Preference saved." : result.message); }} />
        <Toggle label="Reminders for cases that need review" checked={settings.reviewReminders} onChange={async (value) => { const result = await updateSettings({ reviewReminders: value }); notify(result.ok ? "Preference saved." : result.message); }} />
      </section>

      <section className="card card-hover p-5">
        <h2 className="font-display text-base font-semibold">Display preferences</h2>
        <Toggle label="Show the screening-support note on the dashboard" checked={settings.showBanner !== false} onChange={async (value) => { const result = await updateSettings({ showBanner: value }); notify(result.ok ? "Preference saved." : result.message); }} />
        <p className="mt-3 text-xs text-slate-500">Display choices do not change screening categories.</p>
      </section>

      <section className="card card-hover p-5">
        <h2 className="font-display text-base font-semibold">Password</h2>
        <label className="label mt-4">New password</label>
        <input className="field" type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
        <label className="label mt-4">Confirm password</label>
        <input className="field" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button className="mt-4" onClick={savePassword}>Update password</Button>
      </section>
    </PageContainer>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
