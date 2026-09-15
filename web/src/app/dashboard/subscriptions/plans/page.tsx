'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchSubscriptionPlans,
  createSubscription,
  applyCouponHandler,
} from '@/services/api/subscriptionService';
import { createPayment, fetchPaymentGateways, type PaymentGateway } from '@/services/api/paymentService';
import type { SubscriptionPlan } from '@/types/models/subscription';

const BILLING_PATH = '/dashboard/subscriptions/billing';

export default function PlansPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave' | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      fetchSubscriptionPlans(token),
      fetchPaymentGateways(token).catch(() => ({ gateways: [] as PaymentGateway[] })),
    ]).then(([planResult, gatewayResult]) => {
      setPlans(planResult.plans.filter((p) => p.isActive));
      let gatewayRows: PaymentGateway[] = [];
      if ('data' in gatewayResult && Array.isArray(gatewayResult.data?.gateways)) gatewayRows = gatewayResult.data.gateways;
      else if ('gateways' in gatewayResult && Array.isArray(gatewayResult.gateways)) gatewayRows = gatewayResult.gateways;
      const available = gatewayRows.filter(gateway => gateway.isActive && (gateway.code === 'paystack' || gateway.code === 'flutterwave'));
      setGateways(available);
      const preferred = available.find(gateway => gateway.code === 'paystack') || available[0];
      if (preferred) setSelectedGateway(preferred.code as 'paystack' | 'flutterwave');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setCouponCode('');
    setDiscountApplied(0);
    setError(null);
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode || !token) return;
    const plan = plans.find(item => item.id === selectedPlan);
    if (plan && Number(plan.price || 0) > 0) {
      setError('Coupon discounts are temporarily unavailable for paid checkout. No charge has been made.');
      setDiscountApplied(0);
      return;
    }
    setApplyingCoupon(true);
    try {
      const result = await applyCouponHandler(couponCode, selectedPlan, token);
      setDiscountApplied(result.discountAmount);
      setError(null);
    } catch {
      setError('Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !token) return;
    const plan = plans.find(item => item.id === selectedPlan);
    if (!plan) return;
    setSubmitting(true);
    setError(null);
    try {
      const price = Number(plan.price || 0);
      if (price <= 0) {
        await createSubscription({ planId: selectedPlan }, token);
        router.push(BILLING_PATH);
        return;
      }
      if (discountApplied > 0) {
        setError('Coupon discounts are temporarily unavailable for paid checkout. Remove the coupon before continuing.');
        return;
      }
      if (!selectedGateway) {
        setError('No online payment gateway is currently available. Please try again later.');
        return;
      }
      const result = await createPayment({
        amount: price,
        currency: plan.currency || 'NGN',
        gateway: selectedGateway,
        planId: selectedPlan,
        redirectUrl: `${window.location.origin}${BILLING_PATH}`,
        metadata: { source: 'subscription-plans' },
      }, token);
      const authorizationUrl = result.data?.authorizationUrl;
      if (!authorizationUrl) throw new Error('Payment gateway did not return a checkout URL');
      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    const basePrice = plan.price - discountApplied;
    return basePrice > 0 ? `₦${basePrice.toLocaleString()}` : 'Free';
  };

  const selectedPlanDetails = plans.find(plan => plan.id === selectedPlan);
  const selectedPlanIsPaid = Number(selectedPlanDetails?.price || 0) > 0;

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-10 text-center"><h1 className="mb-2 text-3xl font-bold text-gray-900">Choose Your Plan</h1><p className="text-gray-600">Start your learning journey with the perfect plan for you</p></div>
      {error && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <div key={plan.id} className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${selectedPlan===plan.id?'border-emerald-500 bg-emerald-50/50 shadow-lg':'border-gray-200'}`} onClick={() => handleSelectPlan(plan.id)}>
            {plan.isPopular && <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"><Sparkles className="h-3 w-3"/>Popular</div>}
            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2><p className="mt-1 min-h-[40px] text-sm text-gray-500">{plan.description}</p>
            <div className="mt-4"><span className="text-3xl font-bold text-gray-900">{getPlanPrice(plan)}</span><span className="ml-1 text-sm text-gray-500">/{plan.billingCycle}</span></div>
            <ul className="mt-6 space-y-3">{plan.features.map(feature => <li key={feature} className="flex items-start gap-2 text-sm text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>{feature}</li>)}</ul>
          </div>
        ))}
      </div>
      {selectedPlan && <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Complete your subscription</h3>
        {selectedPlanIsPaid && <div className="mb-4"><label htmlFor="payment-gateway" className="mb-2 block text-sm font-medium text-gray-700">Payment gateway</label><select id="payment-gateway" value={selectedGateway||''} onChange={event=>setSelectedGateway(event.target.value as 'paystack'|'flutterwave')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" disabled={gateways.length===0}>{gateways.length===0&&<option value="">No gateway available</option>}{gateways.map(gateway=><option key={gateway.code} value={gateway.code}>{gateway.name}</option>)}</select></div>}
        <div className="mb-2 flex gap-2"><input type="text" value={couponCode} onChange={e=>setCouponCode(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"/><button type="button" onClick={handleApplyCoupon} disabled={applyingCoupon||!couponCode} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50">{applyingCoupon?'Applying...':'Apply'}</button></div>
        {selectedPlanIsPaid&&<p className="mb-4 text-xs text-gray-500">Paid-plan coupons are disabled until they can be bound atomically to a verified payment.</p>}
        <button type="button" onClick={handleSubscribe} disabled={submitting||(selectedPlanIsPaid&&!selectedGateway)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{submitting?'Processing...':selectedPlanIsPaid?'Continue to secure payment':'Activate free plan'}{!submitting&&<ArrowRight className="h-4 w-4"/>}</button>
      </div>}
    </div>
  );
}
