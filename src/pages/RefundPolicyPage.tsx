import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// New page, required for Razorpay's KYC/activation review — a missing or vague refund policy is
// one of the most common rejection reasons. The EMD outcome matrix below is not a placeholder —
// it's the actual, already-decided business rule (see TENDER_WORKFLOW_STAKEHOLDER_PLAN.md's Stage
// 8), reused here verbatim rather than invented for this page. The processing timeline and the
// two flat fees' non-refundable status are flagged as [TODO] since those are commercial decisions,
// not yet formally confirmed.
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
            <div className="legal-notice">
              <strong>Template notice:</strong> This page is a working draft. It is not a substitute
              for review by qualified legal counsel — please confirm the processing timeline below
              against our actual payment processor settlement cycle before publishing live.
            </div>

            <Reveal className="legal-block">
              <h3>1. Processing timeline</h3>
              <p>
                Where a refund is due under this policy, we initiate it within [TODO: confirm — e.g.
                "2 working days"] of the refund becoming due, and it is processed to your original
                payment method within <strong>7 working days</strong> of initiation, subject to your
                bank's or payment provider's own processing time.
              </p>

              <h3>2. RfS Document (Bid Purchase) Fee</h3>
              <p>
                This fee is charged once, to unlock a tender's full detail, and is{' '}
                <strong>non-refundable</strong> [TODO: confirm] once the document has been accessed —
                it reflects a service (access) that has already been delivered.
              </p>

              <h3>3. Bid Processing Fee</h3>
              <p>
                This fee is charged once your technical and financial bid is accepted into the
                vetting queue, and is <strong>non-refundable</strong> [TODO: confirm] regardless of
                the outcome of the technical review — it reflects the cost of administering the
                vetting process itself, not a guarantee of approval.
              </p>

              <h3>4. Earnest Money Deposit (EMD)</h3>
              <p>
                The EMD is a refundable security deposit, not a fee for a service — refund or
                forfeiture depends entirely on the outcome of your bid:
              </p>
              <ul>
                <li><strong>Not approved at technical review:</strong> refunded in full.</li>
                <li><strong>Approved, but did not win the auction:</strong> refunded in full.</li>
                <li>
                  <strong>Won the auction and paid the success charge:</strong> refunded in full,
                  separately from and in addition to the success charge itself.
                </li>
                <li>
                  <strong>Won the auction, then withdrew or failed to pay the success charge:</strong>{' '}
                  the EMD is <strong>forfeited</strong>, not refunded. This is the one case where you
                  do not get your deposit back — it exists specifically to discourage backing out
                  after winning.
                </li>
              </ul>

              <h3>5. Success charge</h3>
              <p>
                The success charge is only ever collected from the confirmed auction winner, after
                they choose to proceed — it is not collected from anyone who does not win, and is not
                refundable once paid, as it corresponds to a completed match.
              </p>

              <h3>6. How to request a refund status update</h3>
              <p>
                If a refund you're expecting under this policy hasn't arrived within the timeline
                above, contact us at <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a> with
                your tender reference and payment date.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
