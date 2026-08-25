import { useEffect, useState } from 'react';
import Seo from '../components/Seo';

// Internal PoC test tool (see MINIMAL_PIPELINE_INTEGRATION_PLAN.md) — not linked from site nav.
// Deliberately unstyled and functional, same bar as /auction-live. Reached via the shared
// DashboardShell (routes.tsx), which gates the PAGE to a logged-in admin — but the ceremony routes
// themselves (open-technical, technical-decision, open-financial, promote-to-auction) still have no
// backend auth check of their own (AUTH_STRATEGY_DECISIONS.md specifies email+password before this
// is ever exposed for real). That gap is unchanged by this shell — it's a frontend presentation
// grouping, not a backend security fix.
//
// This is the "Vetting" tab of the admin view (DashboardShell's nav also links to "Dashboard", i.e.
// /admin-console). Per the tender/auction PRD: a submitted bid is not accessible to the admin at all
// until its decryption ceremony runs — the generator list below only ever shows who submitted and
// their technical decision status, never bid content. Technical decryption unlocks the technical
// bid for accept/reject; only accepted generators' financial bids are unlockable afterward, and the
// lowest financial bid becomes the auction's starting price automatically (vettingAuctionBridge.ts).
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface BidSummary {
  id: number;
  applicantAlias: string;
  technicalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface OpenedEntry {
  id: number;
  applicantAlias: string;
  content: string;
}

interface PromotionResult {
  auctionId: number;
  windowEndsAt: number;
  links: Array<{ alias: string; joinUrl: string }>;
}

interface TenderOption {
  id: number;
  title: string;
  status: string;
}

export default function AdminVettingDashboardPage() {
  const [tenderRef, setTenderRef] = useState('');
  const [bids, setBids] = useState<BidSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenders, setTenders] = useState<TenderOption[] | null>(null);

  const [technicalShare1, setTechnicalShare1] = useState('');
  const [technicalShare2, setTechnicalShare2] = useState('');
  const [openedTechnical, setOpenedTechnical] = useState<OpenedEntry[] | null>(null);

  const [financialShare1, setFinancialShare1] = useState('');
  const [financialShare2, setFinancialShare2] = useState('');
  const [openedFinancial, setOpenedFinancial] = useState<OpenedEntry[] | null>(null);

  const [promotion, setPromotion] = useState<PromotionResult | null>(null);

  async function loadTenders() {
    try {
      const res = await fetch(`${API_BASE}/api/tenders`);
      const data = await res.json();
      if (data.success) setTenders(data.tenders);
    } catch {
      // dropdown just stays empty — loadBids below still surfaces its own error on submit
    }
  }

  useEffect(() => {
    loadTenders();
  }, []);

  async function loadBids() {
    setError(null);
    setBids(null);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids?tenderRef=${encodeURIComponent(tenderRef)}`);
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setBids(data.bids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    }
  }

  async function openTechnical() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/open-technical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderRef, shares: [technicalShare1, technicalShare2] }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setOpenedTechnical(data.opened);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open technical envelope');
    }
  }

  async function recordDecision(id: number, decision: 'approved' | 'rejected', content: string) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/${id}/technical-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewedContent: content }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadBids();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
    }
  }

  async function openFinancial() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/open-financial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderRef, shares: [financialShare1, financialShare2] }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setOpenedFinancial(data.opened);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open financial envelope');
    }
  }

  async function promoteToAuction() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/${tenderRef}/promote-to-auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setPromotion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote tender to auction');
    }
  }

  return (
    <>
      <Seo title="Vetting admin (internal test)" description="Internal vetting-bid ceremony admin tool." path="/admin-vetting" />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Vetting</h1>
            <p>Run custodian ceremonies, record technical decisions, and generate a live auction.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 720 }}>
            {error && <p className="admin-alert error">{error}</p>}

            <div className="admin-card">
              <h2>1. Select a tender</h2>
              <div className="admin-field-row">
                <select value={tenderRef} onChange={(e) => setTenderRef(e.target.value)}>
                  <option value="">Select a tender…</option>
                  {tenders?.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      #{t.id} — {t.title} ({t.status})
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-solar" onClick={loadBids} disabled={!tenderRef}>
                  Load generators who bid
                </button>
              </div>
              <p className="sub sub-tight">
                Bid content is not accessible yet — this only shows who submitted, and their technical
                decision status, until the relevant decryption ceremony below has run.
              </p>
              {bids && (
                <ul className="admin-list">
                  {bids.map((b) => (
                    <li key={b.id} className="admin-list-row">
                      <span className="row-main">#{b.id} — {b.applicantAlias}</span>
                      <span className={`status-pill ${b.technicalStatus}`}>{b.technicalStatus}</span>
                    </li>
                  ))}
                  {bids.length === 0 && <li className="admin-list-empty">No generators have submitted a bid for this tender yet.</li>}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>2. Technical Bid Decryption</h2>
              <p className="sub sub-tight">Any 2 of the 3 technical custodian shares.</p>
              <div className="admin-field-row">
                <input type="text" placeholder="Technical share 1" value={technicalShare1} onChange={(e) => setTechnicalShare1(e.target.value)} />
                <input type="text" placeholder="Technical share 2" value={technicalShare2} onChange={(e) => setTechnicalShare2(e.target.value)} />
                <button type="button" className="btn btn-solar" onClick={openTechnical}>
                  Run technical decryption ceremony
                </button>
              </div>
              {openedTechnical && (
                <ul className="opened-list">
                  {openedTechnical.map((o) => (
                    <li key={o.id} className="opened-row">
                      <div className="content-line">
                        #{o.id} — {o.applicantAlias}: <code>{o.content}</code>
                      </div>
                      <div className="decision-actions">
                        <button type="button" className="btn btn-solar" onClick={() => recordDecision(o.id, 'approved', o.content)}>
                          Accept
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => recordDecision(o.id, 'rejected', o.content)}>
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>3. Financial Bid Decryption</h2>
              <p className="sub sub-tight">
                Any 2 of the 3 financial custodian shares. Only technically accepted generators'
                financial bids will be unlocked. Run this a few days after the technical decryption
                above, once every generator has an accept/reject.
              </p>
              <div className="admin-field-row">
                <input type="text" placeholder="Financial share 1" value={financialShare1} onChange={(e) => setFinancialShare1(e.target.value)} />
                <input type="text" placeholder="Financial share 2" value={financialShare2} onChange={(e) => setFinancialShare2(e.target.value)} />
                <button type="button" className="btn btn-solar" onClick={openFinancial}>
                  Run financial decryption ceremony
                </button>
              </div>
              {openedFinancial && (
                <ul className="opened-list">
                  {openedFinancial.map((o) => (
                    <li key={o.id} className="opened-row">
                      <div className="content-line">
                        #{o.id} — {o.applicantAlias}: <code>{o.content}</code>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>4. Generate auction</h2>
              <p className="sub sub-tight">
                The lowest financial bid above becomes the auction's starting price automatically.
                Every technically accepted generator gets a unique link to join.
              </p>
              <button type="button" className="btn btn-solar" onClick={promoteToAuction}>
                Generate Auction
              </button>
              {promotion && (
                <div className="promotion-result">
                  <p>Auction #{promotion.auctionId} is live.</p>
                  <ul className="join-links">
                    {promotion.links.map((l) => (
                      <li key={l.alias}>
                        {l.alias}: <code>{l.joinUrl}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
