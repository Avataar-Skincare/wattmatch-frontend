import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Full-content review view for a single generator's opened submission — reached by clicking a
// generator on AdminVettingDashboardPage once that envelope's ceremony has opened it. Handles both
// envelopes: technical gets the approve/reject decision UI (a separate action from the ceremony
// itself — see vettingBids.ts's own comment); financial is read-only, since a financial envelope
// has no separate decision step — opening it IS the settled figure (see vettingCustodian.ts).
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

type PageState = 'loading' | 'missing-params' | 'not-opened' | 'not-found' | 'ready' | 'deciding' | 'decided' | 'error';

interface OpenedEntry {
  id: number;
  applicantAlias: string;
  content: string;
}

export default function AdminVettingBidDetailPage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenderRef = searchParams.get('tenderRef') ?? '';
  const bidId = searchParams.get('bidId') ?? '';
  const envelope = searchParams.get('envelope') === 'financial' ? 'financial' : 'technical';

  const [pageState, setPageState] = useState<PageState>('loading');
  const [entry, setEntry] = useState<OpenedEntry | null>(null);
  const [technicalStatus, setTechnicalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decidedAs, setDecidedAs] = useState<'approved' | 'rejected' | null>(null);
  const [decidingAs, setDecidingAs] = useState<'approved' | 'rejected' | null>(null);
  // technicalStatus already reflects a decision made in an earlier session (loaded from the server),
  // not just one made just now — this lets the admin deliberately reopen the accept/reject controls
  // for a bid that was already decided before, rather than only ever hiding them for decisions made
  // in the current page visit.
  const [reconsidering, setReconsidering] = useState(false);

  function backToGenerators() {
    navigate(`/admin-vetting?tenderRef=${encodeURIComponent(tenderRef)}`);
  }

  useEffect(() => {
    if (!tenderRef || !bidId || !Number.isFinite(Number(bidId))) {
      setPageState('missing-params');
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const [openedRes, bidsRes] = await Promise.all([
          fetch(`${API_BASE}/api/vetting-bids/${encodeURIComponent(tenderRef)}/opened/${envelope}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/vetting-bids?tenderRef=${encodeURIComponent(tenderRef)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const [openedData, bidsData] = await Promise.all([openedRes.json(), bidsRes.json()]);
        if (cancelled) return;

        if (!openedData.success || !bidsData.success) {
          setError(openedData.error || bidsData.error || 'Failed to load this submission');
          setPageState('error');
          return;
        }

        const found = (openedData.opened as OpenedEntry[]).find((o) => String(o.id) === bidId);
        const bidSummary = (bidsData.bids as Array<{ id: number; technicalStatus: 'pending' | 'approved' | 'rejected' }>).find(
          (b) => String(b.id) === bidId
        );

        if (!bidSummary) {
          setPageState('not-found');
          return;
        }
        if (!found) {
          setPageState('not-opened');
          return;
        }

        setEntry(found);
        setTechnicalStatus(bidSummary.technicalStatus);
        setPageState('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load this submission');
        setPageState('error');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tenderRef, bidId, envelope, token]);

  async function recordDecision(decision: 'approved' | 'rejected') {
    if (!entry) return;
    setError(null);
    setPageState('deciding');
    setDecidingAs(decision);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/${entry.id}/technical-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, reviewedContent: entry.content }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        setPageState('ready');
        return;
      }
      setDecidedAs(decision);
      setTechnicalStatus(decision);
      setReconsidering(false);
      setPageState('decided');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
      setPageState('ready');
    } finally {
      setDecidingAs(null);
    }
  }

  return (
    <>
      <Seo
        title={envelope === 'technical' ? 'Review technical bid (internal test)' : 'Review financial bid (internal test)'}
        description={`Review a generator's opened ${envelope} submission.`}
        path="/admin-vetting-bid"
      />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>{entry ? entry.applicantAlias : 'Review submission'}</h1>
            <p>{envelope === 'technical' ? 'Technical' : 'Financial'} bid content, opened by the custodian ceremony.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720 }}>
            <button type="button" className="btn btn-ghost" onClick={backToGenerators} style={{ alignSelf: 'flex-start' }}>
              ← Back to generators
            </button>

            {pageState === 'loading' && <p>Loading…</p>}

            {pageState === 'missing-params' && (
              <p className="admin-alert error">This link is missing its tender or submission reference. Go back and select a generator again.</p>
            )}

            {pageState === 'not-found' && (
              <p className="admin-alert error">This submission could not be found for the selected tender.</p>
            )}

            {pageState === 'not-opened' && (
              <p className="admin-alert">
                The custodian ceremony hasn't opened this tender's {envelope} content yet — come back once two custodians have
                completed it.
              </p>
            )}

            {pageState === 'error' && <p className="admin-alert error">{error}</p>}

            {(pageState === 'ready' || pageState === 'deciding' || pageState === 'decided') && entry && (
              <div className="admin-card">
                <div className="admin-field-row" style={{ justifyContent: 'space-between' }}>
                  <h2 style={{ marginBottom: 0 }}>#{entry.id} — {entry.applicantAlias}</h2>
                  {technicalStatus && <span className={`status-pill ${technicalStatus}`}>{technicalStatus}</span>}
                </div>

                <div className="opened-row" style={{ marginTop: '14px' }}>
                  <div className="content-line">
                    <code style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{entry.content}</code>
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}

                {envelope === 'financial' ? (
                  <p className="admin-alert" style={{ marginTop: '16px' }}>
                    Financial content has no separate decision step — opening it via the custodian ceremony is the settled
                    figure, already feeding into auction promotion.
                  </p>
                ) : technicalStatus !== 'pending' && !reconsidering ? (
                  <p className="admin-alert" style={{ marginTop: '16px' }}>
                    Decision recorded: {decidedAs ?? technicalStatus}. You can head back to the generator list, or{' '}
                    <button type="button" className="btn btn-ghost" onClick={() => setReconsidering(true)}>
                      change the decision
                    </button>
                    .
                  </p>
                ) : (
                  <div className="decision-actions" style={{ marginTop: '16px' }}>
                    <button type="button" className="btn btn-solar" disabled={pageState === 'deciding'} onClick={() => recordDecision('approved')}>
                      {decidingAs === 'approved' ? 'Accepting…' : 'Accept'}
                    </button>
                    <button type="button" className="btn btn-danger" disabled={pageState === 'deciding'} onClick={() => recordDecision('rejected')}>
                      {decidingAs === 'rejected' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
