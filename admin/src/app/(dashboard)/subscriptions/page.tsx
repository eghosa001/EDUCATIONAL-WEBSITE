'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Check, Sparkles } from 'lucide-react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchSubscriptionPlans,
  createPlan,
  updatePlan,
  deletePlan as deletePlanApi,
} from '@/services/api/subscriptionService';
import type { SubscriptionPlan } from '@/types/models/subscription';

export default function SubscriptionsPage() {
  const { token } = useAdminAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    currency: 'NGN',
    billingCycle: 'monthly',
    durationDays: '30',
    trialDays: '0',
    features: '',
    limits: '',
    isActive: true,
    isPopular: false,
    displayOrder: '0',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetchSubscriptionPlans(token);
      setPlans(res.plans.sort((a, b) => a.displayOrder - b.displayOrder));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', code: '', description: '', price: '', currency: 'NGN',
      billingCycle: 'monthly', durationDays: '30', trialDays: '0',
      features: '', limits: '', isActive: true, isPopular: false, displayOrder: '0',
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      price: String(plan.price),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      durationDays: String(plan.durationDays),
      trialDays: String(plan.trialDays || 0),
      features: plan.features.join(', '),
      limits: JSON.stringify(plan.limits),
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      displayOrder: String(plan.displayOrder),
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!token || !formData.name || !formData.code || !formData.price) return;
    setSaving(true);
    try {
      const planData = {
        name: formData.name,
        code: formData.code.toLowerCase(),
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billingCycle: formData.billingCycle as 'monthly' | 'yearly' | 'one_time',
        durationDays: parseInt(formData.durationDays),
        trialDays: parseInt(formData.trialDays),
        features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
        limits: formData.limits ? JSON.parse(formData.limits) : {},
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        displayOrder: parseInt(formData.displayOrder),
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, planData, token);
      } else {
        await createPlan(planData as any, token);
      }
      setShowCreateModal(false);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this subscription plan?')) return;
    if (!token) return;
    setDeletingId(id);
    try {
      await deletePlanApi(id, token);
      loadPlans();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans and pricing</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl border p-5 ${plan.isPopular ? 'border-emerald-300 shadow-md' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {plan.isPopular && <Sparkles className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{plan.code}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-2xl font-bold text-gray-900">
                N{plan.price.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm">/{plan.billingCycle === 'yearly' ? 'year' : 'month'}</span>
              {plan.trialDays && plan.trialDays > 0 && (
                <span className="ml-2 text-emerald-600 text-xs font-medium">
                  {plan.trialDays}d trial
                </span>
              )}
            </div>

            {plan.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Features:</p>
              <ul className="space-y-1">
                {plan.features.slice(0, 3).map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-xs text-gray-400">+{plan.features.length - 3} more</li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Order: {plan.displayOrder}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(plan)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  disabled={deletingId === plan.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === plan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One-time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trial Days</label>
                    <input
                      type="number"
                      value={formData.trialDays}
                      onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Mark as Popular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formData.name || !formData.code || !formData.price}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
