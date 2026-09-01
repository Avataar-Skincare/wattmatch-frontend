import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import CheckIcon from '../components/icons/CheckIcon';
import { usePayment, hasPendingPayment } from '../hooks/usePayment';
import { useAuth } from '../lib/authContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Stage 3's RfS Document purchase form (TENDER_WORKFLOW_STAKEHOLDER_PLAN.md) — deliberately
// account-less. Every field here is now a real structured field on the Payment row (see
// routes/payments.ts's rfsDocumentOrderBodySchema), not free-form notes. The consent checkbox
// below is Red Flag #1's fix — DPDP Act requires telling people why their data is collected and
// getting explicit opt-in before submitting, not just posting a privacy policy somewhere on the
// site. Accepts a `?tenderId=` query param so a link from the public Tenders list can prefill it.
export default function RfsDocumentPurchasePage() {
  const [searchParams] = useSearchParams();
  // Arriving with a tenderId already in the URL means the link came from a specific tender (the
  // public Tenders list, TenderDetailsPage's "buy" link) — that identity is fixed by how they got
  // here, so the field is locked rather than left editable to something else by mistake. Arriving
  // with no tenderId (this page's own bare URL) is the only case where typing one in makes sense.
  const tenderIdFromLink = searchParams.get('tenderId');
  const [tenderId, setTenderId] = useState(tenderIdFromLink ?? '');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isGenerator, setIsGenerator] = useState<'yes' | 'no'>('no');
  const [consentGiven, setConsentGiven] = useState(false);

  const { auth } = useAuth();
  const token = auth?.token;
  const isLoggedInGenerator = auth?.type === 'generator';
  const [enrolled, setEnrolled] = useState(false);

  const { status, error, errorKind, isProcessing, startPayment, reset } = usePayment();
  // null = not attempted yet, true = the document actually opened, false = the fetch failed or the
  // document isn't uploaded yet — tracked explicitly so the post-payment screen never claims the
  // document opened when it didn't (see downloadTenderDocument below).
  const [documentAvailable, setDocumentAvailable] = useState<boolean | null>(null);
  // Best-effort warning if a previous purchase attempt for this same tender never reached a
  // terminal state in this browser (tab closed/refreshed between paying and verify resolving) —
  // this flow has no account to check a fresh "already paid" status against, so this is the only
  // local signal available. See usePayment.ts's hasPendingPayment.
  const [pendingPaymentWarning] = useState(
    () => !!tenderIdFromLink && hasPendingPayment('rfs_document', Number(tenderIdFromLink))
  );

  // Prefills from the logged-in generator's own account (GET /organizations/me) rather than leaving
  // a blank form for someone who's already told this platform who they are — email/mobile/company
  // are the fields Organization actually stores; name/designation have no equivalent on that model,
  // so those stay blank for manual entry. isGenerator is set outright, not just prefilled, since it's
  // a known fact here, not a guess.
  useEffect(() => {
    if (!isLoggedInGenerator || !token) return;
    fetch(`${API_BASE}/api/organizations/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setCompany(data.organization.name ?? '');
        setEmail(data.organization.contactEmail ?? '');
        setMobile(data.organization.contactPhone ?? '');
        setIsGenerator('yes');
      })
      .catch(() => {
        // best-effort — the form just stays blank/manual on failure
      });
  }, [isLoggedInGenerator, token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    if (!consentGiven) return;
    const outcome = await startPayment({
      purpose: 'rfs_document',
      tenderId: Number(tenderId),
      payerName: name,
      payerEmail: email,
      company,
      designation,
      mobile,
      isGenerator: isGenerator === 'yes',
      consentGiven: true,
      prefill: { name, email, contact: mobile },
    });
    // 'already_paid' means an earlier attempt already completed this exact purchase (a 409 from
    // order-creation, most likely a stale page after a previous successful purchase) — treated the
    // same as a fresh success rather than an error, since the fee genuinely has been paid.
    if (outcome.outcome === 'success' || outcome.outcome === 'already_paid') {
      await downloadTenderDocument();
      // A purchase alone creates no TenderInvitation row — without this, "continue to the enrollment
      // form" would be a dead end (GET /tenders/:id 403s with no invitation at all). Self-enroll is
      // the same action TenderDetailsPage's logged-in path already runs; account-less purchasers have
      // no account to self-enroll as, so this only fires for someone actually logged in as a
      // generator right now.
      if (isLoggedInGenerator && token) {
        try {
          const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/self-enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) setEnrolled(true);
        } catch {
          // best-effort — the payment itself already succeeded; enrollment can still be completed
          // later from the generator dashboard's "Continue enrollment" link.
        }
      }
    }
  }

  // Fires the moment payment verifies — the tender document isn't tied to an account yet at this
  // point (this whole flow is deliberately account-less), so it's fetched by the email just paid
  // with, same as hasRfsDocumentPaid does everywhere else. Once they enroll, it stays fetchable
  // from their generator dashboard too (GeneratorBidSubmissionPage) — this isn't the only copy.
  // Sets documentAvailable explicitly rather than silently no-opping on failure: a 404 here almost
  // always means the tender document hasn't been uploaded by an admin yet, which the payment flow
  // can't detect ahead of time or retry automatically — the post-payment screen needs to say so
  // honestly instead of implying the document always opens immediately.
  async function downloadTenderDocument() {
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/tender-document?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        window.open(data.url, '_blank');
        setDocumentAvailable(true);
      } else {
        setDocumentAvailable(false);
      }
    } catch {
      setDocumentAvailable(false);
    }
  }

  return (
    <div className="register-page">
      <Seo title="Buy tender document" description="Buy a tender's RfS Document to unlock full details." path="/rfs-document-purchase" />
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Stage 3</span>
            <h1>Buy the tender document</h1>
            <p>No account required. Pay the Bid Purchase Fee to unlock the full tender detail.</p>
          </div>

          <Reveal className="form-card register-form-card">
            {status === 'success' || status === 'already_paid' ? (
              <div className="form-success show">
                <div className="check">
                  <CheckIcon size={20} />
                </div>
                <h3>{status === 'already_paid' ? "You've already purchased this document" : 'Payment successful'}</h3>
                {documentAvailable === true && (
                  <p>
                    Your tender document should have opened in a new tab. You can also come back for it
                    any time by enrolling and visiting your generator dashboard.
                  </p>
                )}
                {documentAvailable === false && (
                  <>
                    <p>
                      Your payment is confirmed, but the tender document isn't available to download yet
                      — the tender's admin may not have uploaded it. Check back shortly, or try the
                      button below.
                    </p>
                    <button type="button" className="btn btn-outline" style={{ marginTop: '8px' }} onClick={() => void downloadTenderDocument()}>
                      Try downloading again
                    </button>
                  </>
                )}
                {documentAvailable === null && <p>Fetching your tender document…</p>}
                {enrolled && (
                  <Link to={`/submit-bid?tenderId=${tenderId}`} className="btn btn-solar" style={{ marginTop: '12px' }}>
                    Continue to enrollment form
                  </Link>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3>Purchase details</h3>
                <p className="sub">Fill in your details below to unlock the full tender document.</p>

                {status === 'cancelled' && <p className="form-note">Payment cancelled — you can try again below.</p>}
                {status === 'verify_unconfirmed' && <p className="form-note">{error}</p>}
                {status === 'failed' && error && (
                  <p className="form-error">
                    {errorKind === 'card'
                      ? error
                      : `${error} — this looks like a temporary issue on our side; nothing should have been charged for this attempt.`}
                  </p>
                )}
                {pendingPaymentWarning && status === 'idle' && (
                  <p className="form-note">
                    A previous payment attempt for this tender may still be processing — wait a
                    few minutes before paying again to avoid a duplicate charge.
                  </p>
                )}

                <div className="field">
                  <label htmlFor="rfsTenderId">Tender id</label>
                  <input
                    id="rfsTenderId"
                    type="text"
                    value={tenderId}
                    onChange={(e) => setTenderId(e.target.value)}
                    readOnly={!!tenderIdFromLink}
                    required
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="rfsName">Name</label>
                    <input id="rfsName" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="rfsCompany">Company</label>
                    <input id="rfsCompany" type="text" value={company} onChange={(e) => setCompany(e.target.value)} required />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="rfsDesignation">Designation</label>
                    <input id="rfsDesignation" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="rfsEmail">Email</label>
                    <input id="rfsEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="rfsMobile">Mobile</label>
                    <input id="rfsMobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="rfsIsGenerator">Are you a generator?</label>
                    <select id="rfsIsGenerator" value={isGenerator} onChange={(e) => setIsGenerator(e.target.value as 'yes' | 'no')}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                  We collect the details above to process your purchase and, if you enroll later, to
                  contact you about this tender. See our <a href="/privacy">Privacy Policy</a> for how
                  your data is used and retained.
                </p>
                <label className="consent-field">
                  <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} required />
                  <span>
                    I have read the <a href="/privacy">Privacy Policy</a> and consent to Wattmatch
                    collecting and processing my details as described there.
                  </span>
                </label>

                <button type="submit" className="btn btn-solar" disabled={isProcessing || !consentGiven}>
                  {isProcessing ? `${status.replace('_', ' ')}…` : 'Pay & buy document'}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
