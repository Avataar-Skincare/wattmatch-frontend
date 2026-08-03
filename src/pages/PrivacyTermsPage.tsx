import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';

export default function PrivacyTermsPage() {
  return (
    <div className="content-page">
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Legal</span>
            <h1>Privacy Policy &amp; Terms of Use</h1>
            <p>
              How we collect, use and protect your data, and the terms governing your use of the
              Wattmatch platform.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-notice">
              <strong>Template notice:</strong> This page is a working draft structured around
              India's Digital Personal Data Protection Act, 2023 (DPDP Act) and standard commercial
              terms. It is not a substitute for review by qualified legal counsel — please have a
              lawyer review and finalise this before publishing it live, particularly the
              data-processing, liability and dispute-resolution sections.
            </div>

            <Reveal className="legal-block">
              <h2>Privacy Policy</h2>
              <p className="legal-updated">Last updated: [Insert date]</p>

              <h3>1. What we collect</h3>
              <p>
                When you use our lead-capture forms or contact us, we collect personal data you
                provide directly — including your name, company name, work email, phone number,
                state/location, and details about your electricity consumption or generation
                capacity. We do not collect more than is needed to evaluate and process your enquiry.
              </p>

              <h3>2. Why we collect it</h3>
              <p>
                We use this data to: respond to your enquiry, evaluate and match C&amp;I requirements
                with vetted generators, conduct technical and financial vetting of generator
                applicants, administer contracts and escrow for matched deals, and send you relevant
                updates about your enquiry or account. We do not use your data for purposes beyond
                what you'd reasonably expect from submitting the form you used.
              </p>

              <h3>3. Your consent</h3>
              <p>
                By submitting a form on this site, you consent to Wattmatch processing your data for
                the specific purpose stated on that form. We do not bundle unrelated purposes into a
                single consent, and you may withdraw consent at any time by contacting us (see below).
              </p>

              <h3>4. How we protect it</h3>
              <p>
                We apply reasonable technical and organisational safeguards to protect your data,
                including access controls and encryption where appropriate. Any third-party vendor
                who processes data on our behalf (e.g. hosting, CRM) is required to meet equivalent
                security standards.
              </p>

              <h3>5. Your rights</h3>
              <p>
                Under the DPDP Act, 2023, you have the right to access the personal data we hold
                about you, request correction of inaccurate data, request erasure of your data
                (subject to any legal retention requirements), and withdraw consent at any time. To
                exercise any of these rights, contact us at{' '}
                <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a>.
              </p>

              <h3>6. Data breach notification</h3>
              <p>
                In the event of a personal data breach, we will notify the Data Protection Board of
                India and affected individuals in line with the DPDP Act's requirements.
              </p>

              <h3>7. Contact</h3>
              <p>
                Questions about this policy or your data can be directed to{' '}
                <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a>.
              </p>
            </Reveal>

            <Reveal className="legal-block">
              <h2>Terms of Use</h2>
              <p className="legal-updated">Last updated: [Insert date]</p>

              <h3>1. Who we are</h3>
              <p>
                Wattmatch operates a marketplace connecting commercial &amp; industrial electricity
                buyers with renewable energy generators. Wattmatch acts solely as a facilitator and is
                not a party to, and never a principal in, any power purchase agreement executed
                between a buyer and a generator through the platform.
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

              <h3>4. Platform fees</h3>
              <p>
                Wattmatch's fee structure — including processing fee and the per-unit transaction
                fee — will be disclosed in full prior to any contract execution.
              </p>

              <h3>5. Limitation of liability</h3>
              <p>
                Wattmatch facilitates matching and contract administration but is not liable for the
                performance, delivery, or conduct of any generator or C&amp;I buyer under a matched
                agreement, except as expressly set out in the applicable PPA and escrow terms.
              </p>

              <h3>6. Governing law</h3>
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
