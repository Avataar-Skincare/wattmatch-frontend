import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { useAuth, type OrgType } from '../lib/authContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

const DASHBOARD_BY_TYPE: Record<OrgType, string> = {
  buyer: '/buyer-console',
  generator: '/submit-bid',
  admin: '/admin-console',
};

// One login for every account type — the backend already tells us which (Organization.type, baked
// into the token at /organizations/login), so this is the single entry point that replaces the
// three consoles' own copy-pasted login forms, redirecting to whichever dashboard the account
// actually belongs to.
export default function LoginPage() {
  const { auth, hydrated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in (e.g. someone bookmarked /login, or clicked "Log in" while still signed in) —
  // send them straight to their dashboard instead of showing the form again.
  if (hydrated && auth) return <Navigate to={DASHBOARD_BY_TYPE[auth.type]} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      const type = data.type as OrgType;
      login({ token: data.token, organizationId: data.organizationId, type });
      navigate(DASHBOARD_BY_TYPE[type], { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <Seo title="Log in" description="Log in to your Wattmatch buyer, generator, or admin account." path="/login" />
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Wattmatch account</span>
            <h1>Log in</h1>
            <p>One login for buyers, generators, and admins — you'll land on the right dashboard automatically.</p>
          </div>

          <Reveal className="form-card login-form-card">
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="loginEmail">Email</label>
                <input id="loginEmail" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="loginPassword">Password</label>
                <input id="loginPassword" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn-solar" disabled={submitting}>
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
            </form>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
