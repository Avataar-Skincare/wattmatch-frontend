import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import CheckIcon from './icons/CheckIcon';
import { ciBenefits } from '../data/content';

// Embedded lead-capture form hidden in favor of a direct CTA to the full
// registration page (/ciBuyer). The original inline form (posting to
// /api/leads/ci) was removed for good along with it — see git history if
// it's ever needed again.
export default function PersonaCI() {
  return (
    <section id="for-ci" className="persona ci" style={{ background: 'var(--porcelain)' }}>
      <div className="wrap persona-grid">
        <Reveal className="persona-copy">
          <span className="eyebrow">For C&amp;I buyers</span>
          <h2>Your team runs the business. We run the renewables.</h2>
          <p className="lede">
            No energy manager to hire, no consultant to retain, no benchmarking exercise to run.
            Wattmatch is the only renewables relationship your company needs.
          </p>
          <div className="benefit-list">
            {ciBenefits.map((b) => (
              <div className="benefit" key={b.text}>
                <span className="dot"><CheckIcon /></span>
                <p>{b.strong && <strong>{b.strong}</strong>}{b.text}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="form-card form-cta-card" id="ciFormCard">
          <div>
            <h3>Request a match</h3>
            <p className="sub">Tell us about your load, and our team will come back with matched generator options.</p>
            <Link to="/ciBuyer" className="btn btn-solar">
              Start your registration <span className="btn-arrow">→</span>
            </Link>
            <p className="form-note">Takes about 5 minutes. No cost, no obligation.</p>
          </div>
          <div className="cta-steps">
            <div className="cta-step">
              <span className="cta-step-num">1</span>
              <p>Share your load, site and state, just the essentials.</p>
            </div>
            <div className="cta-step">
              <span className="cta-step-num">2</span>
              <p>We match you against our vetted generator pool.</p>
            </div>
            <div className="cta-step">
              <span className="cta-step-num">3</span>
              <p>Review offers and sign, no PPA experience required.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
