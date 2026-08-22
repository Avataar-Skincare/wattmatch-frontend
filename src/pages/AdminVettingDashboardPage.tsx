import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Internal PoC test tool (see MINIMAL_PIPELINE_INTEGRATION_PLAN.md) — not linked from site nav.
// Deliberately unstyled and functional, same bar as /auction-live. No auth in front of this yet —
// AUTH_STRATEGY_DECISIONS.md already specifies email+password before this is ever exposed for
// real, this is only for local integration testing.
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

export default function AdminVettingDashboardPage() {
  const [tenderRef, setTenderRef] = useState('');
  const [bids, setBids] = useState<BidSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [technicalShare1, setTechnicalShare1] = useState('');
  const [technicalShare2, setTechnicalShare2] = useState('');
  const [openedTechnical, setOpenedTechnical] = useState<OpenedEntry[] | null>(null);

  const [financialShare1, setFinancialShare1] = useState('');
  const [financialShare2, setFinancialShare2] = useState('');
  const [openedFinancial, setOpenedFinancial] = useState<OpenedEntry[] | null>(null);

  const [promotion, setPromotion] = useState<PromotionResult | null>(null);

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
    <div className="content-page">
      <Seo title="Vetting admin (internal test)" description="Internal vetting-bid ceremony admin tool." path="/admin-vetting" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Vetting admin dashboard</h1>
            <p>Run custodian ceremonies, record technical decisions, and promote a tender to a live auction.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}

            <div>
              <h2>1. Load a tender's submissions</h2>
              <input
                type="text"
                placeholder="Tender ref (id)"
                value={tenderRef}
                onChange={(e) => setTenderRef(e.target.value)}
              />
              <button type="button" className="btn btn-solar" onClick={loadBids}>
                Load submissions
              </button>
              {bids && (
                <ul>
                  {bids.map((b) => (
                    <li key={b.id}>
                      #{b.id} — {b.applicantAlias} — <strong>{b.technicalStatus}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2>2. Open technical envelope (any 2 of 3 technical shares)</h2>
              <input type="text" placeholder="Technical share 1" value={technicalShare1} onChange={(e) => setTechnicalShare1(e.target.value)} />
              <input type="text" placeholder="Technical share 2" value={technicalShare2} onChange={(e) => setTechnicalShare2(e.target.value)} />
              <button type="button" className="btn btn-solar" onClick={openTechnical}>
                Open technical envelope
              </button>
              {openedTechnical && (
                <ul>
                  {openedTechnical.map((o) => (
                    <li key={o.id}>
                      <div>
                        #{o.id} — {o.applicantAlias}: <code>{o.content}</code>
                      </div>
                      <button type="button" onClick={() => recordDecision(o.id, 'approved', o.content)}>
                        Approve
                      </button>
                      <button type="button" onClick={() => recordDecision(o.id, 'rejected', o.content)}>
                        Reject
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2>3. Open financial envelope (any 2 of 3 financial shares)</h2>
              <input type="text" placeholder="Financial share 1" value={financialShare1} onChange={(e) => setFinancialShare1(e.target.value)} />
              <input type="text" placeholder="Financial share 2" value={financialShare2} onChange={(e) => setFinancialShare2(e.target.value)} />
              <button type="button" className="btn btn-solar" onClick={openFinancial}>
                Open financial envelope
              </button>
              {openedFinancial && (
                <ul>
                  {openedFinancial.map((o) => (
                    <li key={o.id}>
                      #{o.id} — {o.applicantAlias}: <code>{o.content}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2>4. Promote to live auction</h2>
              <button type="button" className="btn btn-solar" onClick={promoteToAuction}>
                Promote to auction
              </button>
              {promotion && (
                <div>
                  <p>Auction #{promotion.auctionId} is live.</p>
                  <ul>
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
      <Footer />
    </div>
  );
}
