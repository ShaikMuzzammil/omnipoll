import { useState, useCallback } from "react";
import type { User } from "@/lib/types";
import { signIn as apiSignIn, signUp as apiSignUp } from "@/lib/api";

const AUTH_KEY = "omnipoll_auth";
const PID_KEY  = "omnipoll_pid";

function uid(len = 10): string {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
    catch { return null; }
  });

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await apiSignIn({ email, password });
    setUser(data.user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      const data = await apiSignUp({ name, email, password });
      setUser(data.user);
      localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
      return data.user;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return { user, signIn, signUp, signOut };
}

/** Returns a stable anonymous participant ID stored in localStorage */
export function getParticipantId(): string {
  let pid = localStorage.getItem(PID_KEY);
  if (!pid) {
    pid = uid();
    localStorage.setItem(PID_KEY, pid);
  }
  return pid;
}
