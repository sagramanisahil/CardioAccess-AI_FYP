import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { downloadText, formatWhen } from "../data/format";
import { ADMIN_EMAIL, isAdminUser } from "../data/seed";
import { useApp } from "../hooks/useApp";
import { useAuth } from "../hooks/useAuth";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { users, audit, updateUser } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [notice, setNotice] = useState("");
  const rows = useMemo(
    () => users
      .filter((item) => role === "All roles" || item.role === role)
      .filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase())),
    [users, query, role],
  );

  if (!isAdminUser(user)) {
    return <section className="card p-6 text-sm text-slate-600">Only the administrator signed in with {ADMIN_EMAIL} can manage users.</section>;
  }

  const exportAudit = () => {
    const header = "time,event,target,actor";
    const body = audit.map((item) => [item.time, item.event, item.target, item.actor].join(",")).join("\n");
    downloadText("cardioaccess-audit.csv", `${header}\n${body}`);
  };

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Administration" title="Manage users" description={`Signed in as ${ADMIN_EMAIL}. This screen verifies, deactivates, and sets Clinician or Nurse roles. It does not open another user’s case files.`} />
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-display text-base font-semibold">Registered users</h2>
          <label className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="field w-56 pl-8" placeholder="Search email..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select className="field w-36" value={role} onChange={(event) => setRole(event.target.value)}>
            <option>All roles</option>
            <option>Clinician</option>
            <option>Nurse</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Sign-in</th>
              <th>Status</th>
              <th>Last sign-in</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>
                  {isAdminUser(item) ? (
                    <span className="text-sm font-medium">Admin</span>
                  ) : (
                    <select
                      className="field w-32 py-1"
                      value={item.role === "Nurse" ? "Nurse" : "Clinician"}
                      onChange={(event) => {
                        const result = updateUser(item.id, { role: event.target.value });
                        setNotice(result.ok ? "Role updated." : result.message);
                      }}
                    >
                      <option>Clinician</option>
                      <option>Nurse</option>
                    </select>
                  )}
                </td>
                <td>{item.provider === "google" ? "Google" : "Email"}</td>
                <td>
                  <Badge>
                    {!item.active ? "Deactivated" : !item.verified ? "Email unverified" : "Active"}
                  </Badge>
                </td>
                <td className="text-slate-500">{item.lastSignIn ? formatWhen(item.lastSignIn).day : "—"}</td>
                <td className="space-x-3 text-right">
                  {!item.verified && (
                    <button type="button" className="text-clinic-blue" onClick={() => {
                      const result = updateUser(item.id, { verified: true });
                      setNotice(result.ok ? `${item.email} can now sign in.` : result.message);
                    }}>
                      Verify email
                    </button>
                  )}
                  {isAdminUser(item) ? null : item.active ? (
                    <button type="button" className="text-clinic-blue" onClick={() => updateUser(item.id, { active: false })}>
                      Deactivate
                    </button>
                  ) : (
                    <button type="button" className="text-clinic-blue" onClick={() => updateUser(item.id, { active: true })}>Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Only {ADMIN_EMAIL} can open this screen. Other accounts cannot be given the Admin role, and that email cannot be used to register or sign in with Google.
        </p>
        {notice && <p className="mt-2 text-sm text-slate-600">{notice}</p>}
      </section>
      <section id="audit" className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <h2 className="font-display text-base font-semibold">Audit trail</h2>
          <Button variant="secondary" onClick={exportAudit}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Target</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {audit.slice(0, 12).map((item) => (
              <tr key={item.id}>
                <td className="text-slate-500">{formatWhen(item.time).clock}</td>
                <td>{item.event}</td>
                <td>{item.target}</td>
                <td>{item.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
