import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type OrgType = 'buyer' | 'generator' | 'admin';

export interface AuthState {
  token: string;
  organizationId: number;
  type: OrgType;
}

export const HOME_BY_TYPE: Record<OrgType, string> = {
  buyer: '/buyer-console',
  generator: '/generator-dashboard',
  admin: '/admin-console',
};

export const LABEL_BY_TYPE: Record<OrgType, string> = {
  buyer: 'Buyer',
  generator: 'Generator',
  admin: 'Admin',
};

const STORAGE_KEY = 'wattmatch:auth';

interface AuthContextValue {
  auth: AuthState | null;
  // False until the client-only localStorage read has run once — consumers that redirect based on
  // auth state (DashboardShell, LoginPage) must wait for this, otherwise SSG's server-rendered pass
  // (which never sees localStorage) would flash/redirect as if no one is ever logged in.
  hydrated: boolean;
  login: (next: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAuth(JSON.parse(raw));
    } catch {
      // Corrupted value or storage unavailable (private browsing, disabled storage) — start logged
      // out rather than breaking the app.
    }
    setHydrated(true);
  }, []);

  function login(next: AuthState) {
    setAuth(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort — session still works for this tab even if it can't persist across reloads
    }
  }

  function logout() {
    setAuth(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort
    }
  }

  return <AuthContext.Provider value={{ auth, hydrated, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
