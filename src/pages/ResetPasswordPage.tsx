import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Consumes the one 'password_reset'-purpose token/link organizations.ts issues from two different
// places — ForgotPasswordPage's request form, and the account-created email the lead-capture forms
// trigger (registrations.ts) — the backend route treats both indistinguishably, so one page serves
// both. This page only ever consumes an existing link.
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <Seo title="Set your password" description="Set your Wattmatch account password." path="/reset-password" />
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Wattmatch account</span>
            <h1>Set your password</h1>
            <p>Choose a password to finish setting up your account.</p>
          </div>

          <Reveal className="form-card login-form-card">
            {!token ? (
              <p className="form-error">This link is missing its token — please use the link from your email.</p>
            ) : done ? (
              <p>Password set. Redirecting you to log in…</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="newPassword">New password</label>
                  <input id="newPassword" type="password" placeholder="At least 10 characters" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-solar" disabled={submitting}>
                  {submitting ? 'Setting password…' : 'Set password'}
                </button>
              </form>
            )}
            {!done && (
              <p className="form-note">
                Already have a password? <Link to="/login">Log in instead</Link>.
              </p>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
