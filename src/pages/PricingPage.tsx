import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// New page, required for Razorpay's KYC/activation review — "state the fee model." Both fees below
// are genuinely set per-tender (Tender.rfsDocumentFeePaise / bidProcessingFeePaise, set by the admin
// at tender creation — routes/tenders.ts), not a fixed platform-wide number, so there is no single
// figure to publish here; the accurate fee model IS "varies by tender, disclosed before you pay."
// All fees are stated exclusive of applicable taxes, since Wattmatch does not yet hold a GSTIN —
// this avoids having to reprice every fee the moment GST registration is completed.
export default function PricingPage() {
  return (
    <div className="content-page">
      <Seo
        title="Pricing"
        description="Wattmatch's fee structure for buyers and generators using the marketplace."
        path="/pricing"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Pricing</span>
            <h1>Fees on Wattmatch</h1>
            <p>All amounts below are exclusive of applicable taxes.</p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-notice">
              <strong>Fee model:</strong> Wattmatch does not charge a single flat fee across all
              tenders — both fees below are set individually for each tender and shown to you on that
              tender's page before you pay. See the Refund &amp; Cancellation Policy for how each fee
              is (or isn't) refunded.
            </div>

            <Reveal className="legal-block">
              <h3>1. RfS Document (Bid Purchase) Fee</h3>
              <p>
                A one-time, flat fee to unlock a tender's full detail (requirements, timelines, and
                supporting documents). Charged once per tender per bidder — never charged again for
                the same tender. The amount varies by tender and is stated on that tender's page
                before you pay, exclusive of applicable taxes.
              </p>

              <h3>2. Bid Processing Fee</h3>
              <p>
                A one-time fee charged when you submit your technical and financial bid, covering the
                cost of the vetting process. The amount varies by tender and is stated on that
                tender's page before you pay, exclusive of applicable taxes.
              </p>

              <h3>3. Earnest Money Deposit (EMD)</h3>
              <p>
                Not a fee and not collected as money — EMD is a Bank Guarantee you arrange through
                your own bank and submit to us as a document, sized to the amount stated on the
                tender. See our <a href="/refund-policy">Refund &amp; Cancellation Policy</a> for how
                it is returned or invoked.
              </p>

              <h3>4. Payment methods</h3>
              <p>
                All payments are processed securely through Razorpay. We accept the payment methods
                Razorpay makes available for our account — this may include cards, UPI, netbanking,
                and wallets.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
