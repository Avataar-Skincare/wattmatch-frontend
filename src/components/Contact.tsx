import { useState, type FormEvent } from 'react';
import { submitContact } from '../lib/api';
import type { ContactFormData } from '../types/forms';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: ContactFormData = { email: String(data.get('email') ?? '') };
    setError(false);
    const ok = await submitContact(payload);
    if (ok) {
      setSent(true);
      form.reset();
    } else {
      setError(true);
    }
  }

  return (
    <section id="contact" className="contact">
      <div className="wrap">
        <span className="eyebrow">Get in touch</span>
        <h2>Let's talk</h2>
        <p>Questions about the platform, a partnership, or press? Leave your email and we'll get back to you.</p>
        <form id="contactForm" onSubmit={handleSubmit}>
          <div className="email-box">
            <input type="email" id="contactEmail" name="email" required placeholder="you@company.com" />
            <button type="submit" className="btn btn-solar">Get in touch</button>
          </div>
        </form>
        <p className={`contact-success${sent ? ' show' : ''}`} id="contactSuccess">Thanks — we'll be in touch shortly.</p>
        {error && <p className="form-error">Something went wrong. Please try again, or email hello@wattmatch.in directly.</p>}
        <p className="contact-alt">or write to us directly at <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a></p>
      </div>
    </section>
  );
}
