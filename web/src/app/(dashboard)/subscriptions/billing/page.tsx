'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchMySubscription,
  cancelSubscription,
  resumeSubscription,
  fetchMyInvoices,
  fetchSubscriptionPlans,
} from '@/services/api/subscriptionService';
import type { Subscription, Invoice, SubscriptionPlan } from '@/types/models/subscription';

export default function BillingPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      fetchMySubscription(token),
      fetchMyInvoices(1, 10, token),
      fetchSubscriptionPlans(token),
    ])
      .then(([subResult, invoiceResult, plansResult]) => {
        setSubscription(subResult.subscription);
        setInvoices(invoiceResult.data || []);
        setAllPlans(plansResult.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!subscription || !token) return;
    setCancelling(true);
    setActionError(null);
    try {
      await cancelSubscription(subscription.id, token);
      setSubscription({ ...subscription, status: 'cancelled' });
      setActionSuccess('Subscription cancelled successfully');
      setShowCancelModal(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    if (!subscription || !token) return;
    setResuming(true);
    setActionError(null);
    try {
      await resumeSubscription(subscription.id, token);
      setSubscription({ ...subscription, status: 'active' });
      setActionSuccess('Subscription resumed successfully');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setResuming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      trialing: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-gray-100 text-gray-700',
      expired: 'bg-red-100 text-red-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      paused: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPlanName = (planId?: string) => {
    return allPlans.find((p) => p.id === planId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscriptions</h1>

      {actionSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4" /> {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {actionError}
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              {subscription?.planName || 'No active subscription'}
            </p>
          </div>
          {subscription && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status)}`}>
              {subscription.status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>

        {subscription ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Started: {new Date(subscription.currentPeriodStart).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">You don&apos;t have an active subscription yet.</p>
        )}

        <div className="flex gap-3">
          {subscription?.status === 'cancelled' && (
            <button
              onClick={handleResume}
              disabled={resuming}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {resuming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Resume Subscription
            </button>
          )}
          {subscription?.status === 'active' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Cancel Subscription
            </button>
          )}
          {!subscription && (
            <button
              onClick={() => router.push('/subscriptions/plans')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Browse Plans
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Options */}
      {subscription && subscription.planCode !== 'school' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPlans
              .filter((p) => p.isActive && p.displayOrder > (allPlans.find((pl) => pl.id === subscription.planId)?.displayOrder || 0))
              .map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                  onClick={() => router.push('/subscriptions/plans')}
                >
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">₦{plan.price.toLocaleString()}/month</p>
                  </div>
                  <span className="text-emerald-600 text-sm font-medium">Upgrade →</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel? You&apos;ll lose access to premium features at the end of your billing period.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 mb-4 resize-none h-20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Invoice History
          </h2>
        </div>

        {invoices.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Invoice #</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Date</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Amount</th>
                  <th className="text-center py-3 px-2 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-2 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900">
                      ₦{invoice.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
