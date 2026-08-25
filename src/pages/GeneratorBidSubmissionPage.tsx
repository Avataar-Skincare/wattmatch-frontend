import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { indianStates } from '../data/content';
import { sealPayload } from '../lib/vettingSeal';
import { useAuth } from '../lib/authContext';

// Internal PoC test tool, same bar as /admin-vetting and /auction-live — unstyled, functional, not
// linked from site nav. Field set is the WattMatch-adapted subset of SECI RfS Format 7.1 (technical
// covering letter) and Format 7.11 (financial bid), narrowed per §3.7.A/B/E of
// WATTMATCH_TENDER_SPEC.md: consortium/paper-instrument fields dropped, capacity/tech-mix/location/
// declarations kept. Partial-award acceptance is deliberately left out of the declarations set —
// whether WattMatch supports multi-generator/partial awards at all is still an open product
// question, so this form doesn't silently assume an answer either way.
//
// Reached via the shared DashboardShell (routes.tsx), which already gates this to a logged-in
// generator — no login form of its own any more. Submission still requires an accepted tender
// invitation (see tenders.ts / vettingBids.ts) — there is no free-text applicant alias any more,
// identity is always the logged in generator org. Both envelopes are sealed with the Web Crypto
// API in this component, before anything is sent — the server only ever receives ciphertext.
//
// Draft-saving is deliberately browser-local (localStorage), never the server: the ENTIRE
// technicalContent payload below — capacity, tech mix, location, contact info, everything — gets
// sealed client-side specifically so nobody, including WattMatch staff, can read it before the
// ceremony. Saving an in-progress draft to the server in plaintext would quietly defeat that
// guarantee. The trade-off is real and worth being upfront about: a draft doesn't follow the
// generator to a different browser/device, only this one.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

const TARIFF_PATTERN = /^\d+(\.\d{1,2})?$/;

interface BidDraft {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  capacityMw: string;
  solarMw: string;
  windOtherMw: string;
  essMw: string;
  essMwh: string;
  village: string;
  district: string;
  stateName: string;
  interconnectionPoint: string;
  acceptsTerms: boolean;
  noDeviations: boolean;
  tariff: string;
  savedAt: string;
}

function draftStorageKey(tenderRef: string, accountId: number): string {
  return `wattmatch:bid-draft:${tenderRef}:${accountId}`;
}

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

interface EmdSubmissionView {
  bankName: string;
  guaranteeNumber: string;
  amountPaise: number;
  validUpto: string;
  status: 'submitted' | 'released' | 'invoked';
  documentOriginalFilename: string | null;
}

export default function GeneratorBidSubmissionPage() {
  const { auth } = useAuth();
  const token = auth?.token;
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const [tenderRef, setTenderRef] = useState('');
  const [tender, setTender] = useState<TenderView | null>(null);
  const [invitationStatus, setInvitationStatus] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<{ name: string; contactEmail: string; contactPhone: string } | null>(null);
  const [buyerLockedReason, setBuyerLockedReason] = useState<string | null>(null);
  const [tenderDocument, setTenderDocument] = useState<{ url: string; filename: string | null } | null>(null);

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

  const [emdSubmission, setEmdSubmission] = useState<EmdSubmissionView | null>(null);
  const [emdBankName, setEmdBankName] = useState('');
  const [emdGuaranteeNumber, setEmdGuaranteeNumber] = useState('');
  const [emdAmountRupees, setEmdAmountRupees] = useState('');
  const [emdValidUpto, setEmdValidUpto] = useState('');
  const [emdReturnRecipientName, setEmdReturnRecipientName] = useState('');
  const [emdReturnAddressLine, setEmdReturnAddressLine] = useState('');
  const [emdReturnCity, setEmdReturnCity] = useState('');
  const [emdReturnState, setEmdReturnState] = useState('');
  const [emdReturnPincode, setEmdReturnPincode] = useState('');
  const [emdReturnPhone, setEmdReturnPhone] = useState('');
  const [emdDocument, setEmdDocument] = useState<File | null>(null);
  const [submittingEmd, setSubmittingEmd] = useState(false);

  const [draftRestored, setDraftRestored] = useState(false);

  // Best-effort only, wrapped in try/catch throughout — private browsing, disabled storage, or a
  // full quota must never break the actual bid form, only silently skip the convenience.
  function loadDraft(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    try {
      const raw = localStorage.getItem(draftStorageKey(ref, auth?.organizationId ?? 0));
      if (!raw) return;
      const draft = JSON.parse(raw) as BidDraft;
      setContactName(draft.contactName);
      setContactEmail(draft.contactEmail);
      setContactPhone(draft.contactPhone);
      setCapacityMw(draft.capacityMw);
      setSolarMw(draft.solarMw);
      setWindOtherMw(draft.windOtherMw);
      setEssMw(draft.essMw);
      setEssMwh(draft.essMwh);
      setVillage(draft.village);
      setDistrict(draft.district);
      setStateName(draft.stateName);
      setInterconnectionPoint(draft.interconnectionPoint);
      setAcceptsTerms(draft.acceptsTerms);
      setNoDeviations(draft.noDeviations);
      setTariff(draft.tariff);
      setDraftRestored(true);
    } catch {
      // Storage unavailable or corrupted draft — nothing to restore, form just starts blank.
    }
  }

  function discardDraft() {
    try {
      localStorage.removeItem(draftStorageKey(tenderRef, auth?.organizationId ?? 0));
    } catch {
      // best-effort
    }
    setDraftRestored(false);
  }

  // Autosaves on every relevant field change once the bid form is actually visible — cheap enough
  // (a single small JSON blob) that no debounce is needed at this scale.
  useEffect(() => {
    if (invitationStatus !== 'accepted' || !tenderRef) return;
    try {
      const draft: BidDraft = {
        contactName, contactEmail, contactPhone,
        capacityMw, solarMw, windOtherMw, essMw, essMwh,
        village, district, stateName, interconnectionPoint,
        acceptsTerms, noDeviations, tariff,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey(tenderRef, auth?.organizationId ?? 0), JSON.stringify(draft));
    } catch {
      // best-effort
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    invitationStatus, tenderRef,
    contactName, contactEmail, contactPhone,
    capacityMw, solarMw, windOtherMw, essMw, essMwh,
    village, district, stateName, interconnectionPoint,
    acceptsTerms, noDeviations, tariff,
  ]);

  async function viewTender(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    setError(null);
    setTender(null);
    setInvitationStatus(null);
    setBuyer(null);
    setBuyerLockedReason(null);
    setDocuments(null);
    setTenderDocument(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${ref}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setTender(data.tender);
      setInvitationStatus(data.invitationStatus);
      setBuyer(data.buyer);
      setBuyerLockedReason(data.buyerLockedReason);
      // Not gated on invitation status — this is the "saved to your profile" access point for
      // whichever tender document you already paid for, independent of whether you've accepted an
      // invitation yet.
      void loadTenderDocument(ref);
      if (data.invitationStatus === 'accepted') {
        await loadDocuments(ref);
        await loadEmdSubmission(ref);
        loadDraft(ref);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tender');
    }
  }

  // A 402/404 here just means "not paid yet" or "no document uploaded" — neither is an error worth
  // surfacing, so this fails silently and the download link simply doesn't appear.
  async function loadTenderDocument(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${ref}/tender-document`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTenderDocument({ url: data.url, filename: data.filename });
    } catch {
      // best-effort
    }
  }

  // Arriving from Enroll on TenderDetailsPage passes ?tenderId= — load it straight away instead of
  // leaving the generator to retype it into the manual "Tender ref" box below.
  useEffect(() => {
    const idParam = searchParams.get('tenderId');
    if (idParam && token) {
      setTenderRef(idParam);
      void viewTender(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      if (data.status === 'accepted') {
        await loadDocuments();
        await loadEmdSubmission();
        loadDraft();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
    }
  }

  async function loadDocuments(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${ref}/documents/mine`, { headers: { Authorization: `Bearer ${token}` } });
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

  async function loadEmdSubmission(refOverride?: string) {
    const ref = refOverride ?? tenderRef;
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${ref}/emd-submission/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setEmdSubmission(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EMD status');
    }
  }

  async function submitEmd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!emdDocument) {
      setError('A scanned PDF of the Bank Guarantee is required');
      return;
    }
    setSubmittingEmd(true);
    try {
      const form = new FormData();
      form.append('bankName', emdBankName);
      form.append('guaranteeNumber', emdGuaranteeNumber);
      form.append('amountPaise', String(Math.round(Number(emdAmountRupees) * 100)));
      form.append('validUpto', emdValidUpto);
      form.append('returnRecipientName', emdReturnRecipientName);
      form.append('returnAddressLine', emdReturnAddressLine);
      form.append('returnCity', emdReturnCity);
      form.append('returnState', emdReturnState);
      form.append('returnPincode', emdReturnPincode);
      form.append('returnPhone', emdReturnPhone);
      form.append('document', emdDocument);

      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}/emd-submission`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      await loadEmdSubmission();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit EMD');
    } finally {
      setSubmittingEmd(false);
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
      discardDraft(); // sealed and sent — no reason to keep a local plaintext copy around any more
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Seo title="Submit a sealed bid (internal test)" description="Internal generator bid-submission tool." path="/submit-bid" />
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

            <div>
              <h2>1. View a tender</h2>
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
                  {tenderDocument && (
                    <p>
                      <a href={tenderDocument.url} className="btn btn-outline">
                        Download tender document
                      </a>
                    </p>
                  )}
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

            {result && (
              <p style={{ color: '#2F7A3E' }}>
                Submitted as bid #{result.id}. Receipt hashes: <code>{JSON.stringify(result.receipt)}</code>
              </p>
            )}

            {token && invitationStatus === 'accepted' && documents && (
              <div>
                <h2>2. Document checklist</h2>
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
              <div>
                <h2>2b. Submit your EMD (Bank Guarantee)</h2>
                <p>
                  EMD is a physical/scanned Bank Guarantee, not an online payment. Upload it here along
                  with the address WattMatch should return it to once the tender is settled.
                </p>
                {emdSubmission ? (
                  <p>
                    On file: {emdSubmission.bankName} / {emdSubmission.guaranteeNumber} — ₹
                    {(emdSubmission.amountPaise / 100).toFixed(2)} — valid till {emdSubmission.validUpto} —{' '}
                    <strong>{emdSubmission.status}</strong>
                  </p>
                ) : (
                  <p style={{ color: '#B53A3A' }}>Not yet submitted — required before you can submit a bid.</p>
                )}
                {(!emdSubmission || emdSubmission.status === 'submitted') && (
                  <form onSubmit={submitEmd}>
                    <input type="text" placeholder="Issuing bank name" value={emdBankName} onChange={(e) => setEmdBankName(e.target.value)} required />
                    <input type="text" placeholder="Guarantee number" value={emdGuaranteeNumber} onChange={(e) => setEmdGuaranteeNumber(e.target.value)} required />
                    <input type="number" min="0" step="0.01" placeholder="Amount (₹)" value={emdAmountRupees} onChange={(e) => setEmdAmountRupees(e.target.value)} required />
                    <input type="date" placeholder="Valid upto" value={emdValidUpto} onChange={(e) => setEmdValidUpto(e.target.value)} required />
                    <h3>Return address (where we send it back)</h3>
                    <input type="text" placeholder="Recipient name" value={emdReturnRecipientName} onChange={(e) => setEmdReturnRecipientName(e.target.value)} required />
                    <input type="text" placeholder="Address line" value={emdReturnAddressLine} onChange={(e) => setEmdReturnAddressLine(e.target.value)} required />
                    <input type="text" placeholder="City" value={emdReturnCity} onChange={(e) => setEmdReturnCity(e.target.value)} required />
                    <select value={emdReturnState} onChange={(e) => setEmdReturnState(e.target.value)} required>
                      <option value="">Select state</option>
                      {indianStates.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input type="text" placeholder="Pincode" value={emdReturnPincode} onChange={(e) => setEmdReturnPincode(e.target.value)} required />
                    <input type="tel" placeholder="Phone" value={emdReturnPhone} onChange={(e) => setEmdReturnPhone(e.target.value)} required />
                    <input type="file" accept="application/pdf" onChange={(e) => setEmdDocument(e.target.files?.[0] ?? null)} />
                    <button type="submit" className="btn btn-solar" disabled={submittingEmd}>
                      {submittingEmd ? 'Submitting…' : emdSubmission ? 'Replace EMD submission' : 'Submit EMD'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {token && invitationStatus === 'accepted' && (
              <>
                {draftRestored && (
                  <p style={{ fontSize: '0.85rem' }}>
                    Restored a saved draft from this browser.{' '}
                    <button type="button" onClick={discardDraft}>
                      Discard draft &amp; start over
                    </button>
                  </p>
                )}
                <p style={{ fontSize: '0.8rem', color: '#888' }}>
                  Your progress below is saved automatically in this browser only — never sent to
                  our servers until you submit — so it won't follow you to a different device.
                </p>
              </>
            )}

            {token && invitationStatus === 'accepted' && (
              <form onSubmit={handleSubmit}>
                <h2>3. Contact person</h2>
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
    </>
  );
}
