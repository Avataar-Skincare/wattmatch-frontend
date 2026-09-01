// Lightweight client-side mirrors of the backend's validators (wattmatch-server/src/lib/validators.ts)
// — not byte-for-byte identical (the backend does a full libphonenumber-js parse; this is a regex
// approximation), but enough to catch the same obviously-invalid input before a round trip, so a
// user gets an immediate, field-specific message instead of a generic failure after submitting.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Accepts a 10-digit Indian mobile number (starting 6-9), optionally prefixed with +91, 91, or a
// leading 0 — rejects short/garbled input like "123" or "0000000000".
const INDIAN_MOBILE_RE = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-()]/g, '');
  return INDIAN_MOBILE_RE.test(digits);
}
