export function isAdminUser(account) {
  return Boolean(account && account.role?.toLowerCase() === "admin");
}

const ROLE_ACCESS = {
  Admin: ["*"],
  Clinician: [
    "/",
    "/cases/new",
    "/cases",
    "/referrals",
    "/analytics",
    "/protocols",
    "/settings",
  ],
  Nurse: ["/", "/cases/new", "/cases", "/protocols", "/settings"],
};

export function canAccessPath(user, pathname) {
  if (!user) return false;
  const allowedPaths = ROLE_ACCESS[user.role] || [];
  if (allowedPaths.includes("*")) return true;

  return allowedPaths.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export function homePathFor(user) {
  return user ? "/" : "/signin";
}
