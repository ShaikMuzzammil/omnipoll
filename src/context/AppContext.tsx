import React, {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import Pusher from 'pusher-js';
import { authApi, notifApi } from '@/lib/api';
import type { User, Notification } from '@/lib/types';

interface AppCtx {
  user:          User | null;
  loading:       boolean;
  pusher:        Pusher | null;
  notifications: Notification[];
  unreadCount:   number;
  login:         (token: string, user: User) => void;
  logout:        () => void;
  refreshUser:   () => Promise<void>;
  refreshNotifs: () => Promise<void>;
  markRead:      (id: string) => Promise<void>;
  markAllRead:   () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]    = useState<User | null>(null);
  const [loading,       setLoading] = useState(true);
  const [pusher,        setPusher]  = useState<Pusher | null>(null);
  const [notifications, setNotifs]  = useState<Notification[]>([]);

  /* ── Boot: restore session ── */
  useEffect(() => {
    const token = localStorage.getItem('op_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((u) => { setUser(u as User); })
      .catch(() => localStorage.removeItem('op_token'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Pusher init when user is known ── */
  useEffect(() => {
    const key     = import.meta.env.VITE_PUSHER_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER ?? 'ap2';
    if (!key || !user) return;

    const p = new Pusher(key, { cluster, authEndpoint: '/api/pusher/auth' });
    setPusher(p);

    // Private user channel for notifications
    const ch = p.subscribe(`private-user-${user.id}`);
    ch.bind('notification', (n: Notification) => {
      setNotifs(prev => [n, ...prev]);
    });

    return () => { p.disconnect(); setPusher(null); };
  }, [user?.id]);

  /* ── Notifications ── */
  const refreshNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const list = await notifApi.list() as Notification[];
      setNotifs(list);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { refreshNotifs(); }, [refreshNotifs]);

  const markRead = useCallback(async (id: string) => {
    await notifApi.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await notifApi.markAll();
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  /* ── Auth helpers ── */
  const login = useCallback((token: string, u: User) => {
    localStorage.setItem('op_token', token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('op_token');
    setUser(null);
    setNotifs([]);
    pusher?.disconnect();
  }, [pusher]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.me() as User;
      setUser(u);
    } catch { logout(); }
  }, [logout]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Ctx.Provider value={{
      user, loading, pusher, notifications, unreadCount,
      login, logout, refreshUser, refreshNotifs, markRead, markAllRead,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
