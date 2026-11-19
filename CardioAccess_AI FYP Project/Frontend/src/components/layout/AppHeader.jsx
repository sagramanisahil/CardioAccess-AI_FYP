
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

const CLINICAL_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/cases/new", label: "New Screening" },
  { to: "/cases", label: "Patient Cases" },
  { to: "/screening-review", label: "Screening Review" },
  { to: "/analytics", label: "Analytics" },
  { to: "/protocols", label: "Protocols" },
];

const ADMIN_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
];

function isCurrent(to, pathname) {
  if (to === "/") {
    return pathname === "/";
  }

  if (to === "/cases/new") {
    return pathname.startsWith("/cases/new");
  }

  if (to === "/cases") {
    return (
      pathname === "/cases" ||
      /^\/cases\/(?!new)/.test(pathname)
    );
  }

  return (
    pathname === to ||
    pathname.startsWith(`${to}/`)
  );
}

function getTriage(item) {
  if (typeof item?.triage === "string") {
    return item.triage;
  }

  if (item?.triage && typeof item.triage === "object") {
    return item.triage.category || item.triage.label || null;
  }

  return null;
}

function isLowConfidence(item) {
  return (
    item?.lowConfidence === true ||
    item?.confidenceFlag === "low" ||
    item?.confidenceFlag === "low_confidence" ||
    (
      Array.isArray(item?.lowConfidenceModalities) &&
      item.lowConfidenceModalities.length > 0
    )
  );
}

function getFlags(item) {
  const flags = [];
  const triage = getTriage(item);

  if (triage === "Urgent Referral") {
    flags.push("Urgent Referral");
  }

  if (triage === "Needs Review") {
    flags.push("Needs Review");
  }

  if (isLowConfidence(item)) {
    flags.push("Low Confidence");
  }

  return flags;
}

export default function AppHeader({
  user,
  alerts = [],
  onSignOut,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [open, setOpen] = useState(null);

  const isAdmin = isAdminUser(user);
  const links = isAdmin ? ADMIN_LINKS : CLINICAL_LINKS;

  const screeningAlerts = isAdmin
    ? []
    : alerts
        .map((item) => ({
          ...item,
          reviewFlags: getFlags(item),
        }))
        .filter((item) => item.reviewFlags.length > 0);

  const urgentCount = screeningAlerts.filter((item) =>
    item.reviewFlags.includes("Urgent Referral")
  ).length;

  useEffect(() => {
    setOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    function close(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(null);
      }
    }

    document.addEventListener("mousedown", close);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, []);

  function toggle(key) {
    setOpen((current) => current === key ? null : key);
  }

  function goTo(path) {
    setOpen(null);
    navigate(path);
  }

  function getCasePath(item) {
    const caseId =
      item.caseId ||
      item.databaseId ||
      item.case_id ||
      item.record?.id;

    return caseId
      ? `/cases/${caseId}`
      : "/screening-review";
  }

  return (
    <header
      ref={rootRef}
      className="app-header no-print sticky top-0 z-40 border-b border-white/10 bg-[#071426]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-6">
        <Logo light compact />

        <nav
          className="hidden items-center justify-center gap-0.5 lg:flex"
          aria-label="Primary"
        >
          {links.map((link) => {
            const active = isCurrent(link.to, location.pathname);

            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${
                  active ? "nav-link-active" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:justify-self-end">
          {!isAdmin && (
            <div className="relative">
              <button
                type="button"
                className="icon-btn relative"
                aria-label="Screening notifications"
                aria-expanded={open === "notes"}
                onClick={() => toggle("notes")}
              >
                <Bell size={18} />

                {screeningAlerts.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {Math.min(screeningAlerts.length, 9)}
                  </span>
                )}
              </button>

              {open === "notes" && (
                <div className="menu-pop right-0 w-80">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-navy-950">
                      Screening review alerts
                    </p>

                    <p className="text-xs text-slate-500">
                      {urgentCount} urgent · {screeningAlerts.length} flagged
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {screeningAlerts.length === 0 && (
                      <p className="px-4 py-6 text-sm text-slate-500">
                        No flagged screening results are currently available.
                      </p>
                    )}

                    {screeningAlerts.slice(0, 6).map((item, index) => {
                      const urgent = item.reviewFlags.includes(
                        "Urgent Referral"
                      );

                      const primaryFlag = item.reviewFlags[0];

                      const caseCode =
                        item.caseCode ||
                        item.record?.caseCode ||
                        item.caseId ||
                        "Screening case";

                      return (
                        <button
                          key={item.id || item.caseId || index}
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                          onClick={() => goTo(getCasePath(item))}
                        >
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              urgent
                                ? "bg-red-600"
                                : primaryFlag === "Needs Review"
                                  ? "bg-amber-500"
                                  : "bg-purple-600"
                            }`}
                          />

                          <span>
                            <span className="block text-sm font-medium text-navy-950">
                              {primaryFlag}
                            </span>

                            <span className="block text-xs text-slate-500">
                              {caseCode}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-clinic-blue hover:bg-slate-50"
                    onClick={() => goTo("/screening-review")}
                  >
                    Open Screening Review
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative hidden sm:block">
            <button
              type="button"
              className="icon-btn"
              aria-label="Help"
              aria-expanded={open === "help"}
              onClick={() => toggle("help")}
            >
              <CircleHelp size={18} />
            </button>

            {open === "help" && (
              <div className="menu-pop right-0 w-72 p-4">
                {isAdmin ? (
                  <>
                    <p className="text-sm font-semibold text-navy-950">
                      Administrator Help
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Manage user accounts, update roles,
                      and control account access from
                      the administration workspace.
                    </p>

                    <button
                      type="button"
                      className="mt-3 text-sm font-semibold text-clinic-blue"
                      onClick={() => goTo("/admin/users")}
                    >
                      Open User Management
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-navy-950">
                      Screening Support
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      CardioAccess AI provides preliminary
                      screening support. Review flags and
                      screening categories are not diagnoses
                      or autonomous referral decisions.
                      A qualified healthcare professional
                      determines appropriate next steps.
                    </p>

                    <button
                      type="button"
                      className="mt-3 text-sm font-semibold text-clinic-blue"
                      onClick={() => goTo("/protocols")}
                    >
                      View Screening Protocols
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white/10"
              aria-expanded={open === "user"}
              onClick={() => toggle("user")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 text-xs font-semibold text-white">
                {user ? initials(user.name) : ""}
              </span>

              <span className="hidden text-left md:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold leading-4 text-white">
                  {user?.name}
                </span>

                <span className="block text-[11px] text-slate-300">
                  {user?.role}
                </span>
              </span>

              <ChevronDown
                size={14}
                className="hidden text-slate-300 md:block"
              />
            </button>

            {open === "user" && (
              <div className="menu-pop right-0 w-64 p-2">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-navy-950">
                    {user?.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user?.email}
                  </p>

                  <p className="mt-1 text-xs text-teal-700">
                    {user?.role}
                    {user?.facility ? ` · ${user.facility}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="menu-item"
                  onClick={() => goTo("/settings")}
                >
                  <Settings size={15} />
                  Settings
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => goTo("/admin/users")}
                  >
                    <Users size={15} />
                    Manage users
                  </button>
                )}

                <button
                  type="button"
                  className="menu-item text-red-700"
                  onClick={onSignOut}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-btn mobile-nav-toggle"
            aria-label={open === "nav" ? "Close menu" : "Open menu"}
            onClick={() => toggle("nav")}
          >
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
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-clinic-blue"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
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
