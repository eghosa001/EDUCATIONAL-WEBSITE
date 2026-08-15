'use client';

import { useState, useEffect } from 'react';
import { useSubscriptionStore } from '@/features/subscriptions/store/subscriptionStore';

export function useSubscriptions() {
  const { plans, currentSubscription, isLoading, error, fetchPlans, fetchCurrentSubscription, activatePlan, cancelSubscription, getPlanById } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleActivate = async () => {
    if (!selectedPlan) return;
    return await activatePlan(selectedPlan);
  };

  const handleCancel = async () => {
    return await cancelSubscription();
  };

  const selectedPlanData = selectedPlan ? getPlanById(selectedPlan) : null;
  const currentPlanData = currentSubscription ? getPlanById(currentSubscription.planId) : null;

  return {
    plans,
    currentSubscription,
    selectedPlan,
    billingPeriod,
    isLoading,
    error,
    selectedPlanData,
    currentPlanData,
    handleSelectPlan,
    setBillingPeriod,
    handleActivate,
    handleCancel,
  };
}
