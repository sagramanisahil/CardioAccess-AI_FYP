
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const DEFAULT_SETTINGS = {
  emailAlerts: true,
  reviewReminders: true,
  reminderThreshold: 0.7,
  showBanner: true,
};

function mapProfile(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile.full_name || authUser.user_metadata?.full_name || "",
    role:
      profile.role === "admin"
        ? "Admin"
        : profile.role === "nurse"
          ? "Nurse"
          : "Clinician",
    facility: profile.facility || "",
    active: profile.is_active,
    approvalStatus: profile.approval_status,
    verified: Boolean(authUser.email_confirmed_at),
    provider: authUser.app_metadata?.provider || "email",
    lastSignIn: authUser.last_sign_in_at || null,
  };
}

function configurationError() {
  return "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart Vite.";
}

function accessError(profile) {
  if (!profile) {
    return "Your profile is not ready. Please contact the system administrator.";
  }

  if (profile.approval_status === "pending") {
    return "Your account is awaiting Admin approval. You can sign in after your account has been approved.";
  }

  if (profile.approval_status === "rejected") {
    return "Your account registration was rejected. Please contact the system administrator.";
  }

  if (profile.approval_status !== "approved") {
    return "Your account approval status is invalid. Please contact the system administrator.";
  }

  if (!profile.is_active) {
    return "Your account is deactivated. Contact the system administrator.";
  }

  return "";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const clearSession = useCallback(() => {
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
    setLoading(false);
  }, []);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      clearSession();
      return;
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select(
        "id, full_name, role, facility, is_active, approval_status"
      )
      .eq("id", authUser.id)
      .maybeSingle();

    if (error || !profile) {
      setUser(null);
      setAuthError(
        error?.message ||
          "Your profile is not ready. Please contact the system administrator."
      );
      setLoading(false);
      return;
    }

    const message = accessError(profile);

    if (message) {
      await supabase.auth.signOut();
      setUser(null);
      setSettings(DEFAULT_SETTINGS);
      setAuthError(message);
      setLoading(false);
      return;
    }

    setUser(mapProfile(authUser, profile));

    const { data: preferenceRow } = await supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", authUser.id)
      .maybeSingle();

    setSettings({
      ...DEFAULT_SETTINGS,
      ...(preferenceRow?.settings || {}),
    });

    setAuthError("");
    setLoading(false);
  }, [clearSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthError(configurationError());
      setLoading(false);
      return undefined;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);

      window.setTimeout(() => {
        void loadProfile(session?.user || null);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: configurationError() };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, role, is_active, approval_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();

      const message =
        profileError?.message ||
        "Your profile is not ready. Please contact the system administrator.";

      setAuthError(message);
      return { ok: false, message };
    }

    const message = accessError(profile);

    if (message) {
      await supabase.auth.signOut();
      setAuthError(message);
      return { ok: false, message };
    }

    setAuthError("");
    return { ok: true };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: configurationError() };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    return error
      ? { ok: false, message: error.message }
      : { ok: true };
  }, []);

  const register = useCallback(
    async ({ name, email, facility, password }) => {
      if (!isSupabaseConfigured) {
        return { ok: false, message: configurationError() };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name.trim(),
            facility: facility.trim(),
          },
        },
      });

      if (error) {
        return { ok: false, message: error.message };
      }

      return {
        ok: true,
        email: data.user?.email,
        needsEmailVerification: !data.session,
        message:
          "Registration successful. Your account is awaiting Admin approval.",
      };
    },
    []
  );

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: configurationError() };
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, message: error.message };
    }

    setAuthError("");
    return { ok: true };
  }, []);

  const resetPassword = useCallback(async ({ email }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: configurationError() };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/signin`,
      }
    );

    return error
      ? { ok: false, message: error.message }
      : { ok: true };
  }, []);

  const changePassword = useCallback(async ({ nextPassword }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: configurationError() };
    }

    const { error } = await supabase.auth.updateUser({
      password: nextPassword,
    });

    return error
      ? { ok: false, message: error.message }
      : { ok: true };
  }, []);

  const updateProfile = useCallback(
    async ({ name, facility }) => {
      if (!user || !isSupabaseConfigured) {
        return {
          ok: false,
          message: "Sign in to update your profile.",
        };
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          full_name: name,
          facility,
        })
        .eq("id", user.id)
        .select(
          "id, full_name, role, facility, is_active, approval_status"
        )
        .single();

      if (error) {
        return { ok: false, message: error.message };
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(mapProfile(authUser, data));
      return { ok: true };
    },
    [user]
  );

  const updateSettings = useCallback(
    async (patch) => {
      if (!user || !isSupabaseConfigured) {
        return {
          ok: false,
          message: "Sign in to update preferences.",
        };
      }

      const next = {
        ...settings,
        ...patch,
      };

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          settings: next,
        });

      if (error) {
        return { ok: false, message: error.message };
      }

      setSettings(next);
      return { ok: true };
    },
    [settings, user]
  );

  const value = useMemo(
    () => ({
      user,
      settings,
      loading,
      authError,
      login,
      loginWithGoogle,
      logout,
      register,
      resetPassword,
      changePassword,
      updateProfile,
      updateSettings,
    }),
    [
      user,
      settings,
      loading,
      authError,
      login,
      loginWithGoogle,
      logout,
      register,
      resetPassword,
      changePassword,
      updateProfile,
      updateSettings,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

