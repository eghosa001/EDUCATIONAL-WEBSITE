import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const auth = request.headers.get('Authorization');
    if (!url || !anon || !service) return json({ error: 'Payment function configuration is incomplete' }, 500);
    if (!auth) return json({ error: 'Authentication required' }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, service);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Authentication required' }, 401);

    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'create-subscription') {
      const { data: plan, error: planError } = await admin.from('subscription_plans').select('*').eq('id', body.planId).eq('is_active', true).maybeSingle();
      if (planError || !plan) return json({ error: 'Subscription plan not found' }, 404);
      const { data: existing } = await admin.from('subscriptions').select('*').eq('user_id', user.id).in('status', ['active', 'trialing']).maybeSingle();
      if (existing) return json({ error: 'You already have an active subscription' }, 409);

      const start = new Date();
      const end = new Date(start); end.setDate(end.getDate() + Number(plan.duration_days || 0));
      const status = Number(plan.price || 0) === 0 ? 'active' : 'trialing';
      const { data: subscription, error } = await admin.from('subscriptions').insert({ user_id: user.id, plan_id: plan.id, gateway: body.gateway || 'pending', gateway_subscription_id: null, status, current_period_start: start.toISOString(), current_period_end: end.toISOString(), cancel_at_period_end: false }).select().single();
      if (error) return json({ error: error.message }, 400);
      if (Number(plan.price || 0) > 0) return json({ subscription, paymentRequired: true, amount: Number(plan.price), currency: plan.currency || 'NGN' });
      return json({ subscription, paymentRequired: false });
    }

    if (action === 'cancel-subscription') {
      const { data, error } = await admin.from('subscriptions').update({ cancel_at_period_end: true, status: 'cancelled', canceled_at: new Date().toISOString() }).eq('id', body.subscriptionId).eq('user_id', user.id).in('status', ['active', 'trialing']).select().maybeSingle();
      if (error || !data) return json({ error: error?.message || 'Subscription not found' }, 404);
      return json({ subscription: data });
    }

    if (action === 'resume-subscription') {
      const { data: current, error: readError } = await admin.from('subscriptions').select('*, subscription_plans(*)').eq('id', body.subscriptionId).eq('user_id', user.id).maybeSingle();
      if (readError || !current) return json({ error: readError?.message || 'Subscription not found' }, 404);
      const plan = current.subscription_plans;
      if (!plan || !plan.is_active) return json({ error: 'Subscription plan is no longer available' }, 400);
      const start = new Date(); const end = new Date(start); end.setDate(end.getDate() + Number(plan.duration_days || 0));
      const { data, error } = await admin.from('subscriptions').update({ cancel_at_period_end: false, status: 'active', current_period_start: start.toISOString(), current_period_end: end.toISOString(), canceled_at: null }).eq('id', current.id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ subscription: data });
    }

    if (action === 'validate-coupon') {
      const code = String(body.couponCode || '').trim().toUpperCase();
      const { data: coupon, error } = await admin.from('coupons').select('*').eq('code', code).eq('is_active', true).maybeSingle();
      if (error || !coupon) return json({ error: 'Invalid coupon code' }, 400);
      const { data: plan } = await admin.from('subscription_plans').select('*').eq('id', body.planId).maybeSingle();
      if (!plan) return json({ error: 'Plan not found' }, 404);
      const now = Date.now();
      if (coupon.valid_from && now < new Date(coupon.valid_from).getTime()) return json({ error: 'Coupon is not yet valid' }, 400);
      if (coupon.valid_until && now > new Date(coupon.valid_until).getTime()) return json({ error: 'Coupon has expired' }, 400);
      let discount = coupon.discount_type === 'percentage' ? Number(plan.price || 0) * Number(coupon.discount_value || 0) / 100 : Number(coupon.discount_value || 0);
      if (coupon.max_discount_amount != null) discount = Math.min(discount, Number(coupon.max_discount_amount));
      discount = Math.min(discount, Number(plan.price || 0));
      return json({ coupon, discountAmount: discount, finalAmount: Number(plan.price || 0) - discount });
    }

    return json({ error: `Unsupported payment action: ${action}` }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Payment operation failed' }, 500);
  }
});
