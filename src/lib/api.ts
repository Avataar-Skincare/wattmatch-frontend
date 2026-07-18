const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

async function submit(path: string, payload: unknown): Promise<boolean> {
  if (!API_BASE) return true; // No backend configured — form succeeds locally (standalone demo mode).
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`API ${path} responded with ${res.status}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`API ${path} request failed:`, err);
    return false;
  }
}

export function submitCILead(payload: unknown) {
  return submit('/api/leads/ci', payload);
}

export function submitGeneratorLead(payload: unknown) {
  return submit('/api/leads/generator', payload);
}

export function submitContact(payload: unknown) {
  return submit('/api/contact', payload);
}
