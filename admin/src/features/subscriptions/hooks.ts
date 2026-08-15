'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchSubscriptionPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from '@/services/api/subscriptionService';
import type { SubscriptionPlan } from '@/types/models/subscription';

export function useSubscriptions() {
  const { token } = useAdminAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSubscriptionPlans(token, { page: 1, limit: 100 })
      .then((plansRes) => {
        setPlans(plansRes.plans || []);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (data: Partial<SubscriptionPlan> & { name: string; code: string; price: number; durationDays: number; billingCycle: string }) => {
      if (!token) return;
      await createPlan(data, token);
      await load();
    },
    [token, load]
  );

  const update = useCallback(
    async (id: string, data: Partial<SubscriptionPlan>) => {
      if (!token) return;
      await updatePlan(id, data, token);
      await load();
    },
    [token, load]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      await deletePlan(id, token);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    },
    [token]
  );

  return { plans, loading, error, reload: load, add, update, remove };
}
