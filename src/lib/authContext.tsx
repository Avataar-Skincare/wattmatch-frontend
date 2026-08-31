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

// Exact text middleware/auth.ts's authRequired sends for an expired/invalid/missing org JWT — the
// one and only signal this app has that a session, not just one particular request, has gone bad.
// Matched verbatim rather than on status code alone: a 401 with a DIFFERENT message means something
// else entirely (wrong password on the login form itself, a custodian's separate ceremony-link
// token expiring on CustodianCeremonyPage.tsx) and must not silently wipe out a real session.
const EXPIRED_SESSION_ERROR = 'Missing or invalid organization token';

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

  // Every page in this app makes its own raw fetch() calls directly — there's no shared API client
  // to hook into, so every dashboard's session-expiry handling was previously identical to any other
  // error: setError(data.error), shown inline wherever the click happened. The stored token was
  // never cleared and nobody was ever sent back to /login — an expired 12h session just looked like
  // a broken app until the person manually logged out and back in themselves. Patching window.fetch
  // once, globally, catches this everywhere without touching the ~10 pages that call fetch directly,
  // the same "one global side effect" approach RootProviders.tsx already uses for the number-input
  // wheel-scroll fix. response.clone() is required: every caller still does its own res.json() right
  // after this runs, and a Response body can only be read once.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        response
          .clone()
          .json()
          .then((data) => {
            if (data?.error === EXPIRED_SESSION_ERROR && window.location.pathname !== '/login') {
              setAuth(null);
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                // best-effort
              }
              window.location.href = `/login?reason=expired&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            }
          })
          .catch(() => {
            // Not a JSON body (or already consumed elsewhere) — nothing this handler can act on.
          });
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
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
