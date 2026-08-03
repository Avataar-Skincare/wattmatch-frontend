import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Guarantee from '../components/Guarantee';
import PersonaCI from '../components/PersonaCI';
import { whySwitchNow } from '../data/content';

const whyChoose = [
  { title: 'Zero in-house lift', body: 'No energy team, no outside consultant, no market benchmarking. We source, vet, negotiate and monitor on your behalf.' },
  { title: 'Best-in-market pricing', body: 'Competitive auction across multiple generators replaces one-to-one bargaining.' },
  { title: 'PPA, simplified', body: 'Standardised, pre-vetted contracts remove clause-by-clause legal hassle.' },
  { title: 'Pre-vetted, credible partners', body: 'Every generator is technically and financially screened before it can bid.' },
  { title: 'Access to better-priced niche players', body: 'Smaller, high-quality generators, often unable to reach clients on their own, are opened up, expanding the pool and sharpening pricing.' },
  { title: 'ESG, carbon credit & RE-goal support', body: 'Documented clean energy transactions that feed sustainability reporting and RCO compliance.' },
];

export default function ForCIPage() {
  return (
    <div className="content-page">
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">For C&amp;I buyers</span>
            <h1>Run your business. We'll run your renewables.</h1>
            <p>
              Wattmatch sources, vets, negotiates, contracts and monitors your entire renewable
              energy transition: the best generator, the best terms, the best quality, so you
              never need an in-house energy team, a consultant, or your own benchmarking exercise.
            </p>
          </div>
        </div>

        <Guarantee />

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">The cost case</span>
              <h2>The economics alone are compelling</h2>
            </Reveal>
            <Reveal className="ws-col ws-cost" style={{ maxWidth: 460, margin: '0 auto' }}>
              <div className="ws-head ws-head-cost">Landed tariff comparison</div>
              <div className="tariff-card grid-tariff">
                <span className="tc-label">Grid (DISCOM)</span>
                <span className="tc-value">₹6 – ₹15 <small>/ unit</small></span>
                <span className="tc-note">Industrial &amp; commercial tariffs, varies by state</span>
              </div>
              <div className="tariff-arrow" aria-hidden="true">↓</div>
              <div className="tariff-card solar-tariff">
                <span className="tc-label">Solar C&amp;I (open access)</span>
                <span className="tc-value">₹3 – ₹6.5 <small>/ unit</small></span>
                <span className="tc-note">Landed cost incl. wheeling &amp; surcharges</span>
              </div>
              <div className="example-box">
                <span className="ex-icon">→</span>
                <div>
                  <div className="ex-headline">25–50% typical cost saving</div>
                  <div className="ex-body">
                    A 15 MW facility in Haryana signed a 25-year PPA for 5 MW of solar, landed
                    tariff <strong>₹4.78/unit</strong> vs. their DISCOM rate of <strong>₹7.32/unit</strong>,
                    a 35% saving that compounds every year grid tariffs keep rising.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Why C&amp;I clients choose Wattmatch</span>
              <h2>Everything you'd otherwise have to build in-house</h2>
            </Reveal>
            <Reveal className="mgmt-grid">
              {whyChoose.map((item, i) => (
                <div className="mgmt-card" key={item.title}>
                  <span className="num" style={{ display: 'block', marginBottom: 6 }}>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Why switch now</span>
              <h2>The case has never been stronger</h2>
            </Reveal>
            <Reveal className="mgmt-grid">
              {whySwitchNow.map((item) => (
                <div className="mgmt-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <PersonaCI />
      </main>
      <Footer />
    </div>
  );
}
