import { useMemo } from "react";
import AppContext from "./app-context";
import { useAuth } from "../hooks/useAuth";

const EMPTY_DATA = [];

export function AppProvider({ children }) {
  const { user, settings, updateSettings, updateProfile, changePassword } = useAuth();

  const value = useMemo(() => ({
    user,
    users: EMPTY_DATA,
    cases: EMPTY_DATA,
    referrals: EMPTY_DATA,
    audit: EMPTY_DATA,
    settings,
    updateSettings,
    updateProfile,
    changePassword,
    submitCase: async (_draft) => ({
      ok: false,
      message: "Case submission is not connected yet. This frontend needs the FastAPI case and inference service; no simulated result was created.",
    }),
    updateReferral: async () => ({
      ok: false,
      message: "Referral updates require the authenticated FastAPI backend.",
    }),
    updateUser: async () => ({
      ok: false,
      message: "User administration requires the protected FastAPI admin API.",
    }),
  }), [user, settings, updateSettings, updateProfile, changePassword]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
