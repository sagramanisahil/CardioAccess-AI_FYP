
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  UserRoundCheck,
  Stethoscope,
  UserRound,
  UserRoundX,
} from "lucide-react";

import PageContainer from "../components/ui/PageContainer";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

export default function AdminDashboardPage() {
  const { user, accessToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(
          "/admin/users",
          accessToken
        );

        if (!cancelled) {
          setUsers(
            Array.isArray(response.users)
              ? response.users
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load user statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const stats = useMemo(() => {
    const activeUsers = users.filter(
      (item) => item.active === true
    );

    return {
      total: users.length,
      active: activeUsers.length,
      clinicians: activeUsers.filter(
        (item) => item.role?.toLowerCase() === "clinician"
      ).length,
      nurses: activeUsers.filter(
        (item) => item.role?.toLowerCase() === "nurse"
      ).length,
      inactive: users.filter(
        (item) => item.active === false
      ).length,
    };
  }, [users]);

  const cards = [
    {
      title: "Total Registered Users",
      value: stats.total,
      icon: Users,
    },
    {
      title: "Active Accounts",
      value: stats.active,
      icon: UserRoundCheck,
    },
    {
      title: "Active Clinicians",
      value: stats.clinicians,
      icon: Stethoscope,
    },
    {
      title: "Active Nurses",
      value: stats.nurses,
      icon: UserRound,
    },
    {
      title: "Inactive Accounts",
      value: stats.inactive,
      icon: UserRoundX,
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="rounded-3xl bg-navy-950 p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <ShieldCheck
                size={26}
                className="text-mint-300"
              />
            </div>

            <span className="text-sm font-semibold tracking-wide text-sky-200">
              Administrator Workspace
            </span>
          </div>

          <h1
            className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "#ffffff" }}
          >
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            Welcome, {user?.name || "Administrator"}.
            Manage registered users, account access,
            and administrative operations across
            CardioAccess AI.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p className="font-semibold">
              Unable to load dashboard statistics
            </p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <section>
          <div className="mb-5">
            <h2 className="font-display text-2xl font-bold text-navy-950">
              User Overview
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Monitor registered accounts and user
              access across the platform.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-600">
                      {card.title}
                    </p>

                    <div className="rounded-xl bg-sky-50 p-3">
                      <Icon
                        size={22}
                        className="text-clinic-blue"
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-4xl font-bold text-navy-950">
                    {loading || error ? "—" : card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Statistics are retrieved from the
            CardioAccess AI administration API.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-navy-950">
                Administrative Actions
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Manage registered users, update account
                roles, and control account activation.
              </p>
            </div>

            <Link
              to="/admin/users"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-clinic-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Users size={18} />
              Manage Users
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-sky-50 p-3">
              <ShieldCheck
                size={24}
                className="text-clinic-blue"
              />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-navy-950">
                System Administration
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                This workspace provides administrative
                access to user management and account
                permissions. Clinical screening,
                patient case review, ECG/Echo analysis,
                and AI screening results are reserved
                for authorized Clinician and Nurse accounts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
