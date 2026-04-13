// ============================================================================
// WEB PUSH MODULE — Airtel Champions PWA
// ============================================================================
// Uses npm:web-push for RFC 8291 encrypted payloads (ECDH + HKDF + AES-128-GCM).
// Without proper encryption, push services (FCM/Mozilla) reject with 400.
// Subscriptions are stored in the KV store keyed by userId.
// VAPID keys come from environment secrets.
//
// NOTE: `npm:web-push` is imported DYNAMICALLY so that a failure to load
// this Node-native module doesn't crash the entire edge function at startup.
// ============================================================================

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// ── Lazy-loaded web-push module ─────────────────────────────────────────────
let _webpush: any = null;
let _webpushLoadAttempted = false;

async function getWebPush(): Promise<any> {
  if (_webpush) return _webpush;
  if (_webpushLoadAttempted) return null; // already tried and failed
  _webpushLoadAttempted = true;
  try {
    const mod = await import('npm:web-push@3.6.7');
    _webpush = mod.default ?? mod;
    // Configure VAPID once on first successful load
    configureVapid(_webpush);
    return _webpush;
  } catch (err: any) {
    console.warn('[WebPush] npm:web-push import failed:', err.message);
    return null;
  }
}

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[WebPush] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[WebPush] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

async function safeKvDel(key: string): Promise<boolean> {
  try {
    await kv.del(key);
    return true;
  } catch (err: any) {
    console.warn(`[WebPush] KV del("${key}") failed: ${err.message}.`);
    return false;
  }
}

async function safeKvGetByPrefix(prefix: string): Promise<any[]> {
  try {
    return await kv.getByPrefix(prefix);
  } catch (err: any) {
    console.warn(`[WebPush] KV getByPrefix("${prefix}") failed: ${err.message}. Returning [].`);
    return [];
  }
}

// ── Helper: URL-safe base64 decode to check byte length ─────────────────────
function base64urlByteLength(b64url: string): number {
  // Add padding so atob works
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  try {
    return atob(b64).length;
  } catch {
    return -1;
  }
}

// ── VAPID configuration ──────────────────────────────────────────────────────
// Known VAPID key pair for this application (provided by the developer).
// The env vars have historically been mis-entered (public key stored as private
// key), so we detect the swap and correct it automatically.
const KNOWN_VAPID_PUBLIC  = 'BH12_xOWot8YPv2pY1tkFCp7WUfsOS7wPz0sutPDV-FSgQTpWvEuJZzE4usw19X4Jl1JcFdlI1f_Xd8SdnvkUpU';
const KNOWN_VAPID_PRIVATE = 'ovAqSFFVY0LU-SAbqS3-cfgcj9kA014eXYgZizOAww8';
const VAPID_SUBJECT       = 'mailto:thechrisnguu@gmail.com';

let VAPID_PUBLIC_KEY  = (Deno.env.get('VAPID_PUBLIC_KEY')  ?? '').trim();
let VAPID_PRIVATE_KEY = (Deno.env.get('VAPID_PRIVATE_KEY') ?? '').trim();

// Auto-detect and fix swapped keys
const privBytes = base64urlByteLength(VAPID_PRIVATE_KEY);
if (privBytes !== 32) {
  console.warn(`[WebPush] VAPID_PRIVATE_KEY from env is ${privBytes} bytes (expected 32). Using known correct key pair.`);
  VAPID_PUBLIC_KEY  = KNOWN_VAPID_PUBLIC;
  VAPID_PRIVATE_KEY = KNOWN_VAPID_PRIVATE;
}

let _vapidConfigured = false;

function configureVapid(webpush: any) {
  if (_vapidConfigured || !webpush) return;
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      _vapidConfigured = true;
      console.log('[WebPush] VAPID configured successfully');
    } catch (err: any) {
      console.error('[WebPush] Failed to set VAPID details:', err.message);
    }
  } else {
    console.warn('[WebPush] VAPID keys not configured — push will not work');
  }
}

// Eagerly start loading web-push in the background (non-blocking)
getWebPush().catch(() => {});

// ── KV key helpers ───────────────────────────────────────────────────────────
const subKey = (userId: string) => `push:sub:${userId}`;

// ============================================================================
// TYPES
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

// ============================================================================
// SEND FUNCTION — RFC 8291 encrypted via npm:web-push
// ============================================================================

/** Send a Web Push notification to a single subscription object */
export async function sendWebPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const webpush = await getWebPush();
    if (!webpush) {
      return { ok: false, error: 'web-push module not available' };
    }
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return { ok: false, error: 'VAPID keys not configured on server' };
    }

    const pushPayload = JSON.stringify(payload);

    // npm:web-push handles:
    //  1. VAPID JWT signing (ES256)
    //  2. ECDH key agreement with subscriber's p256dh
    //  3. HKDF key derivation
    //  4. AES-128-GCM payload encryption
    //  5. Proper Content-Encoding: aes128gcm header
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      pushPayload,
      {
        TTL: 86400, // 24 hours
        urgency: 'normal',
      }
    );

    console.log(`[WebPush] Push delivered to ${subscription.endpoint.slice(0, 50)}...`);
    return { ok: true };
  } catch (err: any) {
    const statusCode = err.statusCode || 0;
    const errBody = err.body || err.message;
    console.error(`[WebPush] Push failed (${statusCode}):`, errBody);

    // 410 Gone = subscription expired, caller should clean up
    if (statusCode === 410 || statusCode === 404) {
      return { ok: false, error: `subscription_expired:${statusCode}` };
    }
    return { ok: false, error: `${statusCode}: ${errBody}` };
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/** GET /push/vapid-key — return the public VAPID key to the browser */
app.get('/push/vapid-key', (c) => {
  if (!VAPID_PUBLIC_KEY) {
    return c.json({ error: 'VAPID_PUBLIC_KEY not configured on server' }, 500);
  }
  return c.json({ publicKey: VAPID_PUBLIC_KEY });
});

/** POST /push/subscribe — save a push subscription for a user */
app.post('/push/subscribe', async (c) => {
  try {
    const { userId, subscription } = await c.req.json();
    if (!userId || !subscription?.endpoint) {
      return c.json({ error: 'userId and subscription.endpoint are required' }, 400);
    }

    const saved = await safeKvSet(subKey(userId), JSON.stringify(subscription));
    if (!saved) {
      return c.json({ success: false, error: 'Database temporarily unavailable (KV permission denied)', kvPermissionError: true }, 503);
    }
    console.log(`[WebPush] Subscription saved for user ${userId}`);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[WebPush] Subscribe error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/** DELETE /push/unsubscribe — remove a user's push subscription */
app.delete('/push/unsubscribe', async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'userId required' }, 400);

    await safeKvDel(subKey(userId));
    console.log(`[WebPush] Subscription removed for user ${userId}`);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[WebPush] Unsubscribe error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/** POST /push/send — send a push notification to one user */
app.post('/push/send', async (c) => {
  try {
    const { userId, title, body, url, icon, tag, data } = await c.req.json();
    if (!userId || !title || !body) {
      return c.json({ error: 'userId, title, body required' }, 400);
    }

    const raw = await safeKvGet(subKey(userId));
    if (!raw?.value) {
      return c.json({ success: false, error: 'No subscription found for user (or KV unavailable)' }, 404);
    }

    const subscription: PushSubscriptionData = JSON.parse(raw.value);
    const payload: PushPayload = {
      title, body,
      url:   url   || '/',
      icon:  icon  || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag:   tag   || 'airtel-champions',
      data:  data  || {},
    };

    const result = await sendWebPush(subscription, payload);

    // Clean up expired subscriptions automatically
    if (result.error?.startsWith('subscription_expired')) {
      await safeKvDel(subKey(userId));
      console.log(`[WebPush] Cleaned up expired subscription for user ${userId}`);
    }

    return c.json({ success: result.ok, error: result.error });
  } catch (err: any) {
    console.error('[WebPush] Send error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/** POST /push/broadcast — send to ALL subscribed users */
app.post('/push/broadcast', async (c) => {
  try {
    const { title, body, url, icon, tag, data } = await c.req.json();
    if (!title || !body) {
      return c.json({ error: 'title and body required' }, 400);
    }

    // Fetch all push subscriptions from KV using the prefix
    const allSubs = await safeKvGetByPrefix('push:sub:');
    console.log(`[WebPush] Broadcasting to ${allSubs.length} subscriber(s)`);

    const payload: PushPayload = {
      title, body,
      url:   url  || '/',
      icon:  icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag:   tag  || 'airtel-champions-broadcast',
      data:  data || {},
    };

    let sent = 0, failed = 0;
    const expiredKeys: string[] = [];

    await Promise.all(
      allSubs.map(async (entry: any) => {
        try {
          const subData = typeof entry === 'string' ? entry : entry.value;
          const subKeyStr = typeof entry === 'object' ? entry.key : '';
          const sub: PushSubscriptionData = JSON.parse(subData);
          const res = await sendWebPush(sub, payload);
          if (res.ok) {
            sent++;
          } else {
            failed++;
            // Track expired subscriptions for cleanup
            if (res.error?.startsWith('subscription_expired') && subKeyStr) {
              expiredKeys.push(subKeyStr);
            }
          }
        } catch { failed++; }
      })
    );

    // Clean up expired subscriptions
    for (const key of expiredKeys) {
      try { await safeKvDel(key); } catch {}
    }

    console.log(`[WebPush] Broadcast done — sent:${sent} failed:${failed} expired-cleaned:${expiredKeys.length}`);
    return c.json({ success: true, sent, failed, expiredCleaned: expiredKeys.length });
  } catch (err: any) {
    console.error('[WebPush] Broadcast error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;