import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import CheckIcon from './icons/CheckIcon';
import { generatorBenefits } from '../data/content';

// Embedded lead-capture form hidden in favor of a direct CTA to the full
// registration page (/renewablesGenerator). The original inline form
// (posting to /api/leads/generator) was removed for good along with it —
// see git history if it's ever needed again.
export default function PersonaGenerators() {
  return (
    <section id="for-generators" className="persona gen" style={{ background: 'var(--porcelain-2)' }}>
      <div className="wrap persona-grid persona-grid-gen">
        <Reveal className="form-card form-cta-card" id="genFormCard" style={{ order: 1 }}>
          <div>
            <h3>Join as a generator</h3>
            <p className="sub">Get vetted once, and get access to real, qualified C&amp;I demand.</p>
            <Link to="/renewablesGenerator" className="btn btn-copper">
              Start your registration <span className="btn-arrow">→</span>
            </Link>
            <p className="form-note">Every applicant goes through a technical and financial check.</p>
          </div>
          <div className="cta-steps">
            <div className="cta-step">
              <span className="cta-step-num">1</span>
              <p>Tell us about your plant, capacity and location.</p>
            </div>
            <div className="cta-step">
              <span className="cta-step-num">2</span>
              <p>We run a technical and financial vetting check.</p>
            </div>
            <div className="cta-step">
              <span className="cta-step-num">3</span>
              <p>Go live to our qualified C&amp;I demand pool.</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="persona-copy" style={{ order: 2 }}>
          <span className="eyebrow">For generators</span>
          <h2>Access, not expertise, is the barrier. We remove it.</h2>
          <p className="lede">
            Building a renewables plant takes relatively little specialised expertise. What keeps new
            entrants out is access to customers, and someone backing their credibility.
          </p>
          <div className="market-note">
            <div className="mn-bar"><div className="mn-fill"></div></div>
            <p>
              <strong>Today, a handful of players</strong> dominate C&amp;I generator relationships,
              not because they build better plants, but because they already have the access and
              trust that new entrants lack.
            </p>
          </div>
          <div className="benefit-list">
            {generatorBenefits.map((b) => (
              <div className="benefit" key={b.text}>
                <span className="dot"><CheckIcon /></span>
                <p>{b.strong && <strong>{b.strong}</strong>}{b.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
