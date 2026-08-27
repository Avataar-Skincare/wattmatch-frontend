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
}

interface MineListedTender {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
  matchesCapacity: boolean;
  invitationStatus: string | null;
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
                          <td>
                            <Link to={`/submit-bid?tenderId=${t.id}`} className="tender-details-link">
                              View
                            </Link>
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
