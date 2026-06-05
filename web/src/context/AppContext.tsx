import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { clearSession, readSession, writeSession } from "@/lib/api";
import type { User } from "@/lib/types";

interface AppContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  sessionReady: boolean;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  setUser: () => {},
  logout: () => {},
  sessionReady: false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session?.user) {
      setUserState(session.user as User);
    } else {
      try {
        const auth = JSON.parse(localStorage.getItem("omnipoll_auth") || "null");
        if (auth) setUserState(auth);
      } catch {}
    }
    setSessionReady(true);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) writeSession({ user: u });
    else clearSession();
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    clearSession();
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, logout, sessionReady }}>
      {children}
    </AppContext.Provider>
  );
}

/** Named export — used as: import { useApp } from "@/context/AppContext" */
export function useApp(): AppContextValue {
  return useContext(AppContext);
}

/** Alias hook */
export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}

export default AppContext;
