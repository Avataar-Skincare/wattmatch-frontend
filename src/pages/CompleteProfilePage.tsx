import { useState, type FormEvent } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Linked from the account-less enrollment flow's credentials email (tenders.ts's POST
// /tenders/:id/enroll, services/email.ts's sendGeneratedCredentialsEmail) — that account was built
// from only what an RfS Document purchase captured, with no declared generator capacity, so it
// can't be picked up by the automated matching engine until filled in here. Also usable as
// ordinary self-service profile editing for any already-registered organization.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface OrgProfile {
  id: number;
  type: 'buyer' | 'generator' | 'admin';
  name: string;
  contactEmail: string;
  contactPhone: string;
  capacityMw: string | null;
}

export default function CompleteProfilePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [name, setName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [capacityMw, setCapacityMw] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [saving, setSaving] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setToken(data.token);
      await loadProfile(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  async function loadProfile(authToken: string) {
    try {
      const res = await fetch(`${API_BASE}/api/organizations/me`, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setProfile(data.organization);
      setName(data.organization.name);
      setContactPhone(data.organization.contactPhone);
      setCapacityMw(data.organization.capacityMw ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your profile');
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          contactPhone,
          ...(profile?.type === 'generator' && capacityMw ? { capacityMw: Number(capacityMw) } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setProfile(data.organization);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-page">
      <Seo title="Complete your profile" description="Finish setting up your Wattmatch account." path="/complete-profile" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Account setup</span>
            <h1>Complete your profile</h1>
            <p>
              A few details weren't captured when your account was created — filling them in now
              means WattMatch can match you to tenders automatically going forward.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 480 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}
            {success && <p style={{ color: '#2F7A3E' }}>{success}</p>}

            {!token ? (
              <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="btn btn-solar" disabled={loggingIn}>{loggingIn ? 'Logging in…' : 'Log in'}</button>
              </form>
            ) : profile ? (
              <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label>
                  Company / organization name
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  Contact phone
                  <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                </label>
                {profile.type === 'generator' && (
                  <label>
                    Generation capacity (MW) — used to automatically match you to eligible tenders
                    <input type="number" min="0" step="0.1" value={capacityMw} onChange={(e) => setCapacityMw(e.target.value)} required />
                  </label>
                )}
                <button type="submit" className="btn btn-solar" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </form>
            ) : (
              <p>Loading your profile…</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
