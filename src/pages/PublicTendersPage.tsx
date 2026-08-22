import { useEffect, useState, type FormEvent } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Stage 2 (TENDER_WORKFLOW_STAKEHOLDER_PLAN.md): "All tenders are listed under a Tenders tab with
// three views: Live, Archived, Completed. Anyone can open a tender and see its basic details... no
// account, no purchase required." This is the actual first step of the funnel — without this page,
// GET /api/tenders worked but nobody could ever discover a tender to buy the document for. Also
// carries Stage 4's two enrollment paths inline per card: the account-less bridge (POST
// /tenders/:id/enroll, for someone who already bought the RfS Document but never registered) and
// authenticated self-enroll (for someone who already has an account) via a lightweight login form.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

type View = 'live' | 'completed' | 'archived';

interface TenderTeaser {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
}

function TenderCard({ tender, token }: { tender: TenderTeaser; token: string | null }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleEnrollWithEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tender.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 402) {
          setMessage({ text: "You'll need to buy this tender's document first — use the link above.", kind: 'error' });
        } else if (res.status === 409 && data.accountExists) {
          setMessage({ text: 'An account already exists for that email — log in above, then use "Self-enroll".', kind: 'error' });
        } else {
          setMessage({ text: data.error || 'Enrollment failed', kind: 'error' });
        }
        return;
      }
      setMessage({ text: "You're enrolled! We've emailed your login details to that address.", kind: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Enrollment failed', kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleSelfEnroll() {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tender.id}/self-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ text: res.status === 402 ? "You'll need to buy this tender's document first." : data.error, kind: 'error' });
        return;
      }
      setMessage({ text: 'Enrolled from your account.', kind: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Enrollment failed', kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stat-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <strong>{tender.title}</strong>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          #{tender.id} · {tender.requiredCapacityMw} MW required · {tender.status}
        </div>
      </div>

      <a href={`/rfs-document-purchase?tenderId=${tender.id}`} className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
        View &amp; buy tender document
      </a>

      {token ? (
        <button type="button" className="btn btn-solar" onClick={handleSelfEnroll} disabled={busy} style={{ alignSelf: 'flex-start' }}>
          Self-enroll with my account
        </button>
      ) : (
        <form onSubmit={handleEnrollWithEmail} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="Email you bought the document with"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: 1, minWidth: 220 }}
          />
          <button type="submit" className="btn btn-outline" disabled={busy}>
            Already bought it — Enroll
          </button>
        </form>
      )}

      {message && <p style={{ color: message.kind === 'success' ? '#2F7A3E' : '#B53A3A', margin: 0 }}>{message.text}</p>}
    </div>
  );
}

export default function PublicTendersPage() {
  const [view, setView] = useState<View>('live');
  const [tenders, setTenders] = useState<TenderTeaser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setTenders(null);
    fetch(`${API_BASE}/api/tenders?view=${view}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return setError(data.error || 'Failed to load tenders');
        setTenders(data.tenders);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tenders'));
  }, [view]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) return setLoginError(data.error);
      setToken(data.token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="content-page">
      <Seo title="Open tenders" description="Browse live, completed, and archived tenders on Wattmatch." path="/tenders" />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Tenders</span>
            <h1>Browse tenders</h1>
            <p>No account needed to browse. Buy a tender's document to see full detail and enroll.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['live', 'completed', 'archived'] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={v === view ? 'btn btn-solar' : 'btn btn-outline'}
                  onClick={() => setView(v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {!token && (
              <details>
                <summary style={{ cursor: 'pointer' }}>Already have a Wattmatch account? Log in to self-enroll directly</summary>
                <form onSubmit={handleLogin} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {loginError && <p style={{ color: '#B53A3A', width: '100%' }}>{loginError}</p>}
                  <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  <button type="submit" className="btn btn-solar">Log in</button>
                </form>
              </details>
            )}
            {token && <p style={{ color: '#2F7A3E' }}>Logged in — each tender below now offers direct self-enroll.</p>}

            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}
            {tenders === null && !error && <p>Loading…</p>}
            {tenders !== null && tenders.length === 0 && <p>No {view} tenders right now.</p>}

            {tenders && tenders.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {tenders.map((t) => (
                  <TenderCard key={t.id} tender={t} token={token} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
