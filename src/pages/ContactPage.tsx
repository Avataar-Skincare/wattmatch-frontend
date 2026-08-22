import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import Contact from '../components/Contact';

export default function ContactPage() {
  return (
    <div className="content-page">
      <Seo
        title="Contact"
        description="Questions about the marketplace, a partnership, or press? Reach out, we read every message."
        path="/contact"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Contact</span>
            <h1>Let's talk</h1>
            <p>Questions about the marketplace, a partnership, or press? Reach out, we read every message.</p>
          </div>
        </div>

        <Contact eyebrow="Get in touch" heading="Send us a message" body="" />

        <section>
          <div className="wrap">
            <Reveal className="stat-cards">
              <div className="stat-card">
                <span className="sc-label">Email</span>
                <span className="sc-value" style={{ fontSize: 19 }}>
                  <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a>
                </span>
              </div>
              <div className="stat-card">
                {/* TODO: replace with a real, working number before go-live — payment-processor
                    review (and DPDP/consumer-facing practice generally) expects a phone number
                    here, not just email. */}
                <span className="sc-label">Phone</span>
                <span className="sc-value" style={{ fontSize: 19 }}>
                  <a href="tel:+91TODO">[TODO: phone number]</a>
                </span>
              </div>
              <div className="stat-card">
                <span className="sc-label">For C&amp;I buyers</span>
                <span className="sc-value" style={{ fontSize: 15 }}>
                  Looking to switch to renewables? <Link to="/for-ci">Request a match →</Link>
                </span>
              </div>
              <div className="stat-card">
                <span className="sc-label">For generators</span>
                <span className="sc-value" style={{ fontSize: 15 }}>
                  Want access to C&amp;I demand? <Link to="/for-generators">Join as a generator →</Link>
                </span>
              </div>
            </Reveal>
            {/* TODO: replace with the full, exact registered postal address — required for
                payment-processor KYC review, a city name alone is not sufficient. */}
            <p className="ws-source">Registered office: [TODO: full postal address], Delhi NCR, India</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
