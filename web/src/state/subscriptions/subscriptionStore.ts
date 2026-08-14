'use client';

import { create } from 'zustand';
import type { Invoice, Subscription, SubscriptionPlan } from '@/types/models/subscription';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  subscription: Subscription | null;
  invoices: Invoice[];
  isLoading: boolean;
  setPlans: (plans: SubscriptionPlan[]) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plans: [],
  subscription: null,
  invoices: [],
  isLoading: false,
  setPlans: (plans) => set({ plans }),
  setSubscription: (subscription) => set({ subscription }),
  setInvoices: (invoices) => set({ invoices }),
  setLoading: (isLoading) => set({ isLoading }),
}));
