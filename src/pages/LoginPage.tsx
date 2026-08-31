import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { useAuth, HOME_BY_TYPE, type OrgType } from '../lib/authContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// One login for every account type — the backend already tells us which (Organization.type, baked
// into the token at /organizations/login), so this is the single entry point that replaces the
// three consoles' own copy-pasted login forms, redirecting to whichever dashboard the account
// actually belongs to. An optional ?next= sends the caller back to wherever they came from instead
// (e.g. AuctionLivePage redirecting here to join an auction) — only honored when it's a same-site
// relative path, never an absolute/external URL, so this can't be turned into an open redirect.
export default function LoginPage() {
  const { auth, hydrated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextParam = searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
  // Set by authContext.tsx's global 401 handler when a stale 12h session gets a request rejected —
  // without this, someone bounced back here mid-task would just see a blank login form with no
  // explanation for why they're suddenly logged out.
  const sessionExpired = searchParams.get('reason') === 'expired';

  // Already logged in (e.g. someone bookmarked /login, or clicked "Log in" while still signed in) —
  // send them straight to their dashboard (or back to ?next=, if that's why they're here) instead of
  // showing the form again.
  if (hydrated && auth) return <Navigate to={nextPath ?? HOME_BY_TYPE[auth.type]} replace />;

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
      navigate(nextPath ?? HOME_BY_TYPE[type], { replace: true });
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
            {sessionExpired && <p className="form-note" style={{ marginBottom: '14px' }}>Your session expired — log in again to continue.</p>}
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
            <p className="form-note">
              <Link to="/forgot-password">Forgot your password?</Link>
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
