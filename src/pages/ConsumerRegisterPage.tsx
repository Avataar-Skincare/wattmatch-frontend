import { useState, type FormEvent } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import CheckIcon from '../components/icons/CheckIcon';
import { indianStates } from '../data/content';
import { submitCiRegistration } from '../lib/api';
import type { CIRegistrationFormData } from '../types/forms';

type Step = 'details' | 'review' | 'success';

const emptyForm: CIRegistrationFormData = {
  name: '', company: '', email: '', phone: '', state: '',
  load: '', siteLocation: '', targetCapacity: '', tenurePreference: '', message: '', consent: false,
};

export default function ConsumerRegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<CIRegistrationFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleDetailsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setForm({
      name: String(data.get('name') ?? ''),
      company: String(data.get('company') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      state: String(data.get('state') ?? ''),
      load: String(data.get('load') ?? ''),
      siteLocation: String(data.get('siteLocation') ?? ''),
      targetCapacity: String(data.get('targetCapacity') ?? ''),
      tenurePreference: String(data.get('tenurePreference') ?? ''),
      message: String(data.get('message') ?? ''),
      consent: data.get('consent') === 'on',
    });
    setStep('review');
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setError('');
    const ok = await submitCiRegistration(form);
    setSubmitting(false);
    if (ok) {
      setStep('success');
    } else {
      setError('Something went wrong submitting your registration. Please try again, or email hello@wattmatch.in.');
    }
  }

  return (
    <div className="register-page">
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Buyer registration</span>
            <h1>Register as a C&amp;I buyer</h1>
            <p>Tell us about your load and site. Our team matches you with vetted generators and will be in touch.</p>
          </div>

          {step !== 'success' && (
            <div className="step-indicator">
              <span className={`step ${step === 'details' ? 'active' : 'done'}`}>1. Details</span>
              <span className={`step ${step === 'review' ? 'active' : ''}`}>2. Review</span>
            </div>
          )}

          <Reveal className="form-card register-form-card">
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit}>
                <h3>Load &amp; contact details</h3>
                <p className="sub">Full details help our team put together the right options for you.</p>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ciRegName">Full name</label>
                    <input id="ciRegName" name="name" required type="text" maxLength={255} defaultValue={form.name} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label htmlFor="ciRegCompany">Company</label>
                    <input id="ciRegCompany" name="company" required type="text" maxLength={255} defaultValue={form.company} placeholder="Company name" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ciRegEmail">Work email</label>
                    <input id="ciRegEmail" name="email" required type="email" maxLength={255} defaultValue={form.email} placeholder="you@company.com" />
                  </div>
                  <div className="field">
                    <label htmlFor="ciRegPhone">Phone</label>
                    <input
                      id="ciRegPhone" name="phone" required type="tel" inputMode="tel"
                      defaultValue={form.phone} placeholder="10-digit mobile number" maxLength={13}
                      pattern="(\+?91\s?)?[6-9]\d{9}"
                      title="Enter a valid 10-digit Indian mobile number"
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+\s]/g, ''); }}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ciRegState">State</label>
                    <select id="ciRegState" name="state" required defaultValue={form.state}>
                      <option value="" disabled>Select state</option>
                      {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="ciRegLoad">Monthly consumption (kWh)</label>
                    <input id="ciRegLoad" name="load" required type="number" min="1" step="1" defaultValue={form.load} />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ciRegSite">Site location</label>
                    <input id="ciRegSite" name="siteLocation" type="text" maxLength={255} defaultValue={form.siteLocation} placeholder="City, district" />
                  </div>
                  <div className="field">
                    <label htmlFor="ciRegTargetCapacity">Target capacity (MW)</label>
                    <input id="ciRegTargetCapacity" name="targetCapacity" type="number" min="0.1" step="0.1" defaultValue={form.targetCapacity} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="ciRegTenure">Preferred deal tenure (years)</label>
                  <input id="ciRegTenure" name="tenurePreference" type="number" min="1" step="1" defaultValue={form.tenurePreference} placeholder="e.g. 10" />
                </div>
                <div className="field">
                  <label htmlFor="ciRegMsg">Anything else?</label>
                  <textarea id="ciRegMsg" name="message" maxLength={2000} defaultValue={form.message} placeholder="Timeline, current tariff, specific requirements..." />
                </div>
                <label className="consent-field">
                  <input type="checkbox" name="consent" required defaultChecked={form.consent} />
                  <span>I agree to be contacted by Wattmatch and consent to my details being shared with vetted generators for matching purposes.</span>
                </label>
                <button type="submit" className="btn btn-solar">
                  Continue to review <span className="btn-arrow">→</span>
                </button>
              </form>
            )}

            {step === 'review' && (
              <div>
                <h3>Review &amp; submit</h3>
                <p className="sub">Confirm your details to submit. We'll email you a confirmation once it's received.</p>
                <ul className="register-review-list">
                  <li><strong>{form.name}</strong> · {form.company}</li>
                  <li>{form.email} · {form.phone}</li>
                  <li>{form.state} · {form.load} kWh/month</li>
                </ul>
                <button type="button" className="btn btn-solar" disabled={submitting} onClick={handleFinalSubmit}>
                  {submitting ? 'Submitting…' : 'Submit registration'} <span className="btn-arrow">→</span>
                </button>
                {error && <p className="form-error">{error}</p>}
                <div className="form-nav">
                  <button type="button" className="otp-resend" onClick={() => setStep('details')}>← Edit details</button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="form-success show">
                <div className="check"><CheckIcon size={20} /></div>
                <h3>Registration received</h3>
                <p>We've sent a confirmation to your email. Our team will review your details and be in touch soon.</p>
              </div>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
