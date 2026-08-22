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
import type { SubscriptionPlan } from '@/types/models/subscription';

export default function PlansPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchSubscriptionPlans(token).then((res) => {
      setPlans(res.plans.filter((p) => p.isActive));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode || !token) return;
    setApplyingCoupon(true);
    try {
      const result = await applyCouponHandler(couponCode, selectedPlan, token);
      setDiscountApplied(result.discountAmount);
    } catch {
      setError('Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createSubscription(
        { planId: selectedPlan, couponCode: discountApplied > 0 ? couponCode : undefined },
        token
      );
      if (result.data?.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      } else {
        router.push('/subscriptions/billing');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    const basePrice = plan.price - discountApplied;
    return basePrice > 0 ? `₦${basePrice.toLocaleString()}` : 'Free';
  };

  const findSelectedPlan = (): SubscriptionPlan | undefined => {
    return plans.find((p) => p.id === selectedPlan);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Start your learning journey with the perfect plan for you</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan === plan.id
                ? 'border-emerald-500 shadow-lg bg-emerald-50/50'
                : 'border-gray-200'
            }`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Popular
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
            <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{plan.description}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">{getPlanPrice(plan)}</span>
              <span className="text-sm text-gray-500 ml-1">/{plan.billingCycle}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete your subscription</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50"
            >
              {applyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-semibold disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Subscribe'}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
