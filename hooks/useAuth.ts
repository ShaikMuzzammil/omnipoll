'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

const AUTH_KEY = 'omnipoll_auth';

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { user: AuthUser; token: string };
        setState({ user: parsed.user, token: parsed.token, loading: false });
        return;
      }
    } catch { /* ignore */ }
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const login = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('omnipoll_pid');
    setState({ user: null, token: null, loading: false });
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState((s) => {
      if (!s.user) return s;
      const updated = { ...s.user, ...updates };
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: updated, token: s.token }));
      return { ...s, user: updated };
    });
  }, []);

  return { ...state, login, logout, updateUser };
}

// Context version for provider pattern
interface AuthContextValue extends AuthState {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AuthContext = createContext<AuthContextValue>(null as any);

export function useAuthContext() {
  return useContext(AuthContext);
}
