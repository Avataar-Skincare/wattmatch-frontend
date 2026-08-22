import { useState, type FormEvent } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { indianStates } from '../data/content';
import { sealPayload } from '../lib/vettingSeal';

// Internal PoC test tool, same bar as /admin-vetting and /auction-live — unstyled, functional, not
// linked from site nav. Field set is the WattMatch-adapted subset of SECI RfS Format 7.1 (technical
// covering letter) and Format 7.11 (financial bid), narrowed per §3.7.A/B/E of
// WATTMATCH_TENDER_SPEC.md: consortium/paper-instrument fields dropped, capacity/tech-mix/location/
// declarations kept. Partial-award acceptance is deliberately left out of the declarations set —
// whether WattMatch supports multi-generator/partial awards at all is still an open product
// question, so this form doesn't silently assume an answer either way.
//
// Submission now requires real login + an accepted tender invitation (see tenders.ts /
// vettingBids.ts) — there is no free-text applicant alias any more, identity is always the logged
// in generator org. Both envelopes are sealed with the Web Crypto API in this component, before
// anything is sent — the server only ever receives ciphertext.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

const TARIFF_PATTERN = /^\d+(\.\d{1,2})?$/;

interface PublicKeys {
  technical: { publicKeyPem: string; fingerprint: string };
  financial: { publicKeyPem: string; fingerprint: string };
}

interface TenderView {
  id: number;
  title: string;
  requiredCapacityMw: string;
  requirementsDetail: string | null;
  status: string;
}

interface DocumentStatus {
  fieldId: number;
  envelope: 'technical' | 'financial';
  label: string;
  required: boolean;
  templateUrl: string | null;
  uploaded: boolean;
  originalFilename: string | null;
  downloadUrl: string | null;
}

export default function GeneratorBidSubmissionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tenderRef, setTenderRef] = useState('');
  const [tender, setTender] = useState<TenderView | null>(null);
  const [invitationStatus, setInvitationStatus] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<{ name: string; contactEmail: string; contactPhone: string } | null>(null);
  const [buyerLockedReason, setBuyerLockedReason] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [capacityMw, setCapacityMw] = useState('');
  const [solarMw, setSolarMw] = useState('');
  const [windOtherMw, setWindOtherMw] = useState('');
  const [essMw, setEssMw] = useState('');
  const [essMwh, setEssMwh] = useState('');

  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [interconnectionPoint, setInterconnectionPoint] = useState('');

  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [noDeviations, setNoDeviations] = useState(false);

  const [tariff, setTariff] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: number; receipt: unknown } | null>(null);

  const [documents, setDocuments] = useState<DocumentStatus[] | null>(null);
  const [uploadingFieldId, setUploadingFieldId] = useState<number | null>(null);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function viewTender() {
    setError(null);
    setTender(null);
    setInvitationStatus(null);
    setBuyer(null);
    setBuyerLockedReason(null);
    setDocuments(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setTender(data.tender);
      setInvitationStatus(data.invitationStatus);
      setBuyer(data.buyer);
      setBuyerLockedReason(data.buyerLockedReason);
      if (data.invitationStatus === 'accepted') await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tender');
    }
  }

  async function respond(accept: boolean) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}/invitations/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accept }),
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setInvitationStatus(data.status);
      if (data.status === 'accepted') await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
    }
  }

  async function loadDocuments() {
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}/documents/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document checklist');
    }
  }

  async function uploadDocument(fieldId: number, file: File) {
    setError(null);
    setUploadingFieldId(fieldId);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}/document-fields/${fieldId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFieldId(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!TARIFF_PATTERN.test(tariff.trim())) {
      setError('Tariff must be a single fixed number with at most two decimal places (e.g. 3.45) — no ranges, no formulas.');
      return;
    }
    if (!acceptsTerms || !noDeviations) {
      setError('Both declarations must be accepted before submitting.');
      return;
    }
    const capacity = Number(capacityMw);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError('Contracted capacity must be a whole number of MW greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const keysRes = await fetch(`${API_BASE}/api/vetting-bids/public-keys`);
      const keysData = (await keysRes.json()) as { success: boolean; error?: string } & Partial<PublicKeys>;
      if (!keysData.success || !keysData.technical || !keysData.financial) {
        throw new Error(keysData.error || 'Failed to fetch custodian public keys');
      }

      const technicalContent = JSON.stringify({
        contractedCapacityMw: capacity,
        technologyMix: {
          solarMw: solarMw ? Number(solarMw) : null,
          windOtherMw: windOtherMw ? Number(windOtherMw) : null,
          essMw: essMw ? Number(essMw) : null,
          essMwh: essMwh ? Number(essMwh) : null,
        },
        location: { village, district, state: stateName },
        interconnectionPoint,
        declarations: { acceptsTermsUnconditionally: acceptsTerms, noDeviationsFromFormats: noDeviations },
        contact: { name: contactName, email: contactEmail, phone: contactPhone },
      });
      const financialContent = JSON.stringify({ tariff: Number(tariff) });

      const [technical, financial] = await Promise.all([
        sealPayload(keysData.technical.publicKeyPem, technicalContent),
        sealPayload(keysData.financial.publicKeyPem, financialContent),
      ]);

      const res = await fetch(`${API_BASE}/api/vetting-bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tenderRef, technical, financial }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Submission failed');
      setResult({ id: data.id, receipt: data.receipt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content-page">
      <Seo title="Submit a sealed bid (internal test)" description="Internal generator bid-submission tool." path="/submit-bid" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Submit a sealed bid</h1>
            <p>Technical and financial content are sealed in your browser before submission — WattMatch never sees plaintext until an approved custodian ceremony opens it.</p>
          </div>
        </div>

        <section>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}

            {!token ? (
              <form onSubmit={login}>
                <h2>1. Log in as a generator</h2>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="btn btn-solar">Log in</button>
              </form>
            ) : (
              <div>
                <h2>2. View a tender</h2>
                <input type="text" placeholder="Tender ref (id)" value={tenderRef} onChange={(e) => setTenderRef(e.target.value)} />
                <button type="button" className="btn btn-solar" onClick={viewTender}>
                  View tender
                </button>
                {tender && (
                  <div>
                    <p>
                      <strong>{tender.title}</strong> — requires {tender.requiredCapacityMw} MW — status: {tender.status}
                    </p>
                    {tender.requirementsDetail && <p>{tender.requirementsDetail}</p>}
                    <p>Invitation status: {invitationStatus}</p>
                    {buyer ? (
                      <p>
                        Buyer: <strong>{buyer.name}</strong> — {buyer.contactEmail} — {buyer.contactPhone}
                      </p>
                    ) : (
                      <p style={{ fontStyle: 'italic' }}>
                        Buyer identity locked until RfS fee is paid and a bid is submitted{buyerLockedReason ? ` (${buyerLockedReason})` : ''}.
                      </p>
                    )}
                    {invitationStatus === 'invited' && (
                      <>
                        <button type="button" className="btn btn-solar" onClick={() => respond(true)}>
                          Accept invitation
                        </button>
                        <button type="button" onClick={() => respond(false)}>
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {result && (
              <p style={{ color: '#2F7A3E' }}>
                Submitted as bid #{result.id}. Receipt hashes: <code>{JSON.stringify(result.receipt)}</code>
              </p>
            )}

            {token && invitationStatus === 'accepted' && documents && (
              <div>
                <h2>3. Document checklist</h2>
                <p>Download the blank format where one exists, then upload your filled PDF. Fields marked * are required before you can submit.</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.fieldId} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.4rem 0.5rem 0.4rem 0' }}>
                          {d.label}
                          {d.required ? ' *' : ''} <span style={{ fontSize: '0.8rem', color: '#888' }}>({d.envelope})</span>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {d.templateUrl ? (
                            <a href={d.templateUrl} target="_blank" rel="noreferrer">
                              View format
                            </a>
                          ) : (
                            <span style={{ color: '#999' }}>No format provided</span>
                          )}
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {d.uploaded ? (
                            <span style={{ color: '#2F7A3E' }}>
                              ✓ {d.originalFilename} {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer">(view)</a>}
                            </span>
                          ) : (
                            <span style={{ color: d.required ? '#B53A3A' : '#999' }}>Not uploaded</span>
                          )}
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={uploadingFieldId === d.fieldId}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadDocument(d.fieldId, file);
                              e.target.value = '';
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {token && invitationStatus === 'accepted' && (
              <form onSubmit={handleSubmit}>
                <h2>4. Contact person</h2>
                <input type="text" placeholder="Name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                <input type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                <input type="tel" placeholder="Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />

                <h2>Project — capacity &amp; technology mix</h2>
                <input type="number" min="1" step="1" placeholder="Contracted capacity offered (MW)" value={capacityMw} onChange={(e) => setCapacityMw(e.target.value)} required />
                <input type="number" min="0" step="0.1" placeholder="Solar installed (MW)" value={solarMw} onChange={(e) => setSolarMw(e.target.value)} />
                <input type="number" min="0" step="0.1" placeholder="Wind / other RE installed (MW)" value={windOtherMw} onChange={(e) => setWindOtherMw(e.target.value)} />
                <input type="number" min="0" step="0.1" placeholder="Storage (ESS) — MW" value={essMw} onChange={(e) => setEssMw(e.target.value)} />
                <input type="number" min="0" step="0.1" placeholder="Storage (ESS) — MWh" value={essMwh} onChange={(e) => setEssMwh(e.target.value)} />

                <h2>Project — location &amp; connectivity</h2>
                <input type="text" placeholder="Village / site" value={village} onChange={(e) => setVillage(e.target.value)} required />
                <input type="text" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                <select value={stateName} onChange={(e) => setStateName(e.target.value)} required>
                  <option value="">Select state</option>
                  {indianStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input type="text" placeholder="Interconnection point" value={interconnectionPoint} onChange={(e) => setInterconnectionPoint(e.target.value)} required />

                <h2>Declarations</h2>
                <label style={{ display: 'block' }}>
                  <input type="checkbox" checked={acceptsTerms} onChange={(e) => setAcceptsTerms(e.target.checked)} /> We unconditionally accept the tender's terms and PPA.
                </label>
                <label style={{ display: 'block' }}>
                  <input type="checkbox" checked={noDeviations} onChange={(e) => setNoDeviations(e.target.checked)} /> Our submission has no deviations from the prescribed forms.
                </label>

                <h2>Financial bid</h2>
                <p>Single fixed tariff, ₹/kWh, exactly two decimal places. No ranges, formulas, or conditions.</p>
                <input type="text" inputMode="decimal" placeholder="e.g. 3.45" value={tariff} onChange={(e) => setTariff(e.target.value)} required />

                <button type="submit" className="btn btn-solar" disabled={submitting}>
                  {submitting ? 'Sealing & submitting…' : 'Seal and submit bid'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
