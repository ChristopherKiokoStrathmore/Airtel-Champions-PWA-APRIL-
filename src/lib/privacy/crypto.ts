/**
 * Zero-PII identity primitives.
 *
 * Design contract - read before changing anything here:
 *
 *   1. The PEPPER never enters Postgres. It lives in the process environment
 *      (Vercel / Edge Function secrets). The database therefore holds no key
 *      material and a full database dump yields nothing reversible.
 *
 *   2. A phone number is never stored. It is converted to a blind index
 *      - HMAC-SHA256(normalised_msisdn, PEPPER) - which supports exact-match
 *      lookup for login but cannot be inverted without the pepper.
 *
 *   3. A PIN is peppered BEFORE key derivation. A 4-digit PIN has only 10,000
 *      possible values, so a KDF alone cannot protect it: an attacker holding
 *      the table would recover every PIN regardless of cost factor. Peppering
 *      first means offline attack is infeasible without the external secret.
 *
 *   4. PBKDF2-HMAC-SHA256 is used rather than Argon2id because it is native to
 *      Web Crypto and therefore identical in Deno (Edge Functions), Node, and
 *      the browser - no native module, no wasm, no build step. With the pepper
 *      carrying the real security burden, OWASP-recommended PBKDF2 iterations
 *      are more than sufficient here.
 *
 * Everything in this module runs server-side only. The pepper must never be
 * exposed to a VITE_-prefixed variable, which would ship it to the browser.
 */

const ENC = new TextEncoder();

/** OWASP 2023 guidance for PBKDF2-HMAC-SHA256. */
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Reads the pepper, failing loudly rather than silently degrading security. */
export function getPepper(env?: Record<string, string | undefined>): string {
  const source = env ?? (globalThis as any).process?.env ?? {};
  const pepper = source.PRIVACY_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error(
      'PRIVACY_PEPPER missing or too short. Identity operations cannot proceed. ' +
      'It must be a >=32-char secret held outside the database.'
    );
  }
  return pepper;
}

export type NormalisedPhone = { ok: true; msisdn: string } | { ok: false; reason: string };

/**
 * Normalise a Kenyan MSISDN to canonical +2547XXXXXXXX / +2541XXXXXXXX form.
 *
 * The live data contains 8-, 9-, 10-, 11- and 12-digit variants plus stray
 * whitespace, so this is deliberately strict: anything it cannot map with
 * confidence is rejected rather than guessed, and the caller decides what to do.
 */
export function normaliseMsisdn(input: string | null | undefined): NormalisedPhone {
  if (input == null) return { ok: false, reason: 'null' };
  let d = String(input).replace(/\D/g, '');
  if (!d) return { ok: false, reason: 'no digits' };

  d = d.replace(/^0+(?=254)/, '');            // 0254... -> 254...
  if (d.startsWith('254')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);

  // Kenyan subscriber numbers are 9 digits beginning 7 (mobile) or 1 (newer ranges).
  if (d.length !== 9) return { ok: false, reason: `${d.length} subscriber digits, expected 9` };
  if (!/^[71]/.test(d)) return { ok: false, reason: `invalid prefix ${d[0]}` };

  return { ok: true, msisdn: `+254${d}` };
}

/**
 * Blind index for exact-match lookup without storing the identifier.
 * Same input + same pepper always yields the same output, so it can be a
 * UNIQUE column and a join key.
 */
export async function blindIndex(value: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', ENC.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return hex(await crypto.subtle.sign('HMAC', key, ENC.encode(value)));
}

/** Peppers a secret before it reaches the KDF. See contract note 3. */
async function pepperSecret(secret: string, pepper: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', ENC.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, ENC.encode(secret)));
}

async function derive(peppered: Uint8Array, salt: Uint8Array, iterations: number): Promise<string> {
  const material = await crypto.subtle.importKey('raw', peppered as unknown as BufferSource, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    material, KEY_BITS
  );
  return b64(bits);
}

/** Produces `pbkdf2$sha256$<iterations>$<salt>$<hash>` - self-describing for future migration. */
export async function hashSecret(secret: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const peppered = await pepperSecret(secret, pepper);
  const hash = await derive(peppered, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${b64(salt)}$${hash}`;
}

/** Constant-time comparison, so verification does not leak via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySecret(secret: string, stored: string, pepper: string): Promise<boolean> {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') return false;
  const iterations = Number(parts[2]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  let salt: Uint8Array;
  try { salt = unb64(parts[3]); } catch { return false; }

  const peppered = await pepperSecret(secret, pepper);
  const candidate = await derive(peppered, salt, iterations);
  return timingSafeEqual(candidate, parts[4]);
}

/**
 * Deterministic non-identifying handle, derived from the account's opaque UUID.
 * Stable across runs, carries no personal data, and is safe to show on
 * leaderboards and other shared surfaces.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 - avoids misreading
export async function deriveHandle(accountId: string, roleOrRegion: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', ENC.encode(accountId));
  const bytes = new Uint8Array(digest);
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += ALPHABET[bytes[i] % ALPHABET.length];
  const prefix = String(roleOrRegion || 'USER')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'USER';
  return `${prefix}-${suffix}`;
}
