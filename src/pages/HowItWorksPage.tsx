import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import HowItWorks from '../components/HowItWorks';
import { fullJourneySteps, over15YearsItems } from '../data/content';

export default function HowItWorksPage() {
  return (
    <div className="content-page">
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">The mechanism</span>
            <h1>Here's exactly what happens, step by step</h1>
            <p>
              From your first requirement to fifteen years of managed power delivery — one platform
              runs the whole relationship.
            </p>
          </div>
        </div>

        <HowItWorks />

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">The full journey</span>
              <h2>A typical deal, start to finish</h2>
              <p>
                What a C&amp;I client and a generator each experience, from registration through
                fifteen years of live power delivery.
              </p>
            </Reveal>
            <Reveal className="journey-list">
              {fullJourneySteps.map((step, i) => (
                <div className="journey-item" key={step.title}>
                  <span className="journey-num">{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Over 15 years</span>
              <h2>What Wattmatch keeps doing after the deal is signed</h2>
              <p>A PPA is a 15–25 year commitment. Wattmatch's job doesn't end at signature.</p>
            </Reveal>
            <Reveal className="mgmt-grid">
              {over15YearsItems.map((item) => (
                <div className="mgmt-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>Ready to see what a match looks like for you?</h2>
            <div className="hero-ctas" style={{ marginTop: 24 }}>
              <Link to="/for-ci" className="btn btn-solar">I buy power <span className="btn-arrow">→</span></Link>
              <Link to="/for-generators" className="btn btn-outline">I generate power <span className="btn-arrow">→</span></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
