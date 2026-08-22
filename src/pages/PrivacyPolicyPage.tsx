import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

// Split out of the former combined /privacy-terms page — Razorpay's KYC review (and DPDP
// compliance generally) expects Privacy and Terms as separately reachable pages, not one combined
// document. Content is unchanged from the original, just relocated.
export default function PrivacyPolicyPage() {
  return (
    <div className="content-page">
      <Seo
        title="Privacy Policy"
        description="How Wattmatch collects, uses and protects your data."
        path="/privacy"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Legal</span>
            <h1>Privacy Policy</h1>
            <p>How we collect, use and protect your data.</p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-notice">
              <strong>Template notice:</strong> This page is a working draft structured around
              India's Digital Personal Data Protection Act, 2023 (DPDP Act). It is not a substitute
              for review by qualified legal counsel: please have a lawyer review and finalise this
              before publishing it live.
            </div>

            <Reveal className="legal-block">
              <h3>1. What we collect</h3>
              <p>
                When you use our lead-capture forms or contact us, we collect personal data you
                provide directly, including your name, company name, work email, phone number,
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
                who processes data on our behalf (e.g. hosting, CRM, payment processing) is required
                to meet equivalent security standards.
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
