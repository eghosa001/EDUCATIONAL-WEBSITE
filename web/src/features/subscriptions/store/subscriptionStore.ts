'use client';

import { create } from 'zustand';
import type { SubscriptionPlan, Subscription, PaymentHistory } from '@/types/models/subscription';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  paymentHistory: PaymentHistory[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchCurrentSubscription: () => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  activatePlan: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  getPlanById: (planId: string) => SubscriptionPlan | undefined;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  currentSubscription: null,
  paymentHistory: [],
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/subscriptions/plans', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ plans: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch plans', isLoading: false });
    }
  },

  fetchCurrentSubscription: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ currentSubscription: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch subscription', isLoading: false });
    }
  },

  fetchPaymentHistory: async () => {
    try {
      const response = await fetch('/api/payments/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ paymentHistory: data.data });
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    }
  },

  activatePlan: async (planId) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
        return true;
      }
      set({ currentSubscription: data.data, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to activate plan', isLoading: false });
      return false;
    }
  },

  cancelSubscription: async () => {
    try {
      await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set({ currentSubscription: null });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel subscription' });
      return false;
    }
  },

  getPlanById: (planId) => get().plans.find((p) => p.id === planId),
}));
