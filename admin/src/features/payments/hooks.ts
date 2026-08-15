'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchPayments, fetchPaymentStats, refundPayment, type Payment, type PaymentStats } from '@/services/api/paymentService';

export function usePayments() {
  const { token } = useAdminAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchPayments(token, { page: 1, limit: 200 }), fetchPaymentStats(token)])
      .then(([paymentsRes, statsRes]) => {
        setPayments(paymentsRes.data.data || []);
        setStats(statsRes.data.stats || null);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load payments'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const refund = useCallback(
    async (id: string, reason: string) => {
      if (!token) return;
      await refundPayment(token, id, reason);
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'refunded' } : p)));
    },
    [token]
  );

  return { payments, stats, loading, error, reload: load, refund };
}
