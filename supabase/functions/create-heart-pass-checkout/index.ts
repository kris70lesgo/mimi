import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey) throw new Error('Heart-pass checkout is not configured yet.');

    const authorization = request.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: 'Sign in to purchase unlimited hearts.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: product, error: productError } = await admin.from('heart_pass_products').select('sku,title,duration_hours,amount_cents,currency').eq('sku', 'unlimited-hearts-day').eq('active', true).single();
    if (productError || !product) throw new Error('The heart pass is unavailable.');

    const { data: order, error: orderError } = await admin.from('payment_orders').insert({ user_id: user.id, product_sku: product.sku, provider: 'stripe', amount_cents: product.amount_cents, currency: product.currency }).select('id').single();
    if (orderError || !order) throw new Error('Unable to create a payment order.');

    const origin = request.headers.get('origin') ?? 'http://localhost:3016';
    const checkout = new URLSearchParams({
      mode: 'payment', success_url: `${origin}/?heart-pass=success`, cancel_url: `${origin}/?heart-pass=cancelled`,
      client_reference_id: order.id, 'metadata[order_id]': order.id, 'metadata[user_id]': user.id,
      'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': product.currency,
      'line_items[0][price_data][unit_amount]': String(product.amount_cents),
      'line_items[0][price_data][product_data][name]': product.title,
      'line_items[0][price_data][product_data][description]': `${product.duration_hours} hours of unlimited Mimi practice hearts`,
    });
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: checkout });
    const stripeBody = await stripeResponse.json();
    if (!stripeResponse.ok || !stripeBody.url || !stripeBody.id) throw new Error(stripeBody.error?.message ?? 'Stripe could not create checkout.');

    const { error: updateError } = await admin.from('payment_orders').update({ provider_checkout_id: stripeBody.id }).eq('id', order.id);
    if (updateError) throw new Error('Unable to finalize the payment order.');
    return new Response(JSON.stringify({ url: stripeBody.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Checkout failed.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
