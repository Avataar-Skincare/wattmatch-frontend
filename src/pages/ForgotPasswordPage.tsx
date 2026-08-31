import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Requests a password_reset link via POST /organizations/forgot-password — that route already
// existed and is anti-enumeration safe (always responds success regardless of whether the email
// matches an account), but nothing in the frontend ever called it. This closes a real gap: an
// account whose original account-created email never arrived (e.g. registrations.ts's lead-capture
// flow, if SMTP delivery failed) had no self-service way to ever get a working link — the backend
// escape hatch existed, it just wasn't reachable from anywhere.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Something went wrong — try again.');
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <Seo title="Forgot password" description="Request a password reset link for your Wattmatch account." path="/forgot-password" />
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Wattmatch account</span>
            <h1>Forgot your password?</h1>
            <p>Enter your account email and we'll send a link to set a new password.</p>
          </div>

          <Reveal className="form-card login-form-card">
            {done ? (
              <p>If an account exists for that email, a reset link has been sent — check your inbox.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="forgotEmail">Email</label>
                  <input id="forgotEmail" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-solar" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
            <p className="form-note">
              <Link to="/login">Back to log in</Link>.
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
