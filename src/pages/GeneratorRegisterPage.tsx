import { useState, type FormEvent } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import CheckIcon from '../components/icons/CheckIcon';
import { indianStates } from '../data/content';
import { submitGeneratorRegistration } from '../lib/api';
import type { GeneratorRegistrationFormData } from '../types/forms';

type Step = 'details' | 'review' | 'success';

const emptyForm: GeneratorRegistrationFormData = {
  name: '', company: '', email: '', phone: '', state: '',
  capacity: '', siteLocation: '', commissioningTimeline: '', certifications: '', message: '',
};

export default function GeneratorRegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<GeneratorRegistrationFormData>(emptyForm);
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
      capacity: String(data.get('capacity') ?? ''),
      siteLocation: String(data.get('siteLocation') ?? ''),
      commissioningTimeline: String(data.get('commissioningTimeline') ?? ''),
      certifications: String(data.get('certifications') ?? ''),
      message: String(data.get('message') ?? ''),
    });
    setStep('review');
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setError('');
    const ok = await submitGeneratorRegistration(form);
    setSubmitting(false);
    if (ok) {
      setStep('success');
    } else {
      setError('Something went wrong submitting your registration. Please try again, or email hello@wattmatch.in.');
    }
  }

  return (
    <div className="register-page">
      <Seo
        title="Register as a generator"
        description="Register your renewable energy plant with Wattmatch and get matched with vetted C&I buyers."
        path="/renewablesGenerator"
      />
      <Header minimal />
      <main>
        <div className="wrap">
          <div className="register-hero">
            <span className="eyebrow">Generator registration</span>
            <h1>Register as a generator</h1>
            <p>Tell us about your plant. Our team runs a technical and financial check and will be in touch.</p>
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
                <h3>Plant &amp; contact details</h3>
                <p className="sub">Full details help us match you with the right demand faster.</p>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="genRegName">Full name</label>
                    <input id="genRegName" name="name" required type="text" maxLength={255} defaultValue={form.name} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label htmlFor="genRegCompany">Company</label>
                    <input id="genRegCompany" name="company" required type="text" maxLength={255} defaultValue={form.company} placeholder="Company name" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="genRegEmail">Work email</label>
                    <input id="genRegEmail" name="email" required type="email" maxLength={255} defaultValue={form.email} placeholder="you@company.com" />
                  </div>
                  <div className="field">
                    <label htmlFor="genRegPhone">Phone</label>
                    <input
                      id="genRegPhone" name="phone" required type="tel" inputMode="tel"
                      defaultValue={form.phone} placeholder="Phone number" maxLength={20}
                      onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+\-\s()]/g, ''); }}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="genRegState">Primary state of operation</label>
                    <select id="genRegState" name="state" required defaultValue={form.state}>
                      <option value="" disabled>Select state</option>
                      {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="genRegCapacity">Installed capacity (MW)</label>
                    <input id="genRegCapacity" name="capacity" required type="number" min="0.1" step="0.1" defaultValue={form.capacity} onWheel={(e) => e.currentTarget.blur()} />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="genRegSite">Plant/site location</label>
                    <input id="genRegSite" name="siteLocation" required type="text" maxLength={255} defaultValue={form.siteLocation} placeholder="City, district" />
                  </div>
                  <div className="field">
                    <label htmlFor="genRegTimeline">Commissioning timeline</label>
                    <input id="genRegTimeline" name="commissioningTimeline" required type="text" maxLength={255} defaultValue={form.commissioningTimeline} placeholder="e.g. Operational, or 6 months" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="genRegCert">Certifications</label>
                  <input id="genRegCert" name="certifications" required type="text" maxLength={255} defaultValue={form.certifications} placeholder="e.g. ISO 9001, grid compliance certificates" />
                </div>
                <div className="field">
                  <label htmlFor="genRegMsg">Anything else?</label>
                  <textarea id="genRegMsg" name="message" maxLength={2000} defaultValue={form.message} placeholder="Track record, commissioning timeline, certifications..." />
                </div>
                <button type="submit" className="btn btn-copper">
                  Continue to review <span className="btn-arrow">→</span>
                </button>
              </form>
            )}

            {step === 'review' && (
              <div>
                <h3>Review &amp; submit</h3>
                <p className="sub">Confirm your details to submit. We'll email you a confirmation once it's received.</p>
                <ul className="register-review-list">
                  <li><strong>Name:</strong> {form.name}</li>
                  <li><strong>Company:</strong> {form.company}</li>
                  <li><strong>Email:</strong> {form.email}</li>
                  <li><strong>Phone:</strong> {form.phone}</li>
                  <li><strong>State:</strong> {form.state}</li>
                  <li><strong>Installed capacity:</strong> {form.capacity} MW</li>
                  <li><strong>Site location:</strong> {form.siteLocation}</li>
                  <li><strong>Commissioning timeline:</strong> {form.commissioningTimeline}</li>
                  <li><strong>Certifications:</strong> {form.certifications}</li>
                  {form.message && <li><strong>Message:</strong> {form.message}</li>}
                </ul>
                <button type="button" className="btn btn-copper" disabled={submitting} onClick={handleFinalSubmit}>
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
                <p>We've sent a confirmation to your email. Our team will begin the vetting process and be in touch soon.</p>
              </div>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
