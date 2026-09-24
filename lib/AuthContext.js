"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

function sameUser(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.role === b.role &&
    a.active_mode === b.active_mode &&
    a.verification_status === b.verification_status &&
    a.verification_note === b.verification_note &&
    a.full_name === b.full_name &&
    a.updated_at === b.updated_at &&
    a.verified_at === b.verified_at
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const keepUser = (next) => {
      if (!active) return;
      setUser((prev) => (sameUser(prev, next) ? prev : next));
    };

    const load = async () => {
      try {
        keepUser(await api.auth.me());
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };

    load();

    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        if (active) setUser(null);
        return;
      }
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        return;
      }
      try {
        keepUser(await api.auth.me());
      } catch {
        if (active) setUser(null);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const next = await api.auth.login(email, password);
    setUser(next);
    return next;
  };

  const register = async (payload) => {
    const next = await api.auth.register(payload);
    if (next?.needsOtp) return next;
    setUser(next);
    return next;
  };

  const verifySignupOtp = async (email, token) => {
    const next = await api.auth.verifySignupOtp(email, token);
    setUser(next);
    return next;
  };

  const resendSignupOtp = async (email) => {
    await api.auth.resendSignupOtp(email);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const refresh = async () => {
    try {
      const next = await api.auth.me();
      setUser((prev) => (sameUser(prev, next) ? prev : next));
    } catch {
      setUser(null);
    }
  };

  const [modeFlash, setModeFlash] = useState(null);

  const clearModeFlash = useCallback(() => setModeFlash(null), []);

  const setMode = async (mode) => {
    setModeFlash(mode);
    try {
      const next = await api.profile.setMode(mode);
      setUser(next);
      return next;
    } catch (err) {
      setModeFlash(null);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, ready, isAuthenticated: Boolean(user), login, register, verifySignupOtp, resendSignupOtp, logout, refresh, setMode, modeFlash, clearModeFlash }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
