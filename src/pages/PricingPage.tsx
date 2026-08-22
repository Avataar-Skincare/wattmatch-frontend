import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// New page, required for Razorpay's KYC/activation review — "state the fee model." Every amount
// below is deliberately marked [TODO], not shown as a real figure: the platform's actual pricing
// engine (computeAmountPaise, wattmatch-server/src/services/pricingService.ts) is currently a
// placeholder stub pending a final commission-model decision — showing a fabricated number here
// would be actively misleading, not just incomplete. All fees are stated exclusive of applicable
// taxes, since Wattmatch does not yet hold a GSTIN — this avoids having to reprice every fee the
// moment GST registration is completed.
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
              <strong>Template notice:</strong> Amounts marked [TODO] are pending a final commission-
              model decision and are not yet charged to real users — see the Refund &amp;
              Cancellation Policy for how each fee is (or isn't) refunded.
            </div>

            <Reveal className="legal-block">
              <h3>1. RfS Document (Bid Purchase) Fee</h3>
              <p>
                A one-time, flat fee to unlock a tender's full detail (requirements, timelines, and
                supporting documents). Charged once per tender per bidder — never charged again for
                the same tender. Amount: [TODO], exclusive of applicable taxes.
              </p>

              <h3>2. Bid Processing Fee</h3>
              <p>
                A one-time fee charged when you submit your technical and financial bid, covering the
                cost of the vetting process. Amount: [TODO], exclusive of applicable taxes.
              </p>

              <h3>3. Earnest Money Deposit (EMD)</h3>
              <p>
                A refundable security deposit (not a fee) required at bid submission, sized to your
                declared project capacity. See our{' '}
                <a href="/refund-policy">Refund &amp; Cancellation Policy</a> for the full refund/
                forfeiture rules. Amount: [TODO — capacity-based], exclusive of applicable taxes.
              </p>

              <h3>4. Success charge</h3>
              <p>
                Charged only to the confirmed winner of an auction, on successful award. Amount:
                [TODO], exclusive of applicable taxes.
              </p>

              <h3>5. Payment methods</h3>
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
