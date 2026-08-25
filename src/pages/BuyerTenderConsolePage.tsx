import { useState } from 'react';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Internal PoC test tool, same bar as /admin-vetting and /admin-console — unstyled, functional, not
// linked from site nav. Reached via the shared DashboardShell (routes.tsx), which already gates
// this to a logged-in buyer — no login form of its own any more. The buyer is a lightweight client:
// submit a tender REQUEST, then track its status. Everything past that — matching, document
// checklist management, document review, and settlement — is 100% admin-only (see /admin-console);
// the buyer has no operational role in running a tender once they've requested it, and is informed
// of outcomes separately, not through this dashboard.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface TenderRequestSummary {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: 'pending' | 'converted' | 'declined';
  tenderId: number | null;
}

export default function BuyerTenderConsolePage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [requiredCapacityMw, setRequiredCapacityMw] = useState('');
  const [requirementsDetail, setRequirementsDetail] = useState('');
  const [myRequests, setMyRequests] = useState<TenderRequestSummary[] | null>(null);

  async function loadMyRequests() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tender-requests/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setMyRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your tender requests');
    }
  }

  async function submitTenderRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tender-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          requiredCapacityMw: Number(requiredCapacityMw),
          requirementsDetail: requirementsDetail || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadMyRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit tender request');
    }
  }

  return (
    <>
      <Seo title="Buyer console (internal test)" description="Internal buyer tender request tool." path="/buyer-console" />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Buyer console</h1>
            <p>Submit a tender request and track its status. WattMatch's admin team runs everything else from there.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}

            <form onSubmit={submitTenderRequest}>
              <h2>Submit a tender request</h2>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                You no longer post a live tender directly — WattMatch reviews your request and
                creates the actual tender (with its own pricing) from it.
              </p>
              <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Required capacity (MW)"
                value={requiredCapacityMw}
                onChange={(e) => setRequiredCapacityMw(e.target.value)}
                required
              />
              <textarea
                placeholder="Full requirements (only visible to invited generators)"
                value={requirementsDetail}
                onChange={(e) => setRequirementsDetail(e.target.value)}
                rows={4}
                style={{ width: '100%' }}
              />
              <button type="submit" className="btn btn-solar">Submit request</button>
            </form>

            <div>
              <h3>My tender requests</h3>
              <button type="button" className="btn btn-outline" onClick={loadMyRequests}>
                Refresh
              </button>
              {myRequests && (
                <ul>
                  {myRequests.map((r) => (
                    <li key={r.id}>
                      #{r.id} — {r.title} ({r.requiredCapacityMw} MW) — {r.status}
                      {r.tenderId && <> — tender #{r.tenderId}</>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
