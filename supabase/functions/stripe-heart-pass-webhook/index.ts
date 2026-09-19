import { createClient } from 'npm:@supabase/supabase-js@2';

const encoder = new TextEncoder();
const asHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const safelyEqual = (a: string, b: string) => a.length === b.length && a.split('').every((character, index) => character === b[index]);

async function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const timestamp = signature.split(',').find((part) => part.startsWith('t='))?.slice(2);
  const expected = signature.split(',').filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || expected.length === 0) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = asHex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`)));
  return expected.some((candidate) => safelyEqual(candidate, digest));
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!signingSecret || !supabaseUrl || !serviceRoleKey) return new Response('Webhook is not configured', { status: 500 });
  if (!await verifyStripeSignature(payload, signature, signingSecret)) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(payload);
  if (event.type !== 'checkout.session.completed' || event.data?.object?.payment_status !== 'paid') return new Response('ignored', { status: 200 });
  const session = event.data.object;
  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  const userId = session.metadata?.user_id;
  if (!orderId || !userId || !session.id) return new Response('Missing order metadata', { status: 400 });

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: order, error: orderError } = await admin.from('payment_orders').select('id,user_id,product_sku,status').eq('id', orderId).eq('user_id', userId).single();
  if (orderError || !order) return new Response('Order not found', { status: 404 });
  if (order.status === 'paid') return new Response('already processed', { status: 200 });
  const { data: product, error: productError } = await admin.from('heart_pass_products').select('duration_hours').eq('sku', order.product_sku).single();
  if (productError || !product) return new Response('Product not found', { status: 404 });

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + product.duration_hours * 60 * 60 * 1000);
  const { error: paymentError } = await admin.from('payment_orders').update({ status: 'paid', provider_checkout_id: session.id, paid_at: startsAt.toISOString() }).eq('id', order.id).eq('status', 'pending');
  if (paymentError) return new Response('Payment update failed', { status: 500 });
  const { error: entitlementError } = await admin.from('heart_entitlements').insert({ user_id: order.user_id, product_sku: order.product_sku, payment_order_id: order.id, source: 'stripe', starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() });
  if (entitlementError) return new Response('Entitlement update failed', { status: 500 });
  await admin.from('learning_progress').update({ hearts: 5, daily_heart_grant_date: startsAt.toISOString().slice(0, 10) }).eq('user_id', order.user_id);
  await admin.from('heart_events').insert({ user_id: order.user_id, event_key: `pass:${order.id}`, event_type: 'pass_activated', change: 0, hearts_after: 5 });
  return new Response('ok', { status: 200 });
});
