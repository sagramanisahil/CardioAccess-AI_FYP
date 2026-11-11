export function isAdminUser(account) {
  return Boolean(account && account.role?.toLowerCase() === "admin");
}
