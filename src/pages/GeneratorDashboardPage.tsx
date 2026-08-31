import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Generator's landing dashboard (HOME_BY_TYPE.generator, authContext.tsx) — browse tenders here,
// then follow "View" / "View / continue" to the single-tender workflow on /submit-bid. Kept as its
// own route (rather than folded into /submit-bid) so navigating into a tender is a real route
// change: the tables unmount instead of sitting stacked above the bid-submission form.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface MineEnrolledTender {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
  stage: string;
  rfsDocumentPaid: boolean;
}

interface MineListedTender {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
  matchesCapacity: boolean;
  invitationStatus: string | null;
  rfsDocumentPaid: boolean;
}

interface MineAuction {
  auctionId: number;
  title: string;
  status: 'scheduled' | 'live' | 'closed';
  alias: string;
  role: 'generator' | 'buyer';
  // Null only for a manually-seeded demo auction — never the case for a real, org-backed
  // participant, since that path always sets it (see vettingAuctionBridge.ts's promotion).
  scheduledStartAt: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  open: 'Open',
  vetting: 'Under vetting',
  live: 'Live',
  closed: 'Closed',
  settled: 'Settled',
};

export default function GeneratorDashboardPage() {
  const { auth } = useAuth();
  const token = auth?.token;

  const [enrolled, setEnrolled] = useState<MineEnrolledTender[] | null>(null);
  const [listed, setListed] = useState<MineListedTender[] | null>(null);
  const [auctions, setAuctions] = useState<MineAuction[] | null>(null);
  const [auctionsError, setAuctionsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    fetch(`${API_BASE}/api/tenders/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return setError(data.error || 'Failed to load your tenders');
        setEnrolled(data.enrolled);
        setListed(data.listed);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your tenders'));

    // Independent of the join-link email a promoted auction sends — if that email is ever lost,
    // this is the one other way to find an auction you're a real participant in (see the backend
    // route's own comment).
    fetch(`${API_BASE}/api/auctions/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return setAuctionsError(data.error || 'Failed to load your auctions');
        setAuctions(data.auctions);
      })
      .catch((err) => setAuctionsError(err instanceof Error ? err.message : 'Failed to load your auctions'));
  }, [token]);

  return (
    <>
      <Seo title="Generator dashboard" description="Your enrolled tenders and all open tenders on Wattmatch." path="/generator-dashboard" />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Dashboard</span>
            <h1>Your tenders</h1>
            <p>Track tenders you've enrolled in, or browse everything that's open.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}

            <div>
              <h2>Your enrolled tenders (RfS document bought)</h2>
              {enrolled === null && !error && <p>Loading…</p>}
              {enrolled !== null && enrolled.length === 0 && <p>You haven't enrolled in any tenders yet.</p>}
              {enrolled && enrolled.length > 0 && (
                <div className="reg-table-wrap" style={{ maxWidth: 'none' }}>
                  <table className="reg-table tenders-table">
                    <thead>
                      <tr>
                        <th>Tender ID</th>
                        <th>Tender Title</th>
                        <th>Capacity Required</th>
                        <th>Stage</th>
                        <th>Tender Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td>{t.title}</td>
                          <td>{t.requiredCapacityMw} MW</td>
                          <td>{STAGE_LABELS[t.stage] || t.stage}</td>
                          <td>
                            <Link to={`/submit-bid?tenderId=${t.id}`} className="tender-details-link">
                              View / continue
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2>Your auctions</h2>
              <p className="sub sub-tight">
                Once a tender you were approved on gets promoted to a live auction, it shows up here — this
                is independent of the emailed join link, in case that one didn't reach you.
              </p>
              {auctionsError && <p style={{ color: '#B53A3A' }}>{auctionsError}</p>}
              {auctions !== null && auctions.length === 0 && !auctionsError && <p>No auctions yet.</p>}
              {auctions && auctions.length > 0 && (
                <div className="reg-table-wrap" style={{ maxWidth: 'none' }}>
                  <table className="reg-table tenders-table">
                    <thead>
                      <tr>
                        <th>Auction</th>
                        <th>Your alias</th>
                        <th>Scheduled start</th>
                        <th>Status</th>
                        <th>Join</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctions.map((a) => (
                        <tr key={a.auctionId}>
                          <td>#{a.auctionId} — {a.title}</td>
                          <td>{a.alias}</td>
                          <td>{a.scheduledStartAt ? new Date(a.scheduledStartAt).toLocaleString() : '—'}</td>
                          <td>{a.status === 'live' ? 'Live' : a.status === 'closed' ? 'Closed' : 'Scheduled'}</td>
                          <td>
                            <Link to={`/auction-live?auctionId=${a.auctionId}`} className="tender-details-link">
                              {a.status === 'closed' ? 'View result' : 'Join'}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2>All tenders</h2>
              {listed !== null && listed.length === 0 && <p>No tenders yet.</p>}
              {listed && listed.length > 0 && (
                <div className="reg-table-wrap" style={{ maxWidth: 'none' }}>
                  <table className="reg-table tenders-table">
                    <thead>
                      <tr>
                        <th>Tender ID</th>
                        <th>Tender Title</th>
                        <th>Capacity Required</th>
                        <th>Status</th>
                        <th>Matches your capacity</th>
                        <th>Invitation</th>
                        <th>Bid document</th>
                        <th>Tender Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listed.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td>{t.title}</td>
                          <td>{t.requiredCapacityMw} MW</td>
                          <td>{STAGE_LABELS[t.status] || t.status}</td>
                          <td>{t.matchesCapacity ? 'Yes' : 'No'}</td>
                          <td>{t.invitationStatus ?? '—'}</td>
                          <td>{t.rfsDocumentPaid ? 'Purchased' : 'Not purchased'}</td>
                          <td>
                            {t.rfsDocumentPaid ? (
                              <Link to={`/submit-bid?tenderId=${t.id}`} className="tender-details-link">
                                {t.invitationStatus ? 'Continue enrollment' : 'View'}
                              </Link>
                            ) : (
                              <Link to={`/rfs-document-purchase?tenderId=${t.id}`} className="tender-details-link">
                                Purchase bid document
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
