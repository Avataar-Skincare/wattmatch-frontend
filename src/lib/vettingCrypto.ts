import { combine } from 'shamir-secret-sharing';

// Browser port of the server's src/lib/vettingCrypto.ts (reconstructPrivateKey + openEnvelope) —
// this is the whole point of the custodian ceremony redesign: key reconstruction and envelope
// decryption happen HERE, in the completing custodian's own browser, never on the server. See
// CustodianCeremonyPage.tsx for how this gets called, and routes/vettingCustodian.ts's module
// comment for what the server can and can't independently verify as a result.
//
// Deliberately does NOT replicate the server's fingerprint pre-check (SHA-256 of the reconstructed
// public key's SPKI DER, compared against a known-good value) — Web Crypto has no "derive the public
// key from a private key" operation, so reproducing that exact check would mean hand-parsing ASN.1.
// Not a weaker guarantee in practice: wrong/foreign/corrupted shares either fail to combine, fail to
// import as a valid PKCS8 key, or (if they somehow produce a structurally valid but wrong key) fail
// AES-GCM's authenticated-decryption tag check below — there is no path from wrong shares to a
// plausible-looking wrong plaintext, only a clean failure at one of these three steps.

export interface SealedEnvelope {
  wrappedDataKey: string; // base64, RSA-OAEP-SHA256-wrapped AES-256 data key
  iv: string; // base64, 12 bytes
  ciphertext: string; // base64, AES-256-GCM ciphertext with the 16-byte auth tag appended
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Combines two custodian shares into the RSA private key, then decrypts every given sealed
// envelope with it — one reconstruction, many envelopes, matching the ceremony's "open every
// pending submission at once" shape. Throws a specific, custodian-facing error at whichever step
// actually failed, rather than letting a low-level crypto exception surface as-is.
export async function reconstructAndOpenAll(
  shares: Uint8Array[],
  envelopes: Array<{ id: number; envelope: SealedEnvelope }>
): Promise<Array<{ id: number; content: string }>> {
  let privateKeyDer: Uint8Array;
  try {
    privateKeyDer = await combine(shares);
  } catch {
    throw new Error('Failed to combine the supplied shares — at least one is invalid or malformed.');
  }

  let privateKey: CryptoKey;
  try {
    privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyDer as BufferSource,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  } catch {
    throw new Error('Failed to reconstruct a valid key from the supplied shares — at least one share is wrong, corrupted, or from a different key.');
  }

  const opened: Array<{ id: number; content: string }> = [];
  for (const { id, envelope } of envelopes) {
    try {
      const wrappedDataKey = base64ToBytes(envelope.wrappedDataKey);
      const rawDataKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedDataKey as BufferSource);
      const dataKey = await crypto.subtle.importKey('raw', rawDataKey, 'AES-GCM', false, ['decrypt']);
      const iv = base64ToBytes(envelope.iv);
      // ciphertext already carries the GCM auth tag appended, matching Web Crypto's native
      // encrypt() output shape — no separate tag field to split out on this side either.
      const ciphertext = base64ToBytes(envelope.ciphertext);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, dataKey, ciphertext as BufferSource);
      opened.push({ id, content: new TextDecoder().decode(plaintext) });
    } catch {
      throw new Error(`Failed to decrypt submission #${id} — the reconstructed key does not match this ciphertext.`);
    }
  }
  return opened;
}
