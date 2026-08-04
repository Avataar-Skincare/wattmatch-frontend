import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import CheckIcon from './icons/CheckIcon';
import { ciBenefits } from '../data/content';

// Embedded lead-capture form hidden in favor of a direct CTA to the full
// registration page (/ciBuyer). Original form (state, handleSubmit, JSX)
// preserved below for easy restore — see the block comment at the bottom
// of this file.
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

/*
Original embedded lead-capture form (hidden above in favor of a direct CTA
to /ciBuyer). Restore by pasting this back in place of the form-cta-card
Reveal block above, and re-adding these imports:
  import { useState, type FormEvent } from 'react';
  import { indianStates } from '../data/content';
  import { submitCILead } from '../lib/api';
  import type { CIFormData } from '../types/forms';

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: CIFormData = {
      name: String(data.get('name') ?? ''),
      company: String(data.get('company') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      state: String(data.get('state') ?? ''),
      load: String(data.get('load') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    setSubmitting(true);
    setError(false);
    const ok = await submitCILead(payload);
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setError(true);
    }
  }

  <Reveal className="form-card" id="ciFormCard">
    {!submitted ? (
      <form id="ciForm" onSubmit={handleSubmit}>
        <h3>Request a match</h3>
        <p className="sub">Tell us about your load. A member of our team will reach out with generator options.</p>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ciName">Full name</label>
            <input id="ciName" name="name" required type="text" placeholder="Your name" />
          </div>
          <div className="field">
            <label htmlFor="ciCompany">Company</label>
            <input id="ciCompany" name="company" required type="text" placeholder="Company name" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="ciEmail">Work email</label>
            <input id="ciEmail" name="email" required type="email" placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="ciPhone">Phone</label>
            <input
              id="ciPhone"
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
            <label htmlFor="ciState">State</label>
            <select id="ciState" name="state" required defaultValue="">
              <option value="" disabled>Select state</option>
              {indianStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ciLoad">Monthly consumption (kWh)</label>
            <input id="ciLoad" name="load" type="number" onWheel={(e) => e.currentTarget.blur()} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ciMsg">Anything else?</label>
          <textarea id="ciMsg" name="message" placeholder="Timeline, current tariff, specific requirements..." />
        </div>
        <button type="submit" className="btn btn-solar" disabled={submitting}>
          {submitting ? 'Sending…' : 'Request a match'} <span className="btn-arrow">→</span>
        </button>
        {error && (
          <p className="form-error">Something went wrong sending your request. Please try again, or email hello@wattmatch.in.</p>
        )}
        <p className="form-note">No spam. We'll only reach out about your solar options.</p>
        <p className="form-note"><Link to="/ciBuyer">Prefer a full registration form? →</Link></p>
      </form>
    ) : (
      <div className="form-success show" id="ciSuccess">
        <div className="check"><CheckIcon size={20} /></div>
        <h3>Request received</h3>
        <p>Our team will reach out within 2 business days with matched generator options.</p>
      </div>
    )}
  </Reveal>
*/
