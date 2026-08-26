import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// New page, required for Razorpay's KYC/activation review — a missing or vague refund policy is
// one of the most common rejection reasons. EMD moved off money entirely (2026-08-25) — it's a
// Bank Guarantee document released or invoked, never a payment refund; Success Charge is dropped
// from the platform, not just from this page. Confirmed business policy: both Razorpay-collected
// fees (RfS Document, Bid Processing) are non-refundable once paid — Wattmatch does not process any
// monetary refund through Razorpay. EMD is the only "returned" item on the platform, and it was
// never a Razorpay payment to begin with (see Section 4).
export default function RefundPolicyPage() {
  return (
    <div className="content-page">
      <Seo
        title="Refund &amp; Cancellation Policy"
        description="When and how Wattmatch fees and deposits are refunded."
        path="/refund-policy"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Legal</span>
            <h1>Refund &amp; Cancellation Policy</h1>
            <p>When and how fees and deposits paid on Wattmatch are refunded.</p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <Reveal className="legal-block">
              <h3>1. No monetary refunds are processed through Razorpay</h3>
              <p>
                Both fees Wattmatch collects through Razorpay — the RfS Document Fee and the Bid
                Processing Fee — are non-refundable once paid (see Sections 2 and 3). The only item
                ever "returned" on Wattmatch is the EMD, which is not a payment at all (Section 4).
                As a result, no payment made through Razorpay is ever reversed or refunded under this
                policy.
              </p>

              <h3>2. RfS Document (Bid Purchase) Fee</h3>
              <p>
                This fee is charged once, to unlock a tender's full detail, and is{' '}
                <strong>non-refundable</strong> once the document has been accessed — it reflects a
                service (access) that has already been delivered.
              </p>

              <h3>3. Bid Processing Fee</h3>
              <p>
                This fee is charged once your technical and financial bid is accepted into the
                vetting queue, and is <strong>non-refundable</strong> regardless of the outcome of the
                technical review — it reflects the cost of administering the vetting process itself,
                not a guarantee of approval.
              </p>

              <h3>4. Earnest Money Deposit (EMD)</h3>
              <p>
                The EMD is not money we collect — it is a Bank Guarantee you arrange through your own
                bank and submit to us as a document. "Refund" therefore means returning that document
                to you; it is never a payment reversal.
              </p>
              <ul>
                <li>
                  <strong>Released:</strong> we return the Bank Guarantee to the address you provided
                  once your bid's outcome no longer requires it on file — for example, you were not
                  approved at technical review, you were approved but did not win, or you won and the
                  tender was successfully completed.
                </li>
                <li>
                  <strong>Invoked:</strong> if you win and then withdraw or otherwise back out, we
                  invoke the Bank Guarantee with your issuing bank instead of returning it. This is the
                  one case where you do not get the instrument back — it exists specifically to
                  discourage backing out after winning.
                </li>
              </ul>
              <p>
                Both outcomes are recorded by us as an explicit, reasoned decision — never automatic —
                since returning or invoking a physical instrument is a real-world action, not a system
                event.
              </p>

              <h3>5. How to check your EMD status</h3>
              <p>
                If you're expecting your EMD Bank Guarantee to be released and it hasn't arrived,
                contact us at <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a> with your
                tender reference and guarantee number.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
