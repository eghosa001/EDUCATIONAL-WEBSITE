import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigins = (Deno.env.get('PAYMENT_ALLOWED_ORIGINS') || '')
  .split(',').map((x) => x.trim()).filter(Boolean);

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

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json' },
  });

const uuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const safeReference = () =>
  `TG-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

const redirectAllowed = (request: Request, value: unknown) => {
  if (typeof value !== 'string' || !value) return null;
  try {
    const target = new URL(value);
    if (!['http:', 'https:'].includes(target.protocol)) return null;
    const requestOrigin = request.headers.get('Origin');
    const allowedOrigins = configuredOrigins.length
      ? configuredOrigins
      : requestOrigin ? [requestOrigin] : [];
    if (allowedOrigins.length && !allowedOrigins.includes(target.origin)) return null;
    return target.toString();
  } catch {
    return null;
  }
};

const gatewayRows = () => [
  { id: 'paystack', name: 'Paystack', code: 'paystack', isActive: Boolean(Deno.env.get('PAYSTACK_SECRET_KEY')) },
  { id: 'flutterwave', name: 'Flutterwave', code: 'flutterwave', isActive: Boolean(Deno.env.get('FLUTTERWAVE_SECRET_KEY')) },
];

async function activateSubscription(admin: any, userId: string, payment: any) {
  const { data: plan, error: planError } = await admin
    .from('subscription_plans')
    .select('id,duration_days,is_active')
    .eq('id', payment.purpose_id)
    .eq('is_active', true)
    .maybeSingle();
  if (planError || !plan) throw new Error('Subscription plan no longer exists');

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + Number(plan.duration_days || 0));

  const { data: existing, error: existingError } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  let subscription: any;
  if (existing) {
    const result = await admin.from('subscriptions').update({
      plan_id: plan.id,
      gateway_subscription_id: payment.gateway_reference || payment.reference,
      gateway: payment.gateway,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      ended_at: null,
      updated_at: now.toISOString(),
    }).eq('id', existing.id).eq('user_id', userId).select().single();
    if (result.error) throw result.error;
    subscription = result.data;
  } else {
    const result = await admin.from('subscriptions').insert({
      user_id: userId,
      plan_id: plan.id,
      gateway_subscription_id: payment.gateway_reference || payment.reference,
      gateway: payment.gateway,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
    }).select().single();
    if (result.error) throw result.error;
    subscription = result.data;
  }

  const { data: existingInvoice } = await admin
    .from('invoices')
    .select('id')
    .eq('payment_id', payment.id)
    .maybeSingle();

  if (!existingInvoice) {
    await admin.from('invoices').insert({
      invoice_number: `INV-${payment.reference}`,
      user_id: userId,
      subscription_id: subscription.id,
      payment_id: payment.id,
      amount: Number(payment.amount || 0),
      currency: payment.currency || 'NGN',
      tax_amount: 0,
      discount_amount: 0,
      status: 'completed',
      due_date: now.toISOString(),
      paid_at: now.toISOString(),
      metadata: { planId: plan.id, gateway: payment.gateway },
    });
  }

  await admin.from('notifications').insert({
    user_id: userId,
    type: 'payment',
    title: 'Payment successful',
    body: 'Your subscription payment was verified and your plan is active.',
    data: { paymentId: payment.id, planId: plan.id },
    action_url: '/dashboard/subscriptions/billing',
    channel: 'in_app',
    sent_at: now.toISOString(),
  }).catch(() => null);

  return subscription;
}

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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(request, { error: 'Invalid request body' }, 400);
    }
    const action = String((body as any).action || '');

    if (action === 'gateways') {
      return json(request, { gateways: gatewayRows() });
    }

    if (action === 'create-subscription') {
      if (!uuid((body as any).planId)) return json(request, { error: 'Invalid planId' }, 400);
      const { data: plan, error: planError } = await admin
        .from('subscription_plans')
        .select('id,name,price,currency,duration_days,is_active')
        .eq('id', (body as any).planId)
        .eq('is_active', true)
        .maybeSingle();
      if (planError || !plan) return json(request, { error: 'Subscription plan not found' }, 404);

      const price = Number(plan.price || 0);
      if (!Number.isFinite(price) || price < 0) return json(request, { error: 'Invalid subscription price' }, 500);
      if (price > 0) {
        return json(request, {
          paymentRequired: true,
          plan: {
            id: plan.id,
            name: plan.name,
            amount: price,
            currency: plan.currency || 'NGN',
            durationDays: Number(plan.duration_days || 0),
          },
        });
      }

      const { data: existing } = await admin
        .from('subscriptions')
        .select('id,status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();
      if (existing) return json(request, { subscription: existing, paymentRequired: false });

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Number(plan.duration_days || 0));
      const { data: subscription, error } = await admin.from('subscriptions').insert({
        user_id: user.id,
        plan_id: plan.id,
        gateway: 'free',
        gateway_subscription_id: null,
        status: 'active',
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
      }).select().single();
      if (error) return json(request, { error: 'Unable to create subscription' }, 400);
      return json(request, { subscription, paymentRequired: false });
    }

    if (action === 'create-payment') {
      if (!uuid((body as any).planId)) return json(request, { error: 'Invalid planId' }, 400);
      const gateway = String((body as any).gateway || '').toLowerCase();
      if (!['paystack', 'flutterwave'].includes(gateway)) {
        return json(request, { error: 'Unsupported payment gateway' }, 400);
      }

      const gatewayConfig = gatewayRows().find((row) => row.code === gateway);
      if (!gatewayConfig?.isActive) {
        return json(request, { error: `${gatewayConfig?.name || 'Payment gateway'} is not configured` }, 503);
      }

      const redirectUrl = redirectAllowed(request, (body as any).redirectUrl);
      if (!redirectUrl) return json(request, { error: 'Invalid payment redirect URL' }, 400);

      const { data: plan, error: planError } = await admin
        .from('subscription_plans')
        .select('id,name,price,currency,duration_days,is_active')
        .eq('id', (body as any).planId)
        .eq('is_active', true)
        .maybeSingle();
      if (planError || !plan) return json(request, { error: 'Subscription plan not found' }, 404);

      const amount = Number(plan.price || 0);
      const currency = String(plan.currency || 'NGN').toUpperCase();
      if (!Number.isFinite(amount) || amount <= 0) {
        return json(request, { error: 'This plan does not require a paid checkout' }, 400);
      }

      const reference = safeReference();
      const metadata = {
        ...(((body as any).metadata && typeof (body as any).metadata === 'object') ? (body as any).metadata : {}),
        planId: plan.id,
        purpose: 'subscription',
      };

      const { data: payment, error: paymentError } = await admin.from('payments').insert({
        reference,
        user_id: user.id,
        amount,
        currency,
        gateway,
        status: 'pending',
        purpose: 'subscription',
        purpose_id: plan.id,
        metadata: { ...metadata, redirectUrl },
      }).select().single();
      if (paymentError || !payment) return json(request, { error: 'Unable to create payment record' }, 500);

      try {
        let authorizationUrl = '';
        let accessCode: string | null = null;
        let gatewayReference: string | null = null;

        if (gateway === 'paystack') {
          const secret = Deno.env.get('PAYSTACK_SECRET_KEY')!;
          const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              amount: String(Math.round(amount * 100)),
              currency,
              reference,
              callback_url: redirectUrl,
              metadata: JSON.stringify(metadata),
            }),
          });
          const payload = await response.json();
          if (!response.ok || payload?.status !== true || !payload?.data?.authorization_url) {
            throw new Error(String(payload?.message || 'Paystack checkout could not be initialized'));
          }
          authorizationUrl = String(payload.data.authorization_url);
          accessCode = payload.data.access_code ? String(payload.data.access_code) : null;
          gatewayReference = payload.data.reference ? String(payload.data.reference) : reference;
        } else {
          const secret = Deno.env.get('FLUTTERWAVE_SECRET_KEY')!;
          const response = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tx_ref: reference,
              amount,
              currency,
              redirect_url: redirectUrl,
              customer: {
                email: user.email,
                name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'THE GUIDE learner'),
              },
              customizations: {
                title: 'THE GUIDE Subscription',
                description: plan.name,
              },
              meta: metadata,
            }),
          });
          const payload = await response.json();
          if (!response.ok || payload?.status !== 'success' || !payload?.data?.link) {
            throw new Error(String(payload?.message || 'Flutterwave checkout could not be initialized'));
          }
          authorizationUrl = String(payload.data.link);
          gatewayReference = reference;
        }

        await admin.from('payments').update({
          gateway_reference: gatewayReference,
          metadata: { ...metadata, redirectUrl, authorizationUrl },
          updated_at: new Date().toISOString(),
        }).eq('id', payment.id);

        return json(request, {
          success: true,
          data: {
            payment: { ...payment, gateway_reference: gatewayReference },
            authorizationUrl,
            accessCode,
            reference,
          },
        }, 201);
      } catch (error) {
        await admin.from('payments').update({
          status: 'failed',
          failure_reason: error instanceof Error ? error.message.slice(0, 500) : 'Gateway initialization failed',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', payment.id);
        return json(request, { error: error instanceof Error ? error.message : 'Payment initialization failed' }, 502);
      }
    }

    if (action === 'verify-payment') {
      const reference = String((body as any).reference || '').trim();
      if (!reference || reference.length > 120) return json(request, { error: 'Invalid payment reference' }, 400);

      const { data: payment, error: paymentError } = await admin
        .from('payments')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', user.id)
        .maybeSingle();
      if (paymentError || !payment) return json(request, { error: 'Payment not found' }, 404);

      if (payment.status === 'completed') {
        const subscription = payment.purpose === 'subscription' && payment.purpose_id
          ? await activateSubscription(admin, user.id, payment)
          : null;
        return json(request, { success: true, data: { payment, verified: true, subscription } });
      }

      const expectedAmount = Number(payment.amount || 0);
      const expectedCurrency = String(payment.currency || 'NGN').toUpperCase();
      let verified = false;
      let gatewayReference: string | null = null;

      if (payment.gateway === 'paystack') {
        const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
        if (!secret) return json(request, { error: 'Paystack is not configured' }, 503);
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${secret}` } },
        );
        const payload = await response.json();
        const data = payload?.data;
        const amount = Number(data?.amount || 0) / 100;
        verified = response.ok &&
          payload?.status === true &&
          String(data?.status || '').toLowerCase() === 'success' &&
          String(data?.reference || '') === reference &&
          Math.abs(amount - expectedAmount) <= 0.01 &&
          String(data?.currency || '').toUpperCase() === expectedCurrency;
        gatewayReference = data?.id ? String(data.id) : reference;
      } else if (payment.gateway === 'flutterwave') {
        const secret = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
        const transactionId = String((body as any).transactionId || '').trim();
        if (!secret) return json(request, { error: 'Flutterwave is not configured' }, 503);
        if (!/^\d+$/.test(transactionId)) return json(request, { error: 'Flutterwave transaction ID is required' }, 400);
        const response = await fetch(
          `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
          { headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' } },
        );
        const payload = await response.json();
        const data = payload?.data;
        const amount = Number(data?.amount || 0);
        verified = response.ok &&
          payload?.status === 'success' &&
          String(data?.status || '').toLowerCase() === 'successful' &&
          String(data?.tx_ref || '') === reference &&
          amount + 0.01 >= expectedAmount &&
          String(data?.currency || '').toUpperCase() === expectedCurrency;
        gatewayReference = data?.id ? String(data.id) : transactionId;
      } else {
        return json(request, { error: 'Unsupported payment gateway' }, 400);
      }

      if (!verified) return json(request, { error: 'Payment could not be verified' }, 400);

      const now = new Date().toISOString();
      const { data: completed, error: updateError } = await admin.from('payments').update({
        status: 'completed',
        gateway_reference: gatewayReference,
        paid_at: now,
        failed_at: null,
        failure_reason: null,
        updated_at: now,
      }).eq('id', payment.id).eq('user_id', user.id).select().single();
      if (updateError || !completed) return json(request, { error: 'Unable to finalize payment' }, 500);

      const subscription = completed.purpose === 'subscription' && completed.purpose_id
        ? await activateSubscription(admin, user.id, completed)
        : null;

      return json(request, { success: true, data: { payment: completed, verified: true, subscription } });
    }

    if (action === 'cancel-subscription') {
      if (!uuid((body as any).subscriptionId)) return json(request, { error: 'Invalid subscriptionId' }, 400);
      const { data, error } = await admin.from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', (body as any).subscriptionId)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .select()
        .maybeSingle();
      if (error || !data) return json(request, { error: error?.message || 'Subscription not found' }, 404);
      return json(request, { subscription: data });
    }

    if (action === 'resume-subscription') {
      if (!uuid((body as any).subscriptionId)) return json(request, { error: 'Invalid subscriptionId' }, 400);
      const { data: current, error: readError } = await admin.from('subscriptions')
        .select('*')
        .eq('id', (body as any).subscriptionId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (readError || !current) return json(request, { error: readError?.message || 'Subscription not found' }, 404);
      if (!['active', 'trialing'].includes(current.status)) return json(request, { error: 'Only an active subscription can be resumed' }, 400);
      if (!current.cancel_at_period_end) return json(request, { subscription: current });
      const { data, error } = await admin.from('subscriptions')
        .update({ cancel_at_period_end: false, canceled_at: null })
        .eq('id', current.id)
        .select()
        .single();
      if (error) return json(request, { error: 'Unable to resume subscription' }, 400);
      return json(request, { subscription: data });
    }

    if (action === 'validate-coupon') {
      const code = String((body as any).couponCode || '').trim().toUpperCase().slice(0, 100);
      if (!code || !uuid((body as any).planId)) return json(request, { error: 'couponCode and planId are required' }, 400);
      const { data: coupon, error } = await admin.from('coupons')
        .select('id,code,discount_type,discount_value,max_discount_amount,valid_from,valid_until,is_active')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !coupon) return json(request, { error: 'Invalid coupon code' }, 400);
      const { data: plan } = await admin.from('subscription_plans')
        .select('id,price,currency')
        .eq('id', (body as any).planId)
        .eq('is_active', true)
        .maybeSingle();
      if (!plan) return json(request, { error: 'Plan not found' }, 404);
      const now = Date.now();
      if (coupon.valid_from && now < new Date(coupon.valid_from).getTime()) return json(request, { error: 'Coupon is not yet valid' }, 400);
      if (coupon.valid_until && now > new Date(coupon.valid_until).getTime()) return json(request, { error: 'Coupon has expired' }, 400);
      const price = Number(plan.price || 0);
      let discount = coupon.discount_type === 'percentage'
        ? price * Number(coupon.discount_value || 0) / 100
        : Number(coupon.discount_value || 0);
      if (!Number.isFinite(discount) || discount < 0) return json(request, { error: 'Invalid coupon configuration' }, 400);
      if (coupon.max_discount_amount != null) discount = Math.min(discount, Number(coupon.max_discount_amount));
      discount = Math.min(discount, price);
      return json(request, {
        coupon: { id: coupon.id, code: coupon.code },
        discountAmount: discount,
        finalAmount: price - discount,
        currency: plan.currency || 'NGN',
      });
    }

    return json(request, { error: 'Unsupported payment action' }, 400);
  } catch (error) {
    console.error('Payment operation failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Payment operation failed' }, 500);
  }
});
