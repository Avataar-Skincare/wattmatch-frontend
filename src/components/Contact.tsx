import { useState, type FormEvent } from 'react';
import { submitContact } from '../lib/api';
import type { ContactFormData } from '../types/forms';

export default function Contact({
  hideHeading = false,
  eyebrow = 'Get in touch',
  heading = "Let's talk",
  body = "Questions about the marketplace, a partnership, or press? Leave your email and we'll get back to you.",
}: {
  hideHeading?: boolean;
  eyebrow?: string;
  heading?: string;
  body?: string;
}) {
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
        {!hideHeading && (
          <>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{heading}</h2>
            {body && <p>{body}</p>}
          </>
        )}
        <form id="contactForm" onSubmit={handleSubmit}>
          <div className="email-box">
            <input type="email" id="contactEmail" name="email" required placeholder="you@company.com" />
            <button type="submit" className="btn btn-solar">Get in touch</button>
          </div>
        </form>
        <p className={`contact-success${sent ? ' show' : ''}`} id="contactSuccess">Message sent: we'll get back to you shortly.</p>
        {error && <p className="form-error">Something went wrong. Please try again, or email hello@wattmatch.in directly.</p>}
        <p className="contact-alt">or write to us directly at <a href="mailto:hello@wattmatch.in">hello@wattmatch.in</a></p>
      </div>
    </section>
  );
}
