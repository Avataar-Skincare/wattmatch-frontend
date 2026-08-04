import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import CheckIcon from './icons/CheckIcon';
import { generatorBenefits } from '../data/content';

// Embedded lead-capture form hidden in favor of a direct CTA to the full
// registration page (/renewablesGenerator). Original form (state,
// handleSubmit, JSX) preserved below for easy restore — see the block
// comment at the bottom of this file.
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

/*
Original embedded lead-capture form (hidden above in favor of a direct CTA
to /renewablesGenerator). Restore by pasting this back in place of the
form-cta-card Reveal block above, and re-adding these imports:
  import { useState, type FormEvent } from 'react';
  import { indianStates } from '../data/content';
  import { submitGeneratorLead } from '../lib/api';
  import type { GeneratorFormData } from '../types/forms';

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: GeneratorFormData = {
      name: String(data.get('name') ?? ''),
      company: String(data.get('company') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      state: String(data.get('state') ?? ''),
      capacity: String(data.get('capacity') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    setSubmitting(true);
    setError(false);
    const ok = await submitGeneratorLead(payload);
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setError(true);
    }
  }

  <Reveal className="form-card" id="genFormCard" style={{ order: 1 }}>
    {!submitted ? (
      <form id="genForm" onSubmit={handleSubmit}>
        <h3>Join as a generator</h3>
        <p className="sub">Get vetted once, and get access to real, qualified C&amp;I demand.</p>
        <div className="field-row">
          <div className="field">
            <label htmlFor="genName">Full name</label>
            <input id="genName" name="name" required type="text" placeholder="Your name" />
          </div>
          <div className="field">
            <label htmlFor="genCompany">Company</label>
            <input id="genCompany" name="company" required type="text" placeholder="Company name" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="genEmail">Work email</label>
            <input id="genEmail" name="email" required type="email" placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="genPhone">Phone</label>
            <input
              id="genPhone"
              name="phone"
              required
              type="tel"
              inputMode="tel"
              placeholder="Phone number"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+\-\s()]/g, '');
              }}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="genState">Primary state of operation</label>
            <select id="genState" name="state" required defaultValue="">
              <option value="" disabled>Select state</option>
              {indianStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="genCap">Installed capacity (MW)</label>
            <input id="genCap" name="capacity" type="number" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="genMsg">Anything else?</label>
          <textarea id="genMsg" name="message" placeholder="Track record, commissioning timeline, certifications..." />
        </div>
        <button type="submit" className="btn btn-copper" disabled={submitting}>
          {submitting ? 'Sending…' : 'Join as a generator'} <span className="btn-arrow">→</span>
        </button>
        {error && (
          <p className="form-error">Something went wrong sending your application. Please try again, or email hello@wattmatch.in.</p>
        )}
        <p className="form-note">Every applicant goes through a technical and financial check.</p>
        <p className="form-note"><Link to="/renewablesGenerator">Prefer a full registration form? →</Link></p>
      </form>
    ) : (
      <div className="form-success show" id="genSuccess">
        <div className="check"><CheckIcon size={20} /></div>
        <h3>Application received</h3>
        <p>Our team will begin the vetting process and reach out within 3 business days.</p>
      </div>
    )}
  </Reveal>
*/
