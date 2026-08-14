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
      if (result.data.authorizationUrl) {
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
                : 'border-gray-200 bg-white'
            } ${plan.isPopular ? 'lg:scale-105' : ''}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Most Popular
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              )}
            </div>

            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-gray-900">
                {getPlanPrice(plan)}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500 text-sm">/{plan.billingCycle === 'yearly' ? 'year' : 'month'}</span>
              )}
              {plan.trialDays && (
                <p className="text-emerald-600 text-sm mt-1">{plan.trialDays}-day free trial</p>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.slice(0, 5).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {selectedPlan === plan.id && (
              <div className="text-center">
                <span className="text-emerald-600 text-sm font-medium">Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
            >
              {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>

          <div className="border-t pt-4 mb-4">
            {findSelectedPlan() && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {findSelectedPlan()!.price > 0
                      ? `₦${findSelectedPlan()!.price.toLocaleString()}`
                      : 'Free'}
                  </span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-emerald-600">Discount</span>
                    <span className="text-emerald-600">-₦{discountApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-600">
                    {getPlanPrice(findSelectedPlan()!)}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSubscribe}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
