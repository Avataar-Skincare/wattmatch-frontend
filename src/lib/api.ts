const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

if (!API_BASE && import.meta.env.PROD) {
  // Not a functional guard (the standalone-demo-mode fallback below is intentional and documented
  // in .env.example) — just a heads-up in case this is unset by accident in a real deployment,
  // where it would otherwise silently report success without ever reaching the backend.
  console.warn(
    '[api] VITE_API_URL is not set in a production build — contact/lead/registration forms will report success without actually reaching the backend (standalone demo mode).'
  );
}

export interface SubmitResult {
  ok: boolean;
  // Present when the backend rejected the request with a specific, user-facing reason (e.g. the
  // validation messages contact.ts/registrations.ts return on a 400) — absent on a network failure
  // or a non-JSON error body, where there's nothing specific to show.
  error?: string;
}

async function submit(path: string, payload: unknown): Promise<SubmitResult> {
  if (!API_BASE) return { ok: true }; // No backend configured: form succeeds locally (standalone demo mode).
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`API ${path} responded with ${res.status}:`, text);
      let error: string | undefined;
      try {
        const parsed = JSON.parse(text) as { error?: unknown };
        if (typeof parsed.error === 'string') error = parsed.error;
      } catch {
        // Non-JSON error body (e.g. an infra-level gateway page) — nothing specific to surface.
      }
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.error(`API ${path} request failed:`, err);
    return { ok: false };
  }
}

export function submitContact(payload: unknown) {
  return submit('/api/contact', payload);
}

export function submitGeneratorRegistration(payload: unknown) {
  return submit('/api/registrations/generator', payload);
}

export function submitCiRegistration(payload: unknown) {
  return submit('/api/registrations/ci', payload);
}
