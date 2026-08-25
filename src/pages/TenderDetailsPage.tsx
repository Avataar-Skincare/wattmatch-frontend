import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Public tender-details page reached from PublicTendersPage's "View tender" button. Shows the
// real fields the DB has today (teaser + per-tender pricing — see GET /tenders/:id/public) and
// decides which CTA to show — buy the document, or enroll — via GET /tenders/:id/purchase-status,
// rather than the old inline card that showed both regardless of purchase state.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface TenderDetail {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
  rfsDocumentFeePaise: number;
  bidProcessingFeePaise: number;
  emdAmountPaise: number;
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function TenderDetailsPage() {
  const [searchParams] = useSearchParams();
  const tenderId = searchParams.get('tenderId');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rfsDocument, setRfsDocument] = useState<{ url: string; filename: string | null } | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [checkEmail, setCheckEmail] = useState('');
  const [purchased, setPurchased] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!tenderId) {
      setLoadError('No tender specified');
      return;
    }
    fetch(`${API_BASE}/api/tenders/${tenderId}/public`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return setLoadError(data.error || 'Failed to load tender');
        setTender(data.tender);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load tender'));

    // Free to download the moment it's uploaded — no gating, so a 404 here just means admin hasn't
    // uploaded one yet, not an error worth surfacing.
    fetch(`${API_BASE}/api/tenders/${tenderId}/rfs-document`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRfsDocument({ url: data.url, filename: data.filename });
      })
      .catch(() => {
        // best-effort — the download button just doesn't show
      });
  }, [tenderId]);

  // Logged-in generators are checked by their own account — no email prompt needed.
  useEffect(() => {
    if (!token || !tenderId) return;
    setChecking(true);
    setCheckError(null);
    fetch(`${API_BASE}/api/tenders/${tenderId}/purchase-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return setCheckError(data.error || 'Could not check purchase status');
        setPurchased(data.purchased);
      })
      .catch((err) => setCheckError(err instanceof Error ? err.message : 'Could not check purchase status'))
      .finally(() => setChecking(false));
  }, [token, tenderId]);

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
      login({ token: data.token, organizationId: data.organizationId, type: data.type });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function handleCheckStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenderId) return;
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/purchase-status?email=${encodeURIComponent(checkEmail)}`);
      const data = await res.json();
      if (!data.success) return setCheckError(data.error || 'Could not check purchase status');
      setPurchased(data.purchased);
      setEnrollEmail(checkEmail);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Could not check purchase status');
    } finally {
      setChecking(false);
    }
  }

  async function handleSelfEnroll() {
    if (!tenderId) return;
    setEnrollMessage(null);
    setEnrollBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/self-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setEnrollMessage({ text: data.error || 'Enrollment failed', kind: 'error' });
        return;
      }
      setEnrollMessage({ text: 'Enrolled from your account.', kind: 'success' });
      navigate(`/submit-bid?tenderId=${tenderId}`);
    } catch (err) {
      setEnrollMessage({ text: err instanceof Error ? err.message : 'Enrollment failed', kind: 'error' });
    } finally {
      setEnrollBusy(false);
    }
  }

  async function handleEnrollWithEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenderId) return;
    setEnrollMessage(null);
    setEnrollBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enrollEmail }),
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 409 && data.accountExists) {
          setEnrollMessage({ text: 'An account already exists for that email — log in above, then enroll from your account.', kind: 'error' });
        } else {
          setEnrollMessage({ text: data.error || 'Enrollment failed', kind: 'error' });
        }
        return;
      }
      setEnrollMessage({ text: "You're enrolled! We've emailed you a link to set your password and log in.", kind: 'success' });
      login({ token: data.token, organizationId: data.organizationId, type: 'generator' });
      navigate(`/submit-bid?tenderId=${tenderId}`);
    } catch (err) {
      setEnrollMessage({ text: err instanceof Error ? err.message : 'Enrollment failed', kind: 'error' });
    } finally {
      setEnrollBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="content-page">
        <Header />
        <main><div className="wrap"><p style={{ color: '#B53A3A' }}>{loadError}</p></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="content-page">
      <Seo title={tender ? tender.title : 'Tender details'} description="Tender basic details, financial instruments, and enrollment." path="/tender-details" />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Tenders</span>
            <h1>{tender ? tender.title : 'Loading…'}</h1>
            {tender && <p>#{tender.id} · {tender.requiredCapacityMw} MW required · {tender.status}</p>}
          </div>
        </div>

        {tender && (
          <section>
            <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2>Tender basic details</h2>
                <table className="reg-table">
                  <tbody>
                    <tr><th>Tender ID</th><td>#{tender.id}</td></tr>
                    <tr><th>Title</th><td>{tender.title}</td></tr>
                    <tr><th>Required capacity</th><td>{tender.requiredCapacityMw} MW</td></tr>
                    <tr><th>Status</th><td>{tender.status}</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h2>Financial instruments</h2>
                <table className="reg-table">
                  <tbody>
                    <tr><th>Cost of RfS document</th><td>{rupees(tender.rfsDocumentFeePaise)}</td></tr>
                    <tr><th>Bid processing fee</th><td>{rupees(tender.bidProcessingFeePaise)}</td></tr>
                    <tr><th>EMD (bank guarantee)</th><td>{rupees(tender.emdAmountPaise)}</td></tr>
                  </tbody>
                </table>
                {rfsDocument && (
                  <a href={rfsDocument.url} className="btn btn-outline" style={{ marginTop: '14px', display: 'inline-flex' }}>
                    Download RfS document
                  </a>
                )}
              </div>

              <div className="enroll-card">
                <h2>Enroll in this tender</h2>

                {purchased !== true && (
                  <a href={`/rfs-document-purchase?tenderId=${tender.id}`} className="btn btn-solar" style={{ alignSelf: 'flex-start' }}>
                    Purchase bid document
                  </a>
                )}

                {!token && (
                  <details>
                    <summary>Already have a Wattmatch account? Log in to self-enroll directly</summary>
                    <form onSubmit={handleLogin}>
                      {loginError && <p className="enroll-message error" style={{ marginBottom: '10px' }}>{loginError}</p>}
                      <div className="field-row">
                        <div className="field">
                          <label>Email</label>
                          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                        </div>
                        <div className="field">
                          <label>Password</label>
                          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-solar">Log in</button>
                    </form>
                  </details>
                )}

                {token && checking && <p>Checking your purchase status…</p>}
                {checkError && <p className="enroll-message error">{checkError}</p>}

                {token && purchased === true && (
                  <button type="button" className="btn btn-solar" onClick={handleSelfEnroll} disabled={enrollBusy} style={{ alignSelf: 'flex-start' }}>
                    Enroll with my account
                  </button>
                )}
                {token && purchased === false && (
                  <p>You haven't purchased this tender's document yet — buy it above, then come back to enroll.</p>
                )}

                {!token && (
                  <details>
                    <summary>Already bought this tender's document?</summary>
                    <div>
                      <form onSubmit={handleCheckStatus} className="enroll-field-row">
                        <div className="field">
                          <label>Email you bought it with</label>
                          <input
                            type="email"
                            value={checkEmail}
                            onChange={(e) => setCheckEmail(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="btn btn-outline" disabled={checking}>Check status</button>
                      </form>

                      {purchased === false && (
                        <p className="enroll-message error" style={{ marginTop: '12px' }}>No purchase found for that email — buy the document above first.</p>
                      )}

                      {purchased === true && (
                        <form onSubmit={handleEnrollWithEmail} className="enroll-field-row" style={{ marginTop: '14px' }}>
                          <div className="field">
                            <label>Email</label>
                            <input
                              type="email"
                              value={enrollEmail}
                              onChange={(e) => setEnrollEmail(e.target.value)}
                              required
                            />
                          </div>
                          <button type="submit" className="btn btn-solar" disabled={enrollBusy}>Enroll</button>
                        </form>
                      )}
                    </div>
                  </details>
                )}

                {enrollMessage && (
                  <p className={`enroll-message ${enrollMessage.kind}`}>{enrollMessage.text}</p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
