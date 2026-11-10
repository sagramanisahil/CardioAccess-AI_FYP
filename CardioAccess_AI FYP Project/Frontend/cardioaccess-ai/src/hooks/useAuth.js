import { useApp } from "./useApp";

export function useAuth() {
  const { user, login, loginWithGoogle, logout, register, verifyEmail, resetPassword, changePassword, updateProfile, updateSettings, settings } =
    useApp();
  return { user, login, loginWithGoogle, logout, register, verifyEmail, resetPassword, changePassword, updateProfile, updateSettings, settings };
}
