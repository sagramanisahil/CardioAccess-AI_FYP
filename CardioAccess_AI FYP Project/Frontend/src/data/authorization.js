
export function isAdminUser(account) {
  return Boolean(
    account && account.role?.toLowerCase() === "admin"
  );
}

const ROLE_ACCESS = {
  Admin: [
    "/",
    "/admin/users",
    "/settings",
  ],

  Clinician: [
    "/",
    "/cases/new",
    "/cases",
    "/screening-review",
    "/analytics",
    "/protocols",
    "/settings",
  ],

  Nurse: [
    "/",
    "/cases/new",
    "/cases",
    "/screening-review",
    "/analytics",
    "/protocols",
    "/settings",
  ],
};

export function canAccessPath(user, pathname) {
  if (!user) return false;

  const role = Object.keys(ROLE_ACCESS).find(
    (key) => key.toLowerCase() === user.role?.toLowerCase()
  );

  const allowedPaths = ROLE_ACCESS[role] || [];

  return allowedPaths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  });
}

export function homePathFor(user) {
  return user ? "/" : "/signin";
}
