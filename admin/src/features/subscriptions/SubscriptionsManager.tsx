'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, UsersIcon, RefreshCwIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import StatCard from '@/components/ui/StatCard';
import Badge, { statusTone } from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Toggle from '@/components/ui/Toggle';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatNaira } from '@/utils/format';
import { useSubscriptions } from './hooks';
import type { SubscriptionPlan } from '@/types/models/subscription';

interface PlanForm {
  name: string;
  code: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  durationDays: number;
  isActive: boolean;
  isPopular: boolean;
}

const emptyForm: PlanForm = {
  name: '',
  code: '',
  description: '',
  price: 0,
  currency: 'NGN',
  billingCycle: 'monthly',
  durationDays: 30,
  isActive: true,
  isPopular: false,
};

export default function SubscriptionsManager() {
  const { plans, loading, error, reload, add, update, remove } = useSubscriptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SubscriptionPlan | null>(null);
  const [flash, setFlash] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      code: plan.code,
      description: plan.description ?? '',
      price: plan.price,
      currency: plan.currency || 'NGN',
      billingCycle: plan.billingCycle,
      durationDays: plan.durationDays,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (editing) await update(editing.id, form);
      else await add(form);
      setFlash(editing ? 'Plan updated' : 'Plan created');
      setModalOpen(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading subscription plans..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCwIcon className="w-4 h-4" /> Refresh
          </button>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Plans" value={String(plans.length)} icon={CreditCardIcon} tone="indigo" />
        <StatCard label="Active Plans" value={String(plans.filter((p) => p.isActive).length)} icon={CreditCardIcon} tone="green" />
        <StatCard label="Popular Plans" value={String(plans.filter((p) => p.isPopular).length)} icon={UsersIcon} tone="purple" />
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No plans yet. Create your first subscription plan.
          </div>
        )}
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  {plan.name}
                  {plan.isPopular && <Badge tone="indigo">Popular</Badge>}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{plan.code}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">
              {formatNaira(plan.price)}
              <span className="text-sm font-normal text-gray-400"> / {plan.billingCycle.replace('_', ' ')}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{plan.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{plan.durationDays} days</span>
              {plan.trialDays ? <span>{plan.trialDays}-day trial</span> : null}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => openEdit(plan)} className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg inline-flex items-center justify-center gap-1">
                <PencilIcon className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setDeleting(plan)} className="flex-1 text-sm text-red-600 hover:bg-red-50 py-1.5 rounded-lg inline-flex items-center justify-center gap-1">
                <TrashIcon className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Student Premium" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. student_premium" />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price" required>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
            <Field label="Currency">
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>NGN</option>
                <option>USD</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Billing Cycle" required>
              <select
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value as PlanForm['billingCycle'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One time</option>
              </select>
            </Field>
            <Field label="Duration (days)" required>
              <Input type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active</span>
              <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Mark as popular</span>
              <Toggle checked={form.isPopular} onChange={(v) => setForm({ ...form, isPopular: v })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.code || form.price < 0}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await remove(deleting.id);
          setFlash(`${deleting.name} deleted`);
          setDeleting(null);
          setTimeout(() => setFlash(''), 3000);
        }}
        title="Delete plan"
        message={`Delete ${deleting?.name}? Active subscriptions may be affected.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
