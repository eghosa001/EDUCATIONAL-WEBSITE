import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigins = (Deno.env.get('PAYMENT_ALLOWED_ORIGINS') || '').split(',').map((x) => x.trim()).filter(Boolean);
const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowed = origin && (configuredOrigins.length === 0 || configuredOrigins.includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : (configuredOrigins.length === 0 ? '*' : configuredOrigins[0]),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};
const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json' } });
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 32 * 1024) return json(request, { error: 'Request body is too large' }, 413);

    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const auth = request.headers.get('Authorization');
    if (!url || !anon || !service) return json(request, { error: 'Payment service configuration is incomplete' }, 500);
    if (!auth?.startsWith('Bearer ')) return json(request, { error: 'Authentication required' }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, service);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(request, { error: 'Authentication required' }, 401);

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(request, { error: 'Invalid request body' }, 400);
    const action = String(body.action || '');

    if (action === 'create-subscription') {
      if (!uuid(body.planId)) return json(request, { error: 'Invalid planId' }, 400);
      const { data: plan, error: planError } = await admin.from('subscription_plans').select('id,name,price,currency,duration_days,is_active').eq('id', body.planId).eq('is_active', true).maybeSingle();
      if (planError || !plan) return json(request, { error: 'Subscription plan not found' }, 404);
      const { data: existing } = await admin.from('subscriptions').select('id,status').eq('user_id', user.id).in('status', ['active', 'trialing']).maybeSingle();
      if (existing) return json(request, { error: 'You already have an active subscription' }, 409);

      const price = Number(plan.price || 0);
      if (!Number.isFinite(price) || price < 0) return json(request, { error: 'Invalid subscription price' }, 500);

      // A paid plan is never activated by this endpoint. The payment gateway must
      // create a payment and the verified webhook will activate the subscription.
      if (price > 0) return json(request, {
        paymentRequired: true,
        plan: { id: plan.id, name: plan.name, amount: price, currency: plan.currency || 'NGN', durationDays: Number(plan.duration_days || 0) },
      });

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Number(plan.duration_days || 0));
      const { data: subscription, error } = await admin.from('subscriptions').insert({
        user_id: user.id, plan_id: plan.id, gateway: 'free', gateway_subscription_id: null,
        status: 'active', current_period_start: start.toISOString(), current_period_end: end.toISOString(), cancel_at_period_end: false,
      }).select().single();
      if (error) return json(request, { error: 'Unable to create subscription' }, 400);
      return json(request, { subscription, paymentRequired: false });
    }

    if (action === 'cancel-subscription') {
      if (!uuid(body.subscriptionId)) return json(request, { error: 'Invalid subscriptionId' }, 400);
      // Cancellation is scheduled. Do not revoke already-paid access immediately.
      const { data, error } = await admin.from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', body.subscriptionId).eq('user_id', user.id).in('status', ['active', 'trialing']).select().maybeSingle();
      if (error || !data) return json(request, { error: error?.message || 'Subscription not found' }, 404);
      return json(request, { subscription: data });
    }

    if (action === 'resume-subscription') {
      if (!uuid(body.subscriptionId)) return json(request, { error: 'Invalid subscriptionId' }, 400);
      const { data: current, error: readError } = await admin.from('subscriptions').select('*').eq('id', body.subscriptionId).eq('user_id', user.id).maybeSingle();
      if (readError || !current) return json(request, { error: readError?.message || 'Subscription not found' }, 404);
      if (!['active', 'trialing'].includes(current.status)) return json(request, { error: 'Only an active subscription can be resumed' }, 400);
      if (!current.cancel_at_period_end) return json(request, { subscription: current });
      const { data, error } = await admin.from('subscriptions').update({ cancel_at_period_end: false, canceled_at: null }).eq('id', current.id).select().single();
      if (error) return json(request, { error: 'Unable to resume subscription' }, 400);
      return json(request, { subscription: data });
    }

    if (action === 'validate-coupon') {
      const code = String(body.couponCode || '').trim().toUpperCase().slice(0, 100);
      if (!code || !uuid(body.planId)) return json(request, { error: 'couponCode and planId are required' }, 400);
      const { data: coupon, error } = await admin.from('coupons').select('id,code,discount_type,discount_value,max_discount_amount,valid_from,valid_until,is_active').eq('code', code).eq('is_active', true).maybeSingle();
      if (error || !coupon) return json(request, { error: 'Invalid coupon code' }, 400);
      const { data: plan } = await admin.from('subscription_plans').select('id,price,currency').eq('id', body.planId).eq('is_active', true).maybeSingle();
      if (!plan) return json(request, { error: 'Plan not found' }, 404);
      const now = Date.now();
      if (coupon.valid_from && now < new Date(coupon.valid_from).getTime()) return json(request, { error: 'Coupon is not yet valid' }, 400);
      if (coupon.valid_until && now > new Date(coupon.valid_until).getTime()) return json(request, { error: 'Coupon has expired' }, 400);
      const price = Number(plan.price || 0);
      let discount = coupon.discount_type === 'percentage' ? price * Number(coupon.discount_value || 0) / 100 : Number(coupon.discount_value || 0);
      if (!Number.isFinite(discount) || discount < 0) return json(request, { error: 'Invalid coupon configuration' }, 400);
      if (coupon.max_discount_amount != null) discount = Math.min(discount, Number(coupon.max_discount_amount));
      discount = Math.min(discount, price);
      return json(request, { coupon: { id: coupon.id, code: coupon.code }, discountAmount: discount, finalAmount: price - discount, currency: plan.currency || 'NGN' });
    }

    return json(request, { error: 'Unsupported payment action' }, 400);
  } catch (error) {
    console.error('Payment operation failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Payment operation failed' }, 500);
  }
});
