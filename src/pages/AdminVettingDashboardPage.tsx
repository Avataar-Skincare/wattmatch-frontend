import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Internal PoC test tool (see MINIMAL_PIPELINE_INTEGRATION_PLAN.md) — not linked from site nav.
// Deliberately unstyled and functional, same bar as /auction-live. Reached via the shared
// DashboardShell (routes.tsx), which gates the PAGE to a logged-in admin.
//
// This is the "Vetting" tab of the admin view (DashboardShell's nav also links to "Dashboard", i.e.
// /admin-console). Per the tender/auction PRD: a submitted bid is not accessible to the admin at all
// until its decryption ceremony runs — but that ceremony no longer happens here. Custodians run it
// independently via their own emailed links (CustodianCeremonyPage.tsx, routes/vettingCustodian.ts)
// — this page only ever shows what a completed ceremony already opened (GET
// /vetting-bids/:tenderRef/opened/:envelope), never runs one itself. Technical decisions are still
// recorded here; only accepted generators' financial content is ever opened, and the lowest
// financial figure becomes the auction's starting price automatically (vettingAuctionBridge.ts).
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface BidSummary {
  id: number;
  applicantAlias: string;
  technicalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  hasOpenedTechnicalContent: boolean;
  hasOpenedFinancialContent: boolean;
}

interface PromotionResult {
  auctionId: number;
  scheduledStartAt: string;
  links: Array<{ alias: string; joinUrl: string }>;
  // Read-only spectator seat for admin's own use — whether the real buyer org should get a seat
  // here at all is a separate, pending product decision, not built yet. This link needs no login.
  spectatorLink: { alias: string; joinUrl: string };
}

interface TenderOption {
  id: number;
  title: string;
  status: string;
}

export default function AdminVettingDashboardPage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tenderRef, setTenderRef] = useState(() => searchParams.get('tenderRef') ?? '');
  const [bids, setBids] = useState<BidSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenders, setTenders] = useState<TenderOption[] | null>(null);

  // Decides whether "custodian invites" is a genuine resend (the scheduled open date has already
  // passed, so an automatic first send either already fired or was supposed to) or actually the
  // first send (clicked early) — see the button labels below. The two *Ceremony fields give admin
  // something to act on besides "it looks stuck" — how many custodians have actually been notified
  // out of the roster, and whether the ceremony has actually completed.
  const [ceremonyDates, setCeremonyDates] = useState<{
    technicalBidOpenAt: string | null;
    financialBidOpenAt: string | null;
    technicalCeremony: { notifiedCount: number; totalCustodians: number; completed: boolean };
    financialCeremony: { notifiedCount: number; totalCustodians: number; completed: boolean };
  } | null>(null);

  // Reveal-on-demand, not auto-shown — mirrors "Review technical/financial bids" being disabled
  // until that envelope's ceremony has opened at least one submission (see the buttons below).
  const [showTechnicalReview, setShowTechnicalReview] = useState(false);
  const [showFinancialReview, setShowFinancialReview] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [loadingBids, setLoadingBids] = useState(false);
  const [resendingEnvelope, setResendingEnvelope] = useState<'technical' | 'financial' | null>(null);
  const [promoting, setPromoting] = useState(false);

  const [promotion, setPromotion] = useState<PromotionResult | null>(null);
  const [scheduledStartAt, setScheduledStartAt] = useState('');

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
    // A tenderRef in the URL means we've landed here from the "Back to generators" link on a bid's
    // review page — restore the same list instead of showing a blank picker again.
    const initial = searchParams.get('tenderRef');
    if (initial) loadBids(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBids(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    if (!ref) return;
    setError(null);
    setBids(null);
    setCeremonyDates(null);
    setShowTechnicalReview(false);
    setShowFinancialReview(false);
    setLoadingBids(true);
    try {
      const [bidsRes, datesRes] = await Promise.all([
        fetch(`${API_BASE}/api/vetting-bids?tenderRef=${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/tenders/${encodeURIComponent(ref)}/ceremony-dates`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const data = await bidsRes.json();
      if (!data.success) return setError(data.error);
      setBids(data.bids);

      const datesData = await datesRes.json();
      if (datesData.success) {
        setCeremonyDates({
          technicalBidOpenAt: datesData.technicalBidOpenAt,
          financialBidOpenAt: datesData.financialBidOpenAt,
          technicalCeremony: datesData.technicalCeremony,
          financialCeremony: datesData.financialCeremony,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoadingBids(false);
    }
  }

  // Genuinely a resend once the scheduled open date has passed (an automatic first send either
  // already fired or was supposed to) — before that, notifyCustodians itself has no time gate, so
  // clicking this really would be the first send, not a resend (see the server route's own comment).
  function isResend(openAt: string | null | undefined): boolean {
    return !!openAt && new Date(openAt).getTime() <= Date.now();
  }

  function selectTender(ref: string) {
    setTenderRef(ref);
    setSearchParams(ref ? { tenderRef: ref } : {});
  }

  function reviewBid(bidId: number, envelope: 'technical' | 'financial') {
    navigate(`/admin-vetting-bid?tenderRef=${encodeURIComponent(tenderRef)}&bidId=${bidId}&envelope=${envelope}`);
  }

  async function resendCustodianInvites(envelope: 'technical' | 'financial') {
    setError(null);
    setResendNotice(null);
    setResendingEnvelope(envelope);
    const verb = isResend(envelope === 'technical' ? ceremonyDates?.technicalBidOpenAt : ceremonyDates?.financialBidOpenAt) ? 'resent' : 'sent';
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${encodeURIComponent(tenderRef)}/custodian-ceremony/${envelope}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setResendNotice(`${envelope === 'technical' ? 'Technical' : 'Financial'} ceremony invites ${verb} to every custodian.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend ceremony invites');
    } finally {
      setResendingEnvelope(null);
    }
  }

  async function promoteToAuction() {
    setError(null);
    // A blank or past start time would otherwise reach the backend as an invalid/missing value —
    // catching it here gives an immediate, specific message instead of a round-trip 400. Scheduling
    // is mandatory: this tool never generates an auction that goes live immediately.
    if (!scheduledStartAt) {
      setError('Pick an auction start date and time — auctions are never generated live.');
      return;
    }
    const candidate = new Date(scheduledStartAt);
    if (candidate.getTime() <= Date.now()) {
      setError('Auction start must be in the future.');
      return;
    }
    // Guards against a double-click generating two auctions for the same tender — the button below
    // is already disabled while this is in flight, this is the belt-and-suspenders check in case the
    // click somehow lands twice before the first render commits.
    if (promoting) return;
    setPromoting(true);
    try {
      const res = await fetch(`${API_BASE}/api/vetting-bids/${tenderRef}/promote-to-auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduledStartAt: candidate.toISOString() }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setPromotion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote tender to auction');
    } finally {
      setPromoting(false);
    }
  }

  return (
    <>
      <Seo title="Vetting admin (internal test)" description="Internal vetting-bid admin tool." path="/admin-vetting" />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Vetting</h1>
            <p>Review what custodians have opened, record technical decisions, and generate a live auction.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 720 }}>
            {error && <p className="admin-alert error">{error}</p>}
            {resendNotice && <p className="admin-alert">{resendNotice}</p>}

            <div className="admin-card">
              <h2>1. Select a tender</h2>
              <div className="admin-field-row">
                <select value={tenderRef} onChange={(e) => selectTender(e.target.value)}>
                  <option value="">Select a tender…</option>
                  {tenders?.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      #{t.id} — {t.title} ({t.status})
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-solar" onClick={() => loadBids()} disabled={!tenderRef || loadingBids}>
                  {loadingBids ? 'Loading…' : 'Load generators who bid'}
                </button>
              </div>
              <p className="sub sub-tight">
                Bid content is not accessible until a custodian ceremony has opened it — custodians act
                independently via their own emailed links, not from this page. Use "Review technical/
                financial bids" below once a ceremony has run.
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
              <h2>2. Technical ceremony</h2>
              <p className="sub sub-tight">
                Run independently by the technical custodians via their own emailed links. If a custodian
                never got theirs (or it expired), resend it here.
              </p>
              {ceremonyDates && (
                <p className="sub sub-tight">
                  {ceremonyDates.technicalCeremony.completed
                    ? 'Ceremony completed.'
                    : `${ceremonyDates.technicalCeremony.notifiedCount} of ${ceremonyDates.technicalCeremony.totalCustodians} custodians notified so far.`}
                </p>
              )}
              <div className="admin-field-row">
                <button
                  type="button"
                  className="btn btn-solar"
                  onClick={() => setShowTechnicalReview(true)}
                  disabled={!bids || !bids.some((b) => b.hasOpenedTechnicalContent)}
                  title={!bids || !bids.some((b) => b.hasOpenedTechnicalContent) ? 'No technical content opened yet — run the ceremony first' : undefined}
                >
                  Review technical bids
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => resendCustodianInvites('technical')} disabled={!tenderRef || resendingEnvelope !== null}>
                  {resendingEnvelope === 'technical' ? 'Sending…' : isResend(ceremonyDates?.technicalBidOpenAt) ? 'Resend custodian invites' : 'Send custodian invites now'}
                </button>
              </div>
              {showTechnicalReview && bids && (
                <ul className="admin-list">
                  {bids.filter((b) => b.hasOpenedTechnicalContent).map((b) => (
                    <li key={b.id} className="admin-list-row">
                      <span className="row-main">#{b.id} — {b.applicantAlias}</span>
                      <span className="row-main">
                        <span className={`status-pill ${b.technicalStatus}`}>{b.technicalStatus}</span>
                        <button type="button" className="btn btn-ghost" onClick={() => reviewBid(b.id, 'technical')}>
                          Review →
                        </button>
                      </span>
                    </li>
                  ))}
                  {bids.filter((b) => b.hasOpenedTechnicalContent).length === 0 && (
                    <li className="admin-list-empty">No technical content opened yet.</li>
                  )}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>3. Financial bid content</h2>
              <p className="sub sub-tight">
                Opened by the financial custodians' own ceremony, once it's run — only technically
                accepted generators' financial content is ever opened, so run the technical ceremony and
                record decisions first.
              </p>
              {ceremonyDates && (
                <p className="sub sub-tight">
                  {ceremonyDates.financialCeremony.completed
                    ? 'Ceremony completed.'
                    : `${ceremonyDates.financialCeremony.notifiedCount} of ${ceremonyDates.financialCeremony.totalCustodians} custodians notified so far.`}
                </p>
              )}
              <div className="admin-field-row">
                <button
                  type="button"
                  className="btn btn-solar"
                  onClick={() => setShowFinancialReview(true)}
                  disabled={!bids || !bids.some((b) => b.hasOpenedFinancialContent)}
                  title={!bids || !bids.some((b) => b.hasOpenedFinancialContent) ? 'No financial content opened yet — run the ceremony first' : undefined}
                >
                  Review financial bids
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => resendCustodianInvites('financial')} disabled={!tenderRef || resendingEnvelope !== null}>
                  {resendingEnvelope === 'financial' ? 'Sending…' : isResend(ceremonyDates?.financialBidOpenAt) ? 'Resend custodian invites' : 'Send custodian invites now'}
                </button>
              </div>
              {showFinancialReview && bids && (
                <ul className="admin-list">
                  {bids.filter((b) => b.hasOpenedFinancialContent).map((b) => (
                    <li key={b.id} className="admin-list-row">
                      <span className="row-main">#{b.id} — {b.applicantAlias}</span>
                      <button type="button" className="btn btn-ghost" onClick={() => reviewBid(b.id, 'financial')}>
                        Review →
                      </button>
                    </li>
                  ))}
                  {bids.filter((b) => b.hasOpenedFinancialContent).length === 0 && (
                    <li className="admin-list-empty">No financial content opened yet.</li>
                  )}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>4. Generate auction</h2>
              <p className="sub sub-tight">
                The lowest financial bid above becomes the auction's starting price automatically.
                Every technically accepted generator is emailed a unique link to join.
              </p>
              <div className="admin-field-row">
                <label>
                  Auction start (required){' '}
                  <input
                    type="datetime-local"
                    value={scheduledStartAt}
                    onChange={(e) => setScheduledStartAt(e.target.value)}
                    required
                  />
                </label>
                <button type="button" className="btn btn-solar" onClick={promoteToAuction} disabled={!scheduledStartAt || promoting || promotion !== null}>
                  {promoting ? 'Generating…' : promotion ? 'Auction generated' : 'Generate Auction'}
                </button>
              </div>
              <p className="sub sub-tight">Auctions always launch at the scheduled time — never immediately.</p>
              {promotion && (
                <div className="promotion-result">
                  <p>
                    Auction #{promotion.auctionId} is scheduled to go live on{' '}
                    {new Date(promotion.scheduledStartAt).toLocaleString()}. Join links have already
                    been emailed to every generator.
                  </p>
                  <ul className="join-links">
                    {promotion.links.map((l) => (
                      <li key={l.alias}>
                        {l.alias}: <code>{l.joinUrl}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="sub sub-tight">
                    Spectator link (read-only, no login needed — for your own use; the buyer isn't seated
                    in this auction yet, that's a separate pending decision):
                  </p>
                  <ul className="join-links">
                    <li>
                      {promotion.spectatorLink.alias}: <code>{promotion.spectatorLink.joinUrl}</code>
                    </li>
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
