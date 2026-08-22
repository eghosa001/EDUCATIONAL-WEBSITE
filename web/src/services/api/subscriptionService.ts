import { getSupabase } from '@/lib/supabase';
import type { Subscription, SubscriptionPlan, Invoice } from '@/types/models/subscription';
import type { PaginatedResponse } from '@/types/api/api';

/**
 * Normal subscription reads use Supabase + RLS directly.
 * Payment creation/webhooks and other privileged mutations will be handled by
 * Supabase Edge Functions; no payment secret is exposed to this client.
 */

const mapPlan = (row: any): SubscriptionPlan => ({
  id: row.id, name: row.name, code: row.code, description: row.description,
  price: Number(row.price || 0), currency: row.currency, billingCycle: row.billing_cycle,
  durationDays: row.duration_days, trialDays: row.trial_days, features: row.features || [],
  limits: row.limits || {}, isActive: row.is_active, isPopular: row.is_popular, displayOrder: row.display_order,
} as SubscriptionPlan);

export const fetchSubscriptionPlans = async (_token?: string): Promise<{ plans: SubscriptionPlan[] }> => {
  const { data, error } = await getSupabase().from('subscription_plans').select('*').eq('is_active', true).order('display_order');
  if (error) throw new Error(error.message);
  return { plans: (data || []).map(mapPlan) };
};

export const fetchSubscriptionPlanById = async (planId: string, _token?: string): Promise<{ plan: SubscriptionPlan }> => {
  const { data, error } = await getSupabase().from('subscription_plans').select('*').eq('id', planId).eq('is_active', true).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Subscription plan not found');
  return { plan: mapPlan(data) };
};

export interface CreateSubscriptionData { planId: string; paymentMethodId?: string; couponCode?: string; }

export const fetchMySubscription = async (_token?: string): Promise<{ subscription: Subscription | null }> => {
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) return { subscription: null };
  const { data, error } = await getSupabase().from('subscriptions').select('*, subscription_plans(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return { subscription: data as Subscription | null };
};

// Payment/subscription mutations intentionally stay behind the Edge Function boundary.
const invokePayment = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await getSupabase().functions.invoke('payments', { body });
  if (error) throw new Error(error.message || 'Payment operation failed');
  if (data?.error) throw new Error(String(data.error));
  return data as T;
};

export const createSubscription = (data: CreateSubscriptionData, _token?: string) => invokePayment({ action: 'create-subscription', ...data });
export const updateSubscription = (subscriptionId: string, data: { planId?: string; paymentMethodId?: string }, _token?: string) => invokePayment({ action: 'update-subscription', subscriptionId, ...data });
export const cancelSubscription = (subscriptionId: string, _token?: string) => invokePayment({ action: 'cancel-subscription', subscriptionId });
export const resumeSubscription = (subscriptionId: string, _token?: string) => invokePayment({ action: 'resume-subscription', subscriptionId });

export const fetchMyInvoices = async (page = 1, limit = 20, _token?: string): Promise<PaginatedResponse<Invoice>> => {
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) throw new Error('You must be signed in');
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await getSupabase().from('invoices').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data || []) as Invoice[], page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};

export const fetchInvoiceById = async (invoiceId: string, _token?: string): Promise<{ invoice: Invoice }> => {
  const { data, error } = await getSupabase().from('invoices').select('*').eq('id', invoiceId).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Invoice not found');
  return { invoice: data as Invoice };
};

export const downloadInvoice = async (invoiceId: string, _token?: string) => fetchInvoiceById(invoiceId, _token);

export interface PaymentMethod { id: string; type: 'card' | 'bank_account' | 'mobile_money'; details: Record<string, unknown>; isDefault: boolean; }
export const fetchMyPaymentMethods = async (_token?: string): Promise<{ paymentMethods: PaymentMethod[] }> => {
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) throw new Error('You must be signed in');
  const { data, error } = await getSupabase().from('payment_methods').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
  if (error) throw new Error(error.message);
  return { paymentMethods: (data || []) as PaymentMethod[] };
};

export const addPaymentMethod = (data: { type: string; details: Record<string, unknown> }, _token?: string) => invokePayment({ action: 'add-payment-method', ...data });
export const deletePaymentMethod = (paymentMethodId: string, _token?: string) => invokePayment({ action: 'delete-payment-method', paymentMethodId });
export const setDefaultPaymentMethod = (paymentMethodId: string, _token?: string) => invokePayment({ action: 'set-default-payment-method', paymentMethodId });

export interface CreatePlanData { name: string; code: string; description?: string; price: number; currency?: string; billingCycle: 'monthly' | 'yearly' | 'one_time'; durationDays: number; trialDays?: number; features?: string[]; limits?: Record<string, unknown>; isActive?: boolean; isPopular?: boolean; displayOrder?: number; }
export const createPlan = (data: CreatePlanData, _token?: string) => invokePayment({ action: 'create-plan', ...data });
export const updatePlan = (planId: string, data: Partial<CreatePlanData>, _token?: string) => invokePayment({ action: 'update-plan', planId, ...data });
export const deletePlan = (planId: string, _token?: string) => invokePayment({ action: 'delete-plan', planId });

export interface CouponValidationResult { coupon: import('@/types/models/subscription').Coupon; discountAmount: number; finalAmount: number; }
export const applyCouponHandler = (couponCode: string, planId: string, _token?: string): Promise<CouponValidationResult> => invokePayment({ action: 'validate-coupon', couponCode, planId });
