
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { downloadText, formatWhen } from "../data/format";
import { isAdminUser } from "../data/authorization";
import { useApp } from "../hooks/useApp";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

export default function AdminUsersPage() {
  const { user, accessToken } = useAuth();
  const { audit } = useApp();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      if (!accessToken) {
        setLoadingUsers(false);
        return;
      }

      try {
        setLoadingUsers(true);
        setError("");

        const response = await apiRequest("/admin/users", accessToken);

        const formattedUsers = response.users.map((item) => ({
          ...item,
          role: item.role
            ? item.role.charAt(0).toUpperCase() + item.role.slice(1)
            : "Clinician",
        }));

        setUsers(formattedUsers);
      } catch (err) {
        setError(err.message || "Unable to load users.");
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [accessToken]);

  const rows = useMemo(
    () =>
      users
        .filter((item) => role === "All roles" || item.role === role)
        .filter((item) =>
          `${item.name} ${item.email}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        ),
    [users, query, role]
  );

  const handleStatusChange = async (item) => {
    const nextStatus = !item.active;

    try {
      const response = await apiRequest(
        `/admin/users/${item.id}/status`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus }),
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((userItem) =>
          userItem.id === item.id
            ? { ...userItem, active: nextStatus }
            : userItem
        )
      );

      setNotice(response.message || "User status updated successfully.");
    } catch (err) {
      setNotice(err.message || "Could not update user status.");
    }
  };

  const handleRoleChange = async (item, newRole) => {
    try {
      const response = await apiRequest(
        `/admin/users/${item.id}/role`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({ role: newRole.toLowerCase() }),
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((userItem) =>
          userItem.id === item.id
            ? { ...userItem, role: newRole }
            : userItem
        )
      );

      setNotice(response.message || "Role updated successfully.");
    } catch (err) {
      setNotice(err.message || "Could not update role.");
    }
  };

  const exportAudit = () => {
    const header = "time,event,target,actor";

    const body = audit
      .map((item) =>
        [item.time, item.event, item.target, item.actor].join(",")
      )
      .join("\n");

    downloadText("cardioaccess-audit.csv", `${header}\n${body}`);
  };

  if (!isAdminUser(user)) {
    return (
      <section className="card p-6 text-sm text-slate-600">
        Only an administrator can manage users.
      </section>
    );
  }

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Administration"
        title="Manage users"
        description={`Signed in as ${user.email}. Manage registered user accounts here.`}
      />

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-display text-base font-semibold">
            Registered users
          </h2>

          <label className="relative">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-slate-400"
            />
            <input
              className="field w-56 pl-8"
              placeholder="Search email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <select
            className="field w-36"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option>All roles</option>
            <option>Clinician</option>
            <option>Nurse</option>
            <option>Admin</option>
          </select>
        </div>

        {loadingUsers && (
          <p className="p-4 text-sm text-slate-500">
            Loading registered users...
          </p>
        )}

        {error && (
          <p className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loadingUsers && !error && rows.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            No users found.
          </p>
        )}

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
                <th>Action</th>
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
                        value={item.role}
                        disabled={!item.active}
                        onChange={(event) =>
                          handleRoleChange(item, event.target.value)
                        }
                      >
                        <option value="Clinician">Clinician</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Admin">Admin</option>
                      </select>
                    )}
                  </td>

                  <td>
                    {item.provider === "google" ? "Google" : "Email"}
                  </td>

                  <td>
                    <Badge>
                      {!item.active
                        ? "Inactive"
                        : !item.verified
                          ? "Email unverified"
                          : "Active"}
                    </Badge>
                  </td>

                  <td className="text-slate-500">
                    {item.lastSignIn
                      ? formatWhen(item.lastSignIn).day
                      : "—"}
                  </td>

                  <td className="text-right">
                    {!isAdminUser(item) && (
                      <button
                        type="button"
                        className={`font-medium ${
                          item.active
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                        onClick={() => handleStatusChange(item)}
                      >
                        {item.active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Public registration cannot grant Admin access. Administrator role
          changes must be handled securely by the backend.
        </p>

        {notice && (
          <p className="m-4 text-sm text-slate-600">{notice}</p>
        )}
      </section>

      <section id="audit" className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <h2 className="font-display text-base font-semibold">
            Audit trail
          </h2>

          <Button variant="secondary" onClick={exportAudit}>
            Export CSV
          </Button>
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
                  <td className="text-slate-500">
                    {formatWhen(item.time).clock}
                  </td>
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
