import { useState, useEffect, useCallback } from 'react';

export interface AuthUser { id: string; name: string; email: string; plan?: string; }
const KEY = 'omnipoll_auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) { const p = JSON.parse(s); setUser(p.user); setToken(p.token); }
    } catch { /* */ }
    setLoading(false);
  }, []);

  const signIn = useCallback((u: AuthUser, t: string) => {
    localStorage.setItem(KEY, JSON.stringify({ user: u, token: t }));
    setUser(u); setToken(t);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('omnipoll_pid');
    setUser(null); setToken(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(u => {
      if (!u) return u;
      const updated = { ...u, ...updates };
      const s = localStorage.getItem(KEY);
      if (s) { const p = JSON.parse(s); localStorage.setItem(KEY, JSON.stringify({ ...p, user: updated })); }
      return updated;
    });
  }, []);

  return { user, token, loading, signIn, signOut, updateUser };
}
