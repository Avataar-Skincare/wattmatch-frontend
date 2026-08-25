import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { usePayment } from '../hooks/usePayment';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Stage 3's RfS Document purchase form (TENDER_WORKFLOW_STAKEHOLDER_PLAN.md) — deliberately
// account-less. Every field here is now a real structured field on the Payment row (see
// routes/payments.ts's rfsDocumentOrderBodySchema), not free-form notes. The consent checkbox
// below is Red Flag #1's fix — DPDP Act requires telling people why their data is collected and
// getting explicit opt-in before submitting, not just posting a privacy policy somewhere on the
// site. Accepts a `?tenderId=` query param so a link from the public Tenders list can prefill it.
export default function RfsDocumentPurchasePage() {
  const [searchParams] = useSearchParams();
  const [tenderId, setTenderId] = useState(searchParams.get('tenderId') ?? '');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isGenerator, setIsGenerator] = useState<'yes' | 'no'>('no');
  const [consentGiven, setConsentGiven] = useState(false);

  const { status, error, isProcessing, startPayment, reset } = usePayment();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    if (!consentGiven) return;
    const result = await startPayment({
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
    if (result) await downloadTenderDocument();
  }

  // Fires the moment payment verifies — the tender document isn't tied to an account yet at this
  // point (this whole flow is deliberately account-less), so it's fetched by the email just paid
  // with, same as hasRfsDocumentPaid does everywhere else. Once they enroll, it stays fetchable
  // from their generator dashboard too (GeneratorBidSubmissionPage) — this isn't the only copy.
  async function downloadTenderDocument() {
    try {
      const res = await fetch(`${API_BASE}/api/tenders/${tenderId}/tender-document?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) window.open(data.url, '_blank');
    } catch {
      // best-effort — nothing to show the user if this fails, the doc is still safely re-fetchable later
    }
  }

  return (
    <div className="content-page">
      <Seo title="Buy tender document" description="Buy a tender's RfS Document to unlock full details." path="/rfs-document-purchase" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Stage 3</span>
            <h1>Buy the tender document</h1>
            <p>No account required. Pay the Bid Purchase Fee to unlock the full tender detail.</p>
          </div>
        </div>

        <section>
          <form onSubmit={handleSubmit} className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
            {error && <p style={{ color: '#B53A3A' }}>{error}</p>}
            {status === 'success' && (
              <p style={{ color: '#2F7A3E' }}>
                Payment successful — your tender document should have opened in a new tab. You can also
                come back for it any time by enrolling and visiting your generator dashboard.
              </p>
            )}
            {status === 'cancelled' && <p>Payment cancelled.</p>}

            <input type="text" placeholder="Tender id" value={tenderId} onChange={(e) => setTenderId(e.target.value)} required />
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            <input type="text" placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="tel" placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            <label>
              Are you a generator?{' '}
              <select value={isGenerator} onChange={(e) => setIsGenerator(e.target.value as 'yes' | 'no')}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>

            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              We collect the details above to process your purchase and, if you enroll later, to
              contact you about this tender. See our <a href="/privacy">Privacy Policy</a> for how
              your data is used and retained.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                required
                style={{ marginTop: '0.2rem' }}
              />
              <span>
                I have read the <a href="/privacy">Privacy Policy</a> and consent to Wattmatch
                collecting and processing my details as described there.
              </span>
            </label>

            <button type="submit" className="btn btn-solar" disabled={isProcessing || !consentGiven}>
              {isProcessing ? `${status.replace('_', ' ')}…` : 'Pay & buy document'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
