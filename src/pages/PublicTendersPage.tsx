import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Stage 2 (TENDER_WORKFLOW_STAKEHOLDER_PLAN.md): "All tenders are listed under a Tenders tab with
// three views: Live, Archived, Completed. Anyone can open a tender and see its basic details... no
// account, no purchase required." This is the actual first step of the funnel — without this page,
// GET /api/tenders worked but nobody could ever discover a tender to buy the document for. Full
// detail plus the purchase/enroll CTAs live on TenderDetailsPage, reached via "View tender" below.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

type View = 'live' | 'completed' | 'archived';

const VIEW_LABELS: Record<View, string> = {
  live: 'Live',
  archived: 'Archive',
  completed: 'Tender Results',
};

function isView(value: string | null): value is View {
  return value === 'live' || value === 'completed' || value === 'archived';
}

interface TenderTeaser {
  id: number;
  title: string;
  requiredCapacityMw: string;
  status: string;
}

function TenderCard({ tender }: { tender: TenderTeaser }) {
  return (
    <div className="stat-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <strong>{tender.title}</strong>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          #{tender.id} · {tender.requiredCapacityMw} MW required · {tender.status}
        </div>
      </div>

      <a href={`/tender-details?tenderId=${tender.id}`} className="btn btn-solar" style={{ alignSelf: 'flex-start' }}>
        View tender
      </a>
    </div>
  );
}

export default function PublicTendersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const [view, setView] = useState<View>(isView(requestedView) ? requestedView : 'live');
  const [tenders, setTenders] = useState<TenderTeaser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Header's Tenders dropdown links to /tenders?view=... — since navigating between those
  // links keeps this same page mounted, sync `view` state whenever the URL param changes.
  useEffect(() => {
    if (isView(requestedView) && requestedView !== view) {
      setView(requestedView);
    }
  }, [requestedView]);

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

  return (
    <div className="content-page">
      <Seo title="Open tenders" description="Browse live, completed, and archived tenders on Wattmatch." path="/tenders" />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Tenders</span>
            <h1>Browse tenders</h1>
            <p>No account needed to browse. Open a tender to see full detail, buy its document, or enroll.</p>
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
                  onClick={() => { setView(v); setSearchParams({ view: v }); }}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}
            {tenders === null && !error && <p>Loading…</p>}
            {tenders !== null && tenders.length === 0 && <p>No {view} tenders right now.</p>}

            {tenders && tenders.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {tenders.map((t) => (
                  <TenderCard key={t.id} tender={t} />
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
