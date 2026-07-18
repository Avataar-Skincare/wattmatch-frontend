import { useState, type FormEvent } from 'react';
import Reveal from './Reveal';
import CheckIcon from './icons/CheckIcon';
import { generatorBenefits, indianStates } from '../data/content';
import { submitGeneratorLead } from '../lib/api';
import type { GeneratorFormData } from '../types/forms';

export default function PersonaGenerators() {
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

  return (
    <section id="for-generators" className="persona gen" style={{ background: 'var(--porcelain-2)' }}>
      <div className="wrap persona-grid persona-grid-gen">
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
                    placeholder="+91"
                    pattern="[0-9+\s\(\)\-]{7,15}"
                    title="Phone number with digits, spaces, +, -, or () only"
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
                  <label htmlFor="genCap">Capacity (MW)</label>
                  <input id="genCap" name="capacity" type="text" placeholder="e.g. 5 MW installed" />
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
            </form>
          ) : (
            <div className="form-success show" id="genSuccess">
              <div className="check"><CheckIcon size={20} /></div>
              <h3>Application received</h3>
              <p>Our team will begin the vetting process and reach out within 3 business days.</p>
            </div>
          )}
        </Reveal>

        <Reveal className="persona-copy" style={{ order: 2 }}>
          <span className="eyebrow">For generators</span>
          <h2>Access, not expertise, is the barrier. We remove it.</h2>
          <p className="lede">
            Building a solar plant takes relatively little specialised expertise. What keeps new
            entrants out is access to customers, and someone backing their credibility.
          </p>
          <div className="market-note">
            <div className="mn-bar"><div className="mn-fill"></div></div>
            <p>
              <strong>Today, a handful of players</strong> dominate C&amp;I generator relationships —
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
