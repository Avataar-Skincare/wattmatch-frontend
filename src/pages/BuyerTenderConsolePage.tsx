import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Internal PoC test tool, same bar as /admin-vetting and /admin-console — unstyled, functional, not
// linked from site nav. Reached via the shared DashboardShell (routes.tsx), which already gates
// this to a logged-in buyer — no login form of its own any more. The buyer is a lightweight client:
// submit a tender REQUEST, then track both that request's status and (once an admin converts it)
// the real tender itself. Everything past that — matching, document checklist management, document
// review, and settlement — is 100% admin-only (see /admin-console); the buyer has no operational
// role in running a tender once they've requested it, and is informed of outcomes separately, not
// through this dashboard.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface TenderRequestSummary {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: 'pending' | 'converted' | 'declined';
  tenderId: number | null;
}

interface BuyerTenderSummary {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: 'open' | 'vetting' | 'live' | 'closed';
  createdAt: string;
  auction: { id: number; status: 'scheduled' | 'live' | 'closed' } | null;
}

const STAGE_LABELS: Record<string, string> = {
  open: 'Open',
  vetting: 'Under vetting',
  live: 'Live',
  closed: 'Closed',
  scheduled: 'Scheduled',
};

export default function BuyerTenderConsolePage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [requiredCapacityMw, setRequiredCapacityMw] = useState('');
  const [requirementsDetail, setRequirementsDetail] = useState('');
  const [myRequests, setMyRequests] = useState<TenderRequestSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [myTenders, setMyTenders] = useState<BuyerTenderSummary[] | null>(null);
  const [loadingTenders, setLoadingTenders] = useState(false);

  async function loadMyRequests() {
    setError(null);
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/tender-requests/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setMyRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your tender requests');
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMyTenders() {
    setError(null);
    setLoadingTenders(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/mine-as-buyer`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setMyTenders(data.tenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your tenders');
    } finally {
      setLoadingTenders(false);
    }
  }

  // Dashboard-style: both trackers load themselves the moment the page opens, same as
  // GeneratorDashboardPage.tsx does for its own tenders/auctions — no manual "Load" click needed
  // just to see where things stand; the Refresh buttons below are for re-checking later.
  useEffect(() => {
    if (!token) return;
    loadMyRequests();
    loadMyTenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitTenderRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
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
      setSuccess(`Request #${data.id} submitted — WattMatch will review it and follow up.`);
      setTitle('');
      setRequiredCapacityMw('');
      setRequirementsDetail('');
      await loadMyRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit tender request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Seo title="Buyer console (internal test)" description="Internal buyer tender request tool." path="/buyer-console" />
      <main className="admin-page buyer-console-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Buyer dashboard</h1>
            <p>Track your current tenders, or apply for a new one below. WattMatch's admin team runs everything else from there.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {error && <p className="admin-alert error">{error}</p>}
            {success && <p className="admin-alert success">{success}</p>}

            <div className="admin-card">
              <h2>Your tenders</h2>
              <p className="sub sub-tight">
                Real, priced tenders WattMatch has created from your requests. Once one goes to
                auction, its status and a link to watch it live show up here.
              </p>
              {loadingTenders && myTenders === null && <p>Loading…</p>}
              {myTenders !== null && myTenders.length === 0 && <p>No tenders yet — apply for one below.</p>}
              {myTenders && myTenders.length > 0 && (
                <div className="reg-table-wrap" style={{ maxWidth: 'none' }}>
                  <table className="reg-table tenders-table">
                    <thead>
                      <tr>
                        <th>Tender ID</th>
                        <th>Title</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Auction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTenders.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td>{t.title}</td>
                          <td>{t.requiredCapacityMw} MW</td>
                          <td><span className={`status-pill ${t.status}`}>{STAGE_LABELS[t.status] ?? t.status}</span></td>
                          <td>
                            {t.auction ? (
                              <Link to={`/auction-live?auctionId=${t.auction.id}`} className="tender-details-link">
                                {STAGE_LABELS[t.auction.status] ?? t.auction.status} — view
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button type="button" className="btn btn-outline" onClick={loadMyTenders} disabled={loadingTenders} style={{ marginTop: '0.85rem' }}>
                {loadingTenders ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <form onSubmit={submitTenderRequest} className="admin-card">
              <h2>Apply for a tender</h2>
              <p className="sub sub-tight">
                You no longer post a live tender directly — WattMatch reviews your request and
                creates the actual tender (with its own pricing) from it.
              </p>
              <div className="admin-field-grid">
                <div className="admin-field">
                  <label className="admin-field-hint" htmlFor="buyerTenderTitle">Title</label>
                  <input id="buyerTenderTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="admin-field">
                  <label className="admin-field-hint" htmlFor="buyerTenderCapacity">Required capacity (MW)</label>
                  <input
                    id="buyerTenderCapacity"
                    type="number"
                    min="1"
                    step="1"
                    value={requiredCapacityMw}
                    onChange={(e) => setRequiredCapacityMw(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="admin-field">
                <label className="admin-field-hint" htmlFor="buyerTenderRequirements">
                  Full requirements (only visible to invited generators)
                </label>
                <textarea
                  id="buyerTenderRequirements"
                  value={requirementsDetail}
                  onChange={(e) => setRequirementsDetail(e.target.value)}
                  rows={4}
                />
              </div>
              <button type="submit" className="btn btn-solar" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </form>

            <div className="admin-card">
              <h2>Your tender requests</h2>
              <p className="sub sub-tight">Every request you've submitted, and its status once WattMatch reviews it.</p>
              <button type="button" className="btn btn-outline" onClick={loadMyRequests} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              {myRequests && (
                <ul className="admin-list">
                  {myRequests.map((r) => (
                    <li key={r.id} className="admin-list-row">
                      <span className="row-main">
                        #{r.id} — {r.title}
                        <span className="meta">{r.requiredCapacityMw} MW</span>
                      </span>
                      <span className="row-main">
                        <span className={`status-pill ${r.status}`}>{r.status}</span>
                        {r.tenderId && <span className="meta">Tender #{r.tenderId}</span>}
                      </span>
                    </li>
                  ))}
                  {myRequests.length === 0 && <li className="admin-list-empty">No tender requests yet — apply for one above.</li>}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
