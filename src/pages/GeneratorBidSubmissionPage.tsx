import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo';
import { indianStates } from '../data/content';
import { sealPayload } from '../lib/vettingSeal';
import { useAuth } from '../lib/authContext';
import { usePayment, hasPendingPayment } from '../hooks/usePayment';
import { isValidEmail, isValidPhone } from '../lib/validators';

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

// Stakeholder-demo aid only — never true in a real deployment unless VITE_DEV_MODE is explicitly
// set at build time. Lets a presenter populate every field with valid dummy values and auto-upload
// placeholder documents instead of hand-typing a realistic bid live. Every value it produces still
// goes through the same validation and the same real endpoints as a normal submission — this never
// touches the server's gates (payment/EMD/document checks in vettingBids.ts stay untouched), it
// only saves the presenter from typing.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// A tiny, structurally valid single-page PDF — enough for any "accept application/pdf" input and
// for the server's own storage, without needing a real scanned document on hand during a demo.
function createDummyPdfFile(filename: string): File {
  const pdfBytes =
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
    'trailer<</Root 1 0 R>>';
  return new File([pdfBytes], filename, { type: 'application/pdf' });
}

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
  const [tenderDocument, setTenderDocument] = useState<{ url: string; filename: string | null } | null>(null);
  const [bidProcessingPaid, setBidProcessingPaid] = useState(false);
  // Set when accepting hits the RfS-fee gate (POST /invitations/respond, 402) — an auto-invited
  // generator otherwise had no path on this page to the purchase step at all (see tenders.ts's own
  // comment on this route). A plain error string leaves them stuck; this drives an actual link.
  const [needsRfsPayment, setNeedsRfsPayment] = useState(false);
  const [responding, setResponding] = useState<'accept' | 'decline' | null>(null);
  const payment = usePayment();
  // Set from viewTender below when a previous Bid Processing Fee payment attempt for this tender
  // never reached a terminal state in this browser (tab closed/refreshed mid-verify) — warns before
  // paying again rather than risking a duplicate charge. Cleared implicitly once bidProcessingPaid
  // is true, since the warning is only ever rendered alongside the unpaid state below.
  const [pendingPaymentWarning, setPendingPaymentWarning] = useState(false);

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
  // receipt is null when restored from a page reload (GET /tenders/:id's bidId) rather than a fresh
  // submission in this session — the receipt hashes only ever existed client-side at submission time,
  // there's nowhere to fetch them back from afterward.
  const [result, setResult] = useState<{ id: number; receipt: unknown | null } | null>(null);

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
    setNeedsRfsPayment(false);
    setTender(null);
    setInvitationStatus(null);
    setDocuments(null);
    setTenderDocument(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${ref}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) return setError(data.error);
      setTender(data.tender);
      setInvitationStatus(data.invitationStatus);
      setBidProcessingPaid(!!data.bidProcessingPaid);
      setPendingPaymentWarning(!data.bidProcessingPaid && hasPendingPayment('bid_processing', Number(ref)));
      // Restores the "already submitted" confirmation across a reload — GET /tenders/:id's bidId is
      // the same one-bid-per-generator-per-tender fact vetting-bids.ts's duplicate-submission guard
      // enforces server-side; without this the form would look fillable again after a reload even
      // though a resubmit attempt would just 409.
      if (data.bidId) setResult({ id: data.bidId, receipt: null });
      // Surfaces even for an invitation accepted long before this check existed (or before the fee
      // was ever paid under some earlier gap) — accept-time isn't the only place this can be true,
      // so it's re-derived fresh from the tender itself every time this page loads, same as the
      // server re-checks it fresh on every request rather than trusting a one-time accept-time gate.
      if ((data.invitationStatus === 'invited' || data.invitationStatus === 'accepted') && !data.rfsDocumentPaid) {
        setNeedsRfsPayment(true);
      }
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
    setNeedsRfsPayment(false);
    setResponding(accept ? 'accept' : 'decline');
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderRef}/invitations/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accept }),
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 402) setNeedsRfsPayment(true);
        return setError(data.error);
      }
      setInvitationStatus(data.status);
      if (data.status === 'accepted') {
        await loadDocuments();
        await loadEmdSubmission();
        loadDraft();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
    } finally {
      setResponding(null);
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

  async function payBidProcessingFee() {
    const outcome = await payment.startPayment({
      purpose: 'bid_processing',
      tenderId: Number(tenderRef),
      token: token ?? '',
      prefill: { name: contactName, email: contactEmail, contact: contactPhone },
    });
    if (outcome.outcome === 'success') {
      setBidProcessingPaid(true);
    } else if (outcome.outcome === 'already_paid') {
      // The order-creation call 409'd because an earlier attempt already paid this fee (most likely
      // a stale page after paying in another tab) — re-derive full status from the server rather
      // than just flipping the local flag, since other tender state may be stale too.
      await viewTender();
    }
  }

  // Dev-mode only (see DEV_MODE above) — populates every field with valid dummy values and, for
  // the document checklist, performs real uploads through the same uploadDocument() call a
  // presenter would trigger by hand, so the resulting records are indistinguishable from a real
  // submission. The Bid Processing Fee and EMD document still require an explicit click (Razorpay
  // test-card payment / "Submit EMD") — this only removes the typing, not the walkthrough.
  async function fillDemoData() {
    setContactName('Demo Contact');
    setContactEmail('demo.generator@example.com');
    setContactPhone('9876543210');
    setCapacityMw('50');
    setSolarMw('50');
    setWindOtherMw('0');
    setEssMw('0');
    setEssMwh('0');
    setVillage('Demo Village');
    setDistrict('Demo District');
    setStateName((prev) => prev || indianStates[0] || '');
    setInterconnectionPoint('132kV Demo Substation');
    setAcceptsTerms(true);
    setNoDeviations(true);
    setTariff('3.45');

    setEmdBankName('Demo Bank Ltd');
    setEmdGuaranteeNumber('BG-DEMO-0001');
    setEmdAmountRupees('100000');
    setEmdValidUpto(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setEmdReturnRecipientName('Demo Contact');
    setEmdReturnAddressLine('123 Demo Street');
    setEmdReturnCity('Demo City');
    setEmdReturnState((prev) => prev || indianStates[0] || '');
    setEmdReturnPincode('110001');
    setEmdReturnPhone('9876543210');
    setEmdDocument(createDummyPdfFile('emd-bank-guarantee-demo.pdf'));

    if (documents) {
      for (const d of documents) {
        if (d.required && !d.uploaded) {
          await uploadDocument(d.fieldId, createDummyPdfFile(`${d.label.replace(/\s+/g, '-').toLowerCase()}-demo.pdf`));
        }
      }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Mirrors the server's own gates (vetting-bids' missingFees + EMD check) — catches them before
    // the generator spends time filling out and sealing the whole form, not just after a 402 comes
    // back once it's already sealed.
    if (needsRfsPayment) {
      setError('The RfS Document fee must be paid before submitting a bid.');
      return;
    }
    const missing: string[] = [];
    if (!bidProcessingPaid) missing.push('Bid Processing Fee');
    if (!emdSubmission) missing.push('EMD (Bank Guarantee)');
    if (missing.length > 0) {
      setError(`The following must be completed before submitting a bid: ${missing.join(', ')}`);
      return;
    }
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
    // Contact details are sealed client-side below — the server can never see or validate them, so
    // a malformed value here would become a permanent, silent defect inside the sealed envelope.
    if (!isValidEmail(contactEmail)) {
      setError('Enter a valid contact email address — this cannot be corrected after sealing.');
      return;
    }
    if (!isValidPhone(contactPhone)) {
      setError('Enter a valid contact phone number — this cannot be corrected after sealing.');
      return;
    }

    setSubmitting(true);
    try {
      const keysRes = await fetch(`${API_BASE}/api/vetting-bids/public-keys`, { headers: { Authorization: `Bearer ${token}` } });
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
            <span className="eyebrow">Submit a bid</span>
            <h1>Submit a sealed bid</h1>
            <p>Technical and financial content are sealed in your browser before submission — WattMatch never sees plaintext until an approved custodian ceremony opens it.</p>
          </div>
        </div>

        <section>
          <div className="wrap bid-submission-wrap">
            {error && <p className="enroll-message error">{error}</p>}

            {DEV_MODE && token && invitationStatus === 'accepted' && !needsRfsPayment && !result && (
              <div className="dev-mode-banner">
                <span>
                  <strong>Dev mode</strong> — demo use only, populates this form with valid dummy data and
                  real placeholder document uploads.
                </span>
                <button type="button" className="btn btn-outline" onClick={() => void fillDemoData()}>
                  Fill demo data
                </button>
              </div>
            )}

            <div className="enroll-card">
              <h2>1. Tender</h2>
              {!tender && !error && (
                <p>
                  No tender selected — pick one from your <Link to="/generator-dashboard">dashboard</Link>.
                </p>
              )}
              {tender && (
                <>
                  <table className="reg-table">
                    <tbody>
                      <tr><th>Tender</th><td>{tender.title}</td></tr>
                      <tr><th>Required capacity</th><td>{tender.requiredCapacityMw} MW</td></tr>
                      <tr><th>Status</th><td>{tender.status}</td></tr>
                      <tr><th>Invitation status</th><td><span className={`status-pill ${invitationStatus}`}>{invitationStatus}</span></td></tr>
                    </tbody>
                  </table>
                  {tender.requirementsDetail && <p>{tender.requirementsDetail}</p>}
                  {tenderDocument && (
                    <a href={tenderDocument.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
                      Download tender document
                    </a>
                  )}
                  {needsRfsPayment && (
                    <p style={{ fontStyle: 'italic' }}>
                      Purchase the bid document for detailed tender information and to be able to fill out the enrollment form.
                    </p>
                  )}
                  {invitationStatus === 'invited' && needsRfsPayment && (
                    <>
                      <p>Purchase this tender's bid document before accepting, then come back to accept.</p>
                      <Link to={`/rfs-document-purchase?tenderId=${tenderRef}`} className="btn btn-solar" style={{ alignSelf: 'flex-start' }}>
                        Purchase bid document
                      </Link>
                    </>
                  )}
                  {invitationStatus === 'invited' && !needsRfsPayment && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className="btn btn-solar" onClick={() => respond(true)} disabled={responding !== null}>
                        {responding === 'accept' ? 'Accepting…' : 'Accept invitation'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => respond(false)} disabled={responding !== null}>
                        {responding === 'decline' ? 'Declining…' : 'Decline'}
                      </button>
                    </div>
                  )}
                  {invitationStatus === 'accepted' && needsRfsPayment && (
                    <>
                      <p>The rest of this form opens once the bid document fee is paid.</p>
                      <Link to={`/rfs-document-purchase?tenderId=${tenderRef}`} className="btn btn-solar" style={{ alignSelf: 'flex-start' }}>
                        Purchase bid document
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {result && (
              <div className="enroll-card">
                <h2>Bid submitted</h2>
                <p className="enroll-message success">
                  Your sealed bid #{result.id} has been submitted for this tender. It stays sealed —
                  unreadable even to WattMatch — until the scheduled custodian ceremony opens it.
                </p>
                {result.receipt != null && (
                  <p className="sub sub-tight">
                    Receipt hashes (proof of exactly what was sealed, for your own records):{' '}
                    <code>{JSON.stringify(result.receipt)}</code>
                  </p>
                )}
                <Link to="/generator-dashboard" className="btn btn-solar" style={{ alignSelf: 'flex-start' }}>
                  Back to dashboard
                </Link>
              </div>
            )}

            {token && invitationStatus === 'accepted' && !needsRfsPayment && !result && (
              <div className="enroll-card">
                <h2>2. Bid Processing Fee</h2>
                {bidProcessingPaid ? (
                  <p className="enroll-message success">✓ Bid Processing Fee paid.</p>
                ) : (
                  <>
                    <p className="enroll-message error">Required before you can submit a bid.</p>
                    {pendingPaymentWarning && (
                      <p className="enroll-message error">
                        A previous payment attempt for this fee may still be processing — wait a
                        few minutes, then refresh status below before paying again to avoid a
                        duplicate charge.{' '}
                        <button type="button" className="btn-link-reset" style={{ textDecoration: 'underline' }} onClick={() => void viewTender()}>
                          Refresh status
                        </button>
                      </p>
                    )}
                    {payment.status === 'cancelled' && <p className="enroll-message">Payment cancelled — you can try again below.</p>}
                    {payment.status === 'verify_unconfirmed' && <p className="enroll-message">{payment.error}</p>}
                    {payment.status === 'failed' && payment.error && (
                      <p className="enroll-message error">
                        {payment.errorKind === 'card'
                          ? payment.error
                          : `${payment.error} — this looks like a temporary issue on our side; nothing should have been charged for this attempt.`}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-solar"
                      disabled={payment.isProcessing}
                      onClick={() => void payBidProcessingFee()}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {payment.isProcessing ? `${payment.status.replace('_', ' ')}…` : 'Pay Bid Processing Fee'}
                    </button>
                  </>
                )}
              </div>
            )}

            {token && invitationStatus === 'accepted' && !needsRfsPayment && !result && documents && (
              <div className="enroll-card">
                <h2>3. Document checklist</h2>
                <p className="sub">Download the blank format where one exists, then upload your filled PDF. Fields marked * are required before you can submit.</p>
                <ul className="doc-status-list bid-doc-list">
                  {documents.map((d) => (
                    <li key={d.fieldId}>
                      <div className="bid-doc-row-top">
                        <span>
                          {d.label}
                          {d.required ? ' *' : ''} <span className="doc-envelope-tag">({d.envelope})</span>
                        </span>
                        {d.uploaded ? (
                          <span className="doc-uploaded">
                            ✓ {d.originalFilename} {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer">(view)</a>}
                          </span>
                        ) : (
                          <span className="doc-missing">{d.required ? 'Required — not uploaded' : 'Not uploaded'}</span>
                        )}
                      </div>
                      <div className="bid-doc-row-bottom">
                        {d.templateUrl ? (
                          <a href={d.templateUrl} target="_blank" rel="noreferrer" className="doc-format-link">
                            View format
                          </a>
                        ) : (
                          <span className="doc-missing">No format provided</span>
                        )}
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
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {token && invitationStatus === 'accepted' && !needsRfsPayment && !result && (
              <div className="enroll-card">
                <h2>4. Submit your EMD (Bank Guarantee)</h2>
                <p className="sub">
                  EMD is a physical/scanned Bank Guarantee, not an online payment. Upload it here along
                  with the address WattMatch should return it to once the tender is settled.
                </p>
                {emdSubmission ? (
                  <p>
                    On file: {emdSubmission.bankName} / {emdSubmission.guaranteeNumber} — ₹
                    {(emdSubmission.amountPaise / 100).toFixed(2)} — valid till {emdSubmission.validUpto} —{' '}
                    <span className={`status-pill ${emdSubmission.status}`}>{emdSubmission.status}</span>
                  </p>
                ) : (
                  <p className="enroll-message error">Not yet submitted — required before you can submit a bid.</p>
                )}
                {(!emdSubmission || emdSubmission.status === 'submitted') && (
                  <form onSubmit={submitEmd}>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="emdBankName">Issuing bank name</label>
                        <input id="emdBankName" type="text" value={emdBankName} onChange={(e) => setEmdBankName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="emdGuaranteeNumber">Guarantee number</label>
                        <input id="emdGuaranteeNumber" type="text" value={emdGuaranteeNumber} onChange={(e) => setEmdGuaranteeNumber(e.target.value)} required />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="emdAmount">Amount (₹)</label>
                        <input id="emdAmount" type="number" min="0" step="0.01" value={emdAmountRupees} onChange={(e) => setEmdAmountRupees(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="emdValidUpto">Valid upto</label>
                        <input id="emdValidUpto" type="date" value={emdValidUpto} onChange={(e) => setEmdValidUpto(e.target.value)} required />
                      </div>
                    </div>

                    <h3>Return address (where we send it back)</h3>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="emdRecipient">Recipient name</label>
                        <input id="emdRecipient" type="text" value={emdReturnRecipientName} onChange={(e) => setEmdReturnRecipientName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="emdAddress">Address line</label>
                        <input id="emdAddress" type="text" value={emdReturnAddressLine} onChange={(e) => setEmdReturnAddressLine(e.target.value)} required />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="emdCity">City</label>
                        <input id="emdCity" type="text" value={emdReturnCity} onChange={(e) => setEmdReturnCity(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="emdState">State</label>
                        <select id="emdState" value={emdReturnState} onChange={(e) => setEmdReturnState(e.target.value)} required>
                          <option value="">Select state</option>
                          {indianStates.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="emdPincode">Pincode</label>
                        <input id="emdPincode" type="text" value={emdReturnPincode} onChange={(e) => setEmdReturnPincode(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="emdPhone">Phone</label>
                        <input id="emdPhone" type="tel" value={emdReturnPhone} onChange={(e) => setEmdReturnPhone(e.target.value)} required />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="emdDoc">Scanned Bank Guarantee (PDF)</label>
                      <input id="emdDoc" type="file" accept="application/pdf" onChange={(e) => setEmdDocument(e.target.files?.[0] ?? null)} />
                    </div>
                    <button type="submit" className="btn btn-solar" disabled={submittingEmd}>
                      {submittingEmd ? 'Submitting…' : emdSubmission ? 'Replace EMD submission' : 'Submit EMD'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {token && invitationStatus === 'accepted' && !needsRfsPayment && !result && (
              <div className="enroll-card">
                <h2>5. Bid details</h2>
                {draftRestored && (
                  <p className="enroll-message success">
                    Restored a saved draft from this browser.{' '}
                    <button type="button" className="btn-link-reset" style={{ textDecoration: 'underline' }} onClick={discardDraft}>
                      Discard draft &amp; start over
                    </button>
                  </p>
                )}
                <p className="sub">
                  Your progress below is saved automatically in this browser only — never sent to
                  our servers until you submit — so it won't follow you to a different device.
                </p>

                <form onSubmit={handleSubmit}>
                  <h3>Contact person</h3>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="bidContactName">Name</label>
                      <input id="bidContactName" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label htmlFor="bidContactEmail">Email</label>
                      <input id="bidContactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="bidContactPhone">Phone</label>
                    <input id="bidContactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                  </div>

                  <h3>Project — capacity &amp; technology mix</h3>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="bidCapacity">Contracted capacity offered (MW)</label>
                      <input id="bidCapacity" type="number" min="1" step="1" value={capacityMw} onChange={(e) => setCapacityMw(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label htmlFor="bidSolar">Solar installed (MW)</label>
                      <input id="bidSolar" type="number" min="0" step="0.1" value={solarMw} onChange={(e) => setSolarMw(e.target.value)} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="bidWind">Wind / other RE installed (MW)</label>
                      <input id="bidWind" type="number" min="0" step="0.1" value={windOtherMw} onChange={(e) => setWindOtherMw(e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="bidEssMw">Storage (ESS) — MW</label>
                      <input id="bidEssMw" type="number" min="0" step="0.1" value={essMw} onChange={(e) => setEssMw(e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="bidEssMwh">Storage (ESS) — MWh</label>
                    <input id="bidEssMwh" type="number" min="0" step="0.1" value={essMwh} onChange={(e) => setEssMwh(e.target.value)} />
                  </div>

                  <h3>Project — location &amp; connectivity</h3>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="bidVillage">Village / site</label>
                      <input id="bidVillage" type="text" value={village} onChange={(e) => setVillage(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label htmlFor="bidDistrict">District</label>
                      <input id="bidDistrict" type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="bidState">State</label>
                      <select id="bidState" value={stateName} onChange={(e) => setStateName(e.target.value)} required>
                        <option value="">Select state</option>
                        {indianStates.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="bidInterconnection">Interconnection point</label>
                      <input id="bidInterconnection" type="text" value={interconnectionPoint} onChange={(e) => setInterconnectionPoint(e.target.value)} required />
                    </div>
                  </div>

                  <h3>Declarations</h3>
                  <label className="consent-field">
                    <input type="checkbox" checked={acceptsTerms} onChange={(e) => setAcceptsTerms(e.target.checked)} />
                    <span>We unconditionally accept the tender's terms and PPA.</span>
                  </label>
                  <label className="consent-field">
                    <input type="checkbox" checked={noDeviations} onChange={(e) => setNoDeviations(e.target.checked)} />
                    <span>Our submission has no deviations from the prescribed forms.</span>
                  </label>

                  <h3>Financial bid</h3>
                  <p className="sub">Single fixed tariff, ₹/kWh, exactly two decimal places. No ranges, formulas, or conditions.</p>
                  <div className="field">
                    <label htmlFor="bidTariff">Tariff (₹/kWh)</label>
                    <input id="bidTariff" type="text" inputMode="decimal" placeholder="e.g. 3.45" value={tariff} onChange={(e) => setTariff(e.target.value)} required />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-solar"
                    disabled={submitting || needsRfsPayment || !bidProcessingPaid || !emdSubmission}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {submitting
                      ? 'Sealing & submitting…'
                      : needsRfsPayment
                        ? 'Pay the RfS Document fee first'
                        : !bidProcessingPaid
                          ? 'Pay the Bid Processing Fee first'
                          : !emdSubmission
                            ? 'Submit your EMD first'
                            : 'Seal and submit bid'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
