import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// Split out of the former combined /privacy-terms page. Also folds in the Service Delivery Policy
// (Section 9's requirement — "when the service is rendered after payment") as its own numbered
// clause, per the checklist's own suggestion that it can live inside Terms rather than as a
// separate page.
export default function TermsOfServicePage() {
  return (
    <div className="content-page">
      <Seo
        title="Terms of Service"
        description="The terms governing use of the Wattmatch marketplace, including fees and service delivery."
        path="/terms"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Legal</span>
            <h1>Terms of Service</h1>
            <p>The terms governing your use of the Wattmatch marketplace.</p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-notice">
              <strong>Template notice:</strong> This page is a working draft. It is not a substitute
              for review by qualified legal counsel: please have a lawyer review and finalise this
              before publishing it live, particularly the liability and dispute-resolution sections.
            </div>

            <Reveal className="legal-block">
              <h3>1. Who we are</h3>
              <p>
                Wattmatch operates a marketplace connecting commercial &amp; industrial electricity
                buyers with renewable energy generators. Wattmatch acts solely as a facilitator and is
                not a party to, and never a principal in, any power purchase agreement executed
                between a buyer and a generator through the marketplace.
              </p>

              <h3>2. Eligibility &amp; accuracy</h3>
              <p>
                By submitting information through this site, you confirm that the information you
                provide is accurate to the best of your knowledge and that you are authorised to act
                on behalf of the company you represent.
              </p>

              <h3>3. No guarantee of match or outcome</h3>
              <p>
                Submitting a form or enquiry does not guarantee a match, a contract, or any specific
                commercial outcome. All matches are subject to Wattmatch's vetting process and the
                independent commercial agreement of both parties.
              </p>

              <h3>4. Marketplace fees</h3>
              <p>
                Wattmatch charges the fees described on our <a href="/pricing">Pricing</a> page, all
                exclusive of applicable taxes. Fees are disclosed before you are asked to pay them, at
                each stage of the tender process, and are never collected without your explicit action
                (e.g. clicking "Pay" at checkout).
              </p>

              <h3>5. Service delivery policy</h3>
              <p>
                Wattmatch's services are rendered as follows, immediately after the corresponding
                payment is confirmed:
              </p>
              <ul>
                <li>
                  <strong>RfS Document access fee:</strong> full tender detail is unlocked
                  immediately on payment confirmation.
                </li>
                <li>
                  <strong>Bid Processing Fee:</strong> your technical and financial bid is accepted
                  into the vetting queue immediately on payment confirmation.
                </li>
                <li>
                  <strong>Earnest Money Deposit (EMD):</strong> this is a refundable/forfeitable
                  security deposit, not a fee for a service rendered at the time of payment — see our{' '}
                  <a href="/refund-policy">Refund &amp; Cancellation Policy</a> for when it is
                  returned or retained.
                </li>
              </ul>
              <p>
                Where payment confirmation is delayed (e.g. a bank transfer still clearing), the
                corresponding service is rendered as soon as Wattmatch's systems receive confirmation
                from our payment processor, not from the time you initiated payment.
              </p>

              <h3>6. Limitation of liability</h3>
              <p>
                Wattmatch facilitates matching and contract administration but is not liable for the
                performance, delivery, or conduct of any generator or C&amp;I buyer under a matched
                agreement, except as expressly set out in the applicable PPA and escrow terms.
              </p>

              <h3>7. Governing law</h3>
              <p>
                These terms are governed by the laws of India. [Jurisdiction / dispute resolution
                clause to be finalised with counsel.]
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
