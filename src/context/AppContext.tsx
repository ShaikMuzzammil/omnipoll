import React, { createContext, useContext } from 'react';
import { useAuth, type AuthUser } from '@/hooks/useAuth';

interface AppCtx {
  user: AuthUser | null; token: string | null; loading: boolean;
  signIn: (u: AuthUser, t: string) => void;
  signOut: () => void; updateUser: (u: Partial<AuthUser>) => void;
}
const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <Ctx.Provider value={auth}>{children}</Ctx.Provider>;
}
