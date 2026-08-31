import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Closes a real gap found in the wild: someone filled in /ciBuyer's registration form, it saved
// correctly (POST /api/registrations/ci — a CIRegistration row plus a buyer Organization account),
// but there was no admin page anywhere that ever read src/routes/admin.ts's registration/lead
// routes — they existed and worked, nothing in the frontend ever called them. This is deliberately
// separate from AdminConsolePage.tsx's "Pending tender requests": that list is TenderRequest rows,
// only created once a buyer has already logged in and submitted a real RFP — a registration here is
// an earlier, lead-capture step, before any of that.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

interface CIRegistrationRow {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  load: string;
  siteLocation: string | null;
  targetCapacity: string | null;
  tenurePreference: string | null;
  message: string | null;
  buyerOrgId: number | null;
  createdAt: string;
}

interface GeneratorRegistrationRow {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  capacity: string;
  siteLocation: string | null;
  commissioningTimeline: string | null;
  message: string | null;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const { auth } = useAuth();
  const token = auth?.token;

  const [ciRegistrations, setCiRegistrations] = useState<CIRegistrationRow[] | null>(null);
  const [generatorRegistrations, setGeneratorRegistrations] = useState<GeneratorRegistrationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const [ciRes, genRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/registrations/ci?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/registrations/generator?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!ciRes.ok || !genRes.ok) {
        setError('Failed to load registrations');
        return;
      }
      setCiRegistrations(await ciRes.json());
      setGeneratorRegistrations(await genRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <>
      <Seo title="Leads (internal test)" description="C&I buyer and generator registration submissions." path="/admin-leads" />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Leads</h1>
            <p>Everyone who's registered via /ciBuyer or /renewablesGenerator — before they've logged in or submitted a real tender request.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 900 }}>
            {error && <p className="admin-alert error">{error}</p>}

            <div className="admin-card">
              <h2>C&amp;I buyer registrations</h2>
              <button type="button" className="btn btn-outline" onClick={load} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              {ciRegistrations && (
                <ul className="admin-list">
                  {ciRegistrations.map((r) => (
                    <li key={r.id} className="admin-list-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span className="row-main">
                        <strong>{r.name || '—'}</strong> — {r.company || '—'} · {r.email} · {r.phone}
                      </span>
                      <span className="meta">
                        {r.state ? `${r.state} · ` : ''}
                        {r.targetCapacity ? `${r.targetCapacity} MW max demand · ` : ''}
                        {r.load ? `${r.load} kWh/mo · ` : ''}
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                      {r.message && <span className="meta">"{r.message}"</span>}
                    </li>
                  ))}
                  {ciRegistrations.length === 0 && <li className="admin-list-empty">No C&amp;I buyer registrations yet.</li>}
                </ul>
              )}
            </div>

            <div className="admin-card">
              <h2>Generator registrations</h2>
              <button type="button" className="btn btn-outline" onClick={load} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              {generatorRegistrations && (
                <ul className="admin-list">
                  {generatorRegistrations.map((r) => (
                    <li key={r.id} className="admin-list-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span className="row-main">
                        <strong>{r.name || '—'}</strong> — {r.company || '—'} · {r.email} · {r.phone}
                      </span>
                      <span className="meta">
                        {r.state ? `${r.state} · ` : ''}
                        {r.capacity ? `${r.capacity} MW · ` : ''}
                        {r.commissioningTimeline ? `Commissioning: ${r.commissioningTimeline} · ` : ''}
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                      {r.message && <span className="meta">"{r.message}"</span>}
                    </li>
                  ))}
                  {generatorRegistrations.length === 0 && <li className="admin-list-empty">No generator registrations yet.</li>}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
