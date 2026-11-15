// Door Travel: Stripe webhook. Grants a 7-day pass when a Payment Link checkout is paid.
// The Payment Link is opened with ?client_reference_id=<supabase user id>.
import { adminClient, envInt, json } from '../_shared/http.ts';

const TOLERANCE_SEC = 300;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Verifies the Stripe-Signature header (t=...,v1=...) against the raw body. */
export async function verifyStripeSignature(raw: string, header: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find((p) => p[0] === 't')?.[1];
  const sigs = parts.filter((p) => p[0] === 'v1').map((p) => p[1]);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(nowSec - Number(t)) > TOLERANCE_SEC) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${raw}`)));
  return sigs.some((s) => safeEqual(s, expected));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'not_configured' }, 500);

  const raw = await req.text();
  const ok = await verifyStripeSignature(raw, req.headers.get('Stripe-Signature') ?? '', secret);
  if (!ok) return json({ error: 'bad_signature' }, 400);

  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: 'bad_request' }, 400); }

  const type = String(event?.type ?? '');
  if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
    return json({ received: true, ignored: type });
  }
  const s = event?.data?.object ?? {};
  if (s.payment_status !== 'paid') return json({ received: true, ignored: 'not_paid' });

  // Optional guard: only grant for our own Payment Link (the account may sell other things).
  const linkId = Deno.env.get('STRIPE_PAYMENT_LINK_ID');
  if (linkId && s.payment_link !== linkId) return json({ received: true, ignored: 'other_link' });

  const userId = String(s.client_reference_id ?? '');
  if (!UUID.test(userId) || !s.id) {
    console.error('paid session without usable client_reference_id', s.id);
    return json({ received: true, ignored: 'no_user' });
  }

  const admin = adminClient();
  const { data, error } = await admin.rpc('grant_pass', { p_user: userId, p_days: envInt('PASS_DAYS', 7), p_ref: String(s.id), p_source: 'stripe' });
  if (error) { console.error('grant_pass failed', error.message); return json({ error: 'server_error' }, 500); } // Stripe will retry
  if (data && data.reason === 'unknown_user') console.error('paid session for unknown user', s.id);
  return json({ received: true, result: data });
});
