// Browser-side counterpart to wattmatch-server/src/lib/vettingCrypto.ts's sealPayload — see that
// file's comment block for the exact Web Crypto contract this implements. Output shape
// (wrappedDataKey/iv/ciphertext, all base64) must match byte-for-byte what the server's
// openEnvelope() expects; AES-GCM's native ciphertext already carries the auth tag appended, so no
// separate tag field is needed on either side.

export interface SealedEnvelope {
  wrappedDataKey: string;
  iv: string;
  ciphertext: string;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function importRsaPublicKey(publicKeyPem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', pemToDer(publicKeyPem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
    'encrypt',
  ]);
}

export async function sealPayload(publicKeyPem: string, payload: string): Promise<SealedEnvelope> {
  const dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dataKey, new TextEncoder().encode(payload));
  const rawDataKey = await crypto.subtle.exportKey('raw', dataKey);
  const publicKey = await importRsaPublicKey(publicKeyPem);
  const wrappedDataKeyBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawDataKey);

  return {
    wrappedDataKey: bufToBase64(wrappedDataKeyBuf),
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertextBuf),
  };
}
