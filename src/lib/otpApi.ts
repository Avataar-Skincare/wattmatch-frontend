const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

export type OtpChannel = 'email' | 'phone';

interface OtpResult {
  ok: boolean;
  error?: string;
}

async function postOtp(path: string, payload: unknown): Promise<OtpResult> {
  if (!API_BASE) return { ok: true }; // No backend configured — OTP step succeeds locally (standalone demo mode).
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

export function sendOtp(channel: OtpChannel, identifier: string) {
  return postOtp('/api/otp/send', { channel, identifier });
}

export function verifyOtp(channel: OtpChannel, identifier: string, otp: string) {
  return postOtp('/api/otp/verify', { channel, identifier, otp });
}
