/**
 * Deno-side copy of src/lib/privacy/crypto.ts.
 *
 * Edge Functions are deployed in isolation and cannot import from src/, so this
 * file is a deliberate duplicate. It uses only Web Crypto, so the two copies are
 * byte-compatible: an index or hash produced by one verifies under the other.
 *
 * If you change one, change both. scripts/privacy/check-crypto-parity.mjs
 * asserts they stay in sync.
 */

const ENC = new TextEncoder();
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

export type NormalisedPhone = { ok: true; msisdn: string } | { ok: false; reason: string };

export function normaliseMsisdn(input: string | null | undefined): NormalisedPhone {
  if (input == null) return { ok: false, reason: 'null' };
  let d = String(input).replace(/\D/g, '');
  if (!d) return { ok: false, reason: 'no digits' };

  d = d.replace(/^0+(?=254)/, '');
  if (d.startsWith('254')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);

  if (d.length !== 9) return { ok: false, reason: `${d.length} subscriber digits, expected 9` };
  if (!/^[71]/.test(d)) return { ok: false, reason: `invalid prefix ${d[0]}` };

  return { ok: true, msisdn: `+254${d}` };
}

export async function blindIndex(value: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', ENC.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return hex(await crypto.subtle.sign('HMAC', key, ENC.encode(value)));
}

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

export async function hashSecret(secret: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const peppered = await pepperSecret(secret, pepper);
  const hash = await derive(peppered, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${b64(salt)}$${hash}`;
}

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

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function deriveHandle(accountId: string, roleOrRegion: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', ENC.encode(accountId));
  const bytes = new Uint8Array(digest);
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += ALPHABET[bytes[i] % ALPHABET.length];
  const prefix = String(roleOrRegion || 'USER')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'USER';
  return `${prefix}-${suffix}`;
}

/** Salted hash of a client IP, so rate-limit records hold no network identifier. */
export async function hashIp(ip: string, pepper: string): Promise<string> {
  return (await blindIndex(`ip:${ip}`, pepper)).slice(0, 32);
}

/**
 * Decrypts a sealed identifier from a *_ct column.
 *
 * Layout: base64( iv[12] || gcmTag[16] || ciphertext ), AES-256-GCM, with the
 * key derived from the pepper. Must stay byte-compatible with the sealing
 * routine in scripts (Node crypto) - both derive the key the same way.
 *
 * The database cannot perform this operation: the pepper is not stored there.
 * Plaintext therefore exists only inside an authenticated request.
 */
export async function unsealPii(sealed: string | null, pepper: string): Promise<string | null> {
  if (!sealed) return null;
  try {
    const raw = Uint8Array.from(atob(sealed), ch => ch.charCodeAt(0));
    if (raw.length < 29) return null;

    const keyBytes = await crypto.subtle.digest('SHA-256', ENC.encode(`${pepper}|pii-encryption-v1`));
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);

    // Web Crypto expects the tag appended to the ciphertext; the stored layout
    // puts it in front, so reassemble before decrypting.
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const body = raw.subarray(28);
    const joined = new Uint8Array(body.length + tag.length);
    joined.set(body, 0);
    joined.set(tag, body.length);

    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, joined);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** Mints a Supabase-compatible HS256 JWT so RLS can use auth.uid(). */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds, aud: 'authenticated', role: 'authenticated' };
  const b64url = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const head = b64url({ alg: 'HS256', typ: 'JWT' });
  const data = `${head}.${b64url(body)}`;
  const key = await crypto.subtle.importKey(
    'raw', ENC.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, ENC.encode(data));
  const sigB64 = b64(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sigB64}`;
}

/** Claims carried by a token minted by signJwt via se-login. */
export interface SessionClaims {
  /** identities.id of the authenticated caller. */
  sub: string;
  /** Pseudonymous handle. Never a phone number or a name. */
  handle?: string;
  /** Application role, for example 'sales_executive'. */
  app_role?: string;
  exp: number;
  iat: number;
  aud: string;
  role: string;
}

/**
 * Verifies an HS256 token minted by signJwt and returns its claims, or null.
 *
 * Counterpart to signJwt. Use this, never a decode-without-verify: splitting a
 * JWT on '.' and JSON-parsing the middle segment reads attacker-controlled data
 * and is not authentication.
 *
 * Returns null on any failure, deliberately without saying which. Callers must
 * treat null as 401 and must not surface the reason, so that the endpoint
 * cannot be used to distinguish an expired token from a forged one.
 *
 * Signature comparison uses crypto.subtle.verify, which is constant time.
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<SessionClaims | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [head64, body64, sig64] = parts;

    const fromB64url = (s: string) => {
      const pad = s.replace(/-/g, '+').replace(/_/g, '/');
      return pad + '='.repeat((4 - (pad.length % 4)) % 4);
    };

    const header = JSON.parse(atob(fromB64url(head64)));
    // Reject anything that is not HS256. Without this check a token with
    // {"alg":"none"} and no signature would reach the comparison below.
    if (header?.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
      'raw', ENC.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    );
    const sigBytes = Uint8Array.from(atob(fromB64url(sig64)), (ch) => ch.charCodeAt(0));
    const ok = await crypto.subtle.verify(
      'HMAC', key, sigBytes, ENC.encode(`${head64}.${body64}`),
    );
    if (!ok) return null;

    const claims = JSON.parse(atob(fromB64url(body64))) as SessionClaims;

    // Signature valid does not mean usable. Check expiry and audience too.
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
    if (claims.aud !== 'authenticated' || claims.role !== 'authenticated') return null;
    if (typeof claims.sub !== 'string' || claims.sub.length === 0) return null;

    return claims;
  } catch {
    return null;
  }
}
