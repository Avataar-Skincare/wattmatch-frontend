import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { reconstructAndOpenAll, type SealedEnvelope } from '../lib/vettingCrypto';

// A custodian's own emailed, per-(tender, envelope) link — NOT under DashboardShell, NOT gated by
// any org login at all. The token in the URL is the only credential this page needs (see
// middleware/custodianAuth.ts) — a custodian is not a buyer/generator/admin Organization, they're a
// distinct identity whose real authority comes from holding a genuine key share, not a Wattmatch
// account. Key reconstruction and envelope decryption happen right here, in this browser — see
// lib/vettingCrypto.ts's own comment for why the server never does this any more.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

type PageState = 'loading' | 'invalid-token' | 'not-open-yet' | 'already-completed' | 'ready-to-submit' | 'awaiting-second' | 'submitting' | 'done' | 'error';

interface CeremonyStatus {
  tenderTitle: string;
  envelope: 'technical' | 'financial';
  fingerprint: string;
  scheduledOpenAt: string | null;
  isOpen: boolean;
  alreadyCompleted: boolean;
  youAlreadySubmitted: boolean;
  awaitingSecondCustodian: boolean;
  pendingCount: number;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function CustodianCeremonyPage() {
  // undefined = URL not read yet; null = read, and there genuinely was no ?token= — these must stay
  // distinguishable, since setting state to the same value React already holds (null -> null, for a
  // tokenless URL) is a no-op that would otherwise leave the page stuck on "Loading…" forever.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [status, setStatus] = useState<CeremonyStatus | null>(null);
  const [shareInput, setShareInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openedCount, setOpenedCount] = useState<number | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    setToken(t);
  }, []);

  async function loadStatus(currentToken: string) {
    try {
      const res = await fetch(`${API_BASE}/api/vetting-custodian/ceremony`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPageState('invalid-token');
        return;
      }
      setStatus(data);
      if (data.alreadyCompleted) setPageState('already-completed');
      else if (!data.isOpen) setPageState('not-open-yet');
      else if (data.youAlreadySubmitted) setPageState('awaiting-second');
      else setPageState('ready-to-submit');
    } catch {
      setPageState('error');
      setError('Could not reach the server — check your connection and reload.');
    }
  }

  useEffect(() => {
    if (token === undefined) return;
    if (!token) {
      setPageState('invalid-token');
      return;
    }
    loadStatus(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitShare(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !shareInput.trim()) return;
    setError(null);
    setPageState('submitting');

    try {
      const shareRes = await fetch(`${API_BASE}/api/vetting-custodian/ceremony/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ share: shareInput.trim() }),
      });
      const shareData = await shareRes.json();
      if (!shareRes.ok || !shareData.success) {
        setError(shareData.error || 'Failed to submit your share.');
        setPageState('ready-to-submit');
        return;
      }

      if (shareData.status === 'waiting') {
        setPageState('awaiting-second');
        return;
      }

      // status === 'ready' — this browser is the completing custodian: fetch the sealed
      // submissions and do the actual reconstruction + decryption locally.
      const myShareBytes = base64ToBytes(shareInput.trim());
      const otherShareBytes = base64ToBytes(shareData.otherShare);

      const envelopesRes = await fetch(`${API_BASE}/api/vetting-custodian/ceremony/sealed-envelopes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const envelopesData = await envelopesRes.json();
      if (!envelopesRes.ok || !envelopesData.success) {
        throw new Error(envelopesData.error || 'Failed to load sealed submissions.');
      }

      const opened = await reconstructAndOpenAll(
        [myShareBytes, otherShareBytes],
        envelopesData.envelopes.map((e: { id: number } & SealedEnvelope) => ({
          id: e.id,
          envelope: { wrappedDataKey: e.wrappedDataKey, iv: e.iv, ciphertext: e.ciphertext },
        }))
      );

      const shareFingerprints = [await sha256Hex(myShareBytes), await sha256Hex(otherShareBytes)];

      const completeRes = await fetch(`${API_BASE}/api/vetting-custodian/ceremony/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          openedBidIds: opened.map((o) => o.id),
          opened: opened.map((o) => ({ bidId: o.id, content: o.content })),
          shareFingerprints,
        }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.error || 'Failed to record the ceremony result.');
      }

      setOpenedCount(completeData.openedCount);
      setPageState('done');
    } catch (err) {
      // The server-side escrow deliberately stays in place until /ceremony/complete actually
      // succeeds (see routes/vettingCustodian.ts's own comment) — so a failure here, whether from a
      // dropped connection or a wrong-share decrypt failure, only requires this same custodian to
      // reload and resubmit; the other custodian's original share is untouched and doesn't need to
      // do anything.
      setError(
        (err instanceof Error ? err.message : 'Failed to complete the ceremony.') +
          ' Reload this page and submit your share again — the other custodian does not need to do anything.'
      );
      setPageState('error');
    }
  }

  return (
    <div className="content-page">
      <Seo title="Custodian ceremony" description="Submit your key share to open a sealed bid envelope." path="/custodian-ceremony" />
      <main className="admin-page">
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Wattmatch custodian ceremony</span>
            <h1>{status ? `${status.envelope === 'technical' ? 'Technical' : 'Financial'} bid opening` : 'Custodian ceremony'}</h1>
            {status && <p>{status.tenderTitle}</p>}
          </div>
        </div>

        <section>
          <div className="wrap" style={{ maxWidth: 560 }}>
            {pageState === 'loading' && <p>Loading…</p>}

            {pageState === 'invalid-token' && (
              <p className="admin-alert error">This ceremony link is invalid or has expired. Contact Wattmatch for a fresh one.</p>
            )}

            {pageState === 'not-open-yet' && status && (
              <p className="admin-alert">
                This envelope isn't scheduled to open yet
                {status.scheduledOpenAt ? ` — come back on ${new Date(status.scheduledOpenAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.` : '.'}
              </p>
            )}

            {pageState === 'already-completed' && (
              <p className="admin-alert">This ceremony has already been completed by two other custodians — nothing left to do here.</p>
            )}

            {pageState === 'awaiting-second' && status && (
              <p className="admin-alert">
                Your share has been recorded. Waiting on a second custodian to submit theirs before this envelope can open —
                you don't need to do anything else.
              </p>
            )}

            {(pageState === 'ready-to-submit' || pageState === 'submitting') && status && (
              <div className="admin-card">
                <p className="sub sub-tight">
                  {status.pendingCount} submission{status.pendingCount === 1 ? '' : 's'} waiting to open. Expected key fingerprint:{' '}
                  <code>{status.fingerprint.slice(0, 16)}…</code>
                </p>
                <form onSubmit={submitShare}>
                  <div className="field">
                    <label htmlFor="share">Your key share</label>
                    <textarea
                      id="share"
                      value={shareInput}
                      onChange={(e) => setShareInput(e.target.value)}
                      rows={4}
                      placeholder="Paste your custodian share here"
                      disabled={pageState === 'submitting'}
                      required
                    />
                  </div>
                  {error && <p className="form-error">{error}</p>}
                  <button type="submit" className="btn btn-solar" disabled={pageState === 'submitting' || !shareInput.trim()}>
                    {pageState === 'submitting' ? 'Submitting…' : 'Submit share'}
                  </button>
                </form>
              </div>
            )}

            {pageState === 'done' && (
              <p className="admin-alert">
                Ceremony complete — {openedCount} submission{openedCount === 1 ? '' : 's'} opened. Wattmatch admin can now review and
                decide. You can close this page.
              </p>
            )}

            {pageState === 'error' && <p className="admin-alert error">{error}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
