import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { initials } from "../../data/format";
import { isAdminUser } from "../../data/authorization";
import Logo from "./Logo";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/cases/new", label: "New Screening" },
  { to: "/cases", label: "Patient Cases" },
  { to: "/referrals", label: "Referral Queue" },
  { to: "/analytics", label: "Analytics" },
  { to: "/protocols", label: "Protocols" },
];

function isCurrent(to, pathname) {
  if (to === "/") return pathname === "/";
  if (to === "/cases/new") return pathname.startsWith("/cases/new");
  if (to === "/cases") return pathname === "/cases" || (/^\/cases\/(?!new)/.test(pathname) && !pathname.includes("/referrals"));
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AppHeader({ user, alerts, onSignOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);
  const urgent = alerts.filter((item) => item.triage === "Urgent Referral");
  const links = isAdminUser(user) ? [...LINKS, { to: "/admin/users", label: "Users" }] : LINKS;

  useEffect(() => {
    setOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = (key) => setOpen((current) => (current === key ? null : key));

  return (
    <header ref={rootRef} className="app-header no-print sticky top-0 z-40 border-b border-white/10 bg-[#071426]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-6">
        <Logo light compact />

        <nav className="hidden items-center justify-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = isCurrent(link.to, location.pathname);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:justify-self-end">
          <div className="relative">
            <button type="button" className="icon-btn relative" aria-label="Notifications" aria-expanded={open === "notes"} onClick={() => toggle("notes")}>
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {Math.min(alerts.length, 9)}
                </span>
              )}
            </button>
            {open === "notes" && (
              <div className="menu-pop right-0 w-80">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-navy-950">Referral alerts</p>
                  <p className="text-xs text-slate-500">{urgent.length} urgent · {alerts.length} open</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No open review or urgent referrals.</p>}
                  {alerts.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5"
                      onClick={() => navigate(`/referrals/${item.caseId}`)}
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.triage === "Urgent Referral" ? "bg-red-600" : "bg-amber-500"}`} />
                      <span>
                        <span className="block text-sm font-medium text-navy-950">{item.triage}</span>
                        <span className="block text-xs text-slate-500">{item.id} · {item.status}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-clinic-blue hover:bg-white/5" onClick={() => navigate("/referrals")}>
                  Open referral queue
                </button>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block">
            <button type="button" className="icon-btn" aria-label="Help" aria-expanded={open === "help"} onClick={() => toggle("help")}>
              <CircleHelp size={18} />
            </button>
            {open === "help" && (
              <div className="menu-pop right-0 w-72 p-4">
                <p className="text-sm font-semibold text-navy-950">Screening support</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Results help clinicians prioritise review and referral. They are not a diagnosis.
                </p>
                <button type="button" className="mt-3 text-sm font-semibold text-clinic-blue" onClick={() => navigate("/protocols")}>
                  View screening protocols
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button type="button" className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white/10" aria-expanded={open === "user"} onClick={() => toggle("user")}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 text-xs font-semibold text-white">
                {user ? initials(user.name) : ""}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold leading-4 text-navy-950">{user?.name}</span>
                <span className="block text-[11px] text-slate-500">{user?.role}</span>
              </span>
              <ChevronDown size={14} className="hidden text-slate-400 md:block" />
            </button>
            {open === "user" && (
              <div className="menu-pop right-0 w-64 p-2">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-navy-950">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-xs text-teal-700">{user?.role} · {user?.facility}</p>
                </div>
                <button type="button" className="menu-item" onClick={() => navigate("/settings")}>
                  <Settings size={15} /> Settings
                </button>
                {isAdminUser(user) && (
                  <button type="button" className="menu-item" onClick={() => navigate("/admin/users")}>
                    <Users size={15} /> Manage users
                  </button>
                )}
                <button type="button" className="menu-item text-red-700" onClick={onSignOut}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>

          <button type="button" className="icon-btn mobile-nav-toggle" aria-label={open === "nav" ? "Close menu" : "Open menu"} onClick={() => toggle("nav")}>
            {open === "nav" ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open === "nav" && (
        <div className="border-t border-slate-200 bg-white px-3 py-3 lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((link) => {
              const active = isCurrent(link.to, location.pathname);
              return (
                <Link key={link.to} to={link.to} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-blue-50 text-clinic-blue" : "text-slate-700 hover:bg-slate-50"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
