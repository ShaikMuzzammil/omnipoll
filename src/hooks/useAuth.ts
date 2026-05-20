import { useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/types";
import { signIn as apiSignIn, signUp as apiSignUp } from "@/lib/api";

const AUTH_KEY = "omnipoll_auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
    catch { return null; }
  });

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiSignIn({ email, password });
    setUser(data.user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiSignUp({ name, email, password });
    setUser(data.user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return { user, signIn, signUp, signOut };
}

export function getParticipantId(): string {
  const key = "omnipoll_pid";
  let pid = localStorage.getItem(key);
  if (!pid) {
    pid = Math.random().toString(36).slice(2, 12).toUpperCase();
    localStorage.setItem(key, pid);
  }
  return pid;
}
