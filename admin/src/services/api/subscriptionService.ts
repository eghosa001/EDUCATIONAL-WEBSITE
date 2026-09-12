import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { SubscriptionPlan, Invoice, Wallet, WalletTransaction } from '@/types/models/subscription';
import type { PaginatedResponse } from '@/types/api';

const { baseUrl } = apiConfig;

type Raw = Record<string, unknown>;

const mapPlan = (row: Raw): SubscriptionPlan => ({
  id: String(row.id || ''),
  name: String(row.name || ''),
  code: String(row.code || ''),
  description: row.description ? String(row.description) : undefined,
  price: Number(row.price || 0),
  currency: String(row.currency || 'NGN'),
  billingCycle: String(row.billing_cycle || row.billingCycle || 'monthly') as SubscriptionPlan['billingCycle'],
  durationDays: Number(row.duration_days ?? row.durationDays ?? 0),
  trialDays: Number(row.trial_days ?? row.trialDays ?? 0),
  features: Array.isArray(row.features) ? row.features.map(String) : [],
  limits: row.limits && typeof row.limits === 'object' && !Array.isArray(row.limits) ? row.limits as Record<string, unknown> : {},
  isActive: Boolean(row.is_active ?? row.isActive),
  isPopular: Boolean(row.is_popular ?? row.isPopular),
  displayOrder: Number(row.display_order ?? row.displayOrder ?? 0),
  createdAt: String(row.created_at || row.createdAt || ''),
  updatedAt: String(row.updated_at || row.updatedAt || ''),
});

const mapInvoice = (row: Raw): Invoice => ({
  id: String(row.id || ''),
  invoiceNumber: String(row.invoice_number || row.invoiceNumber || ''),
  userId: String(row.user_id || row.userId || ''),
  subscriptionId: row.subscription_id || row.subscriptionId ? String(row.subscription_id || row.subscriptionId) : undefined,
  paymentId: row.payment_id || row.paymentId ? String(row.payment_id || row.paymentId) : undefined,
  amount: Number(row.amount || 0),
  currency: String(row.currency || 'NGN'),
  taxAmount: Number(row.tax_amount ?? row.taxAmount ?? 0),
  discountAmount: Number(row.discount_amount ?? row.discountAmount ?? 0),
  status: String(row.status || 'pending') as Invoice['status'],
  dueDate: String(row.due_date || row.dueDate || ''),
  paidAt: row.paid_at || row.paidAt ? String(row.paid_at || row.paidAt) : undefined,
  createdAt: String(row.created_at || row.createdAt || ''),
});

const mapWallet = (row: Raw): Wallet => ({
  id: String(row.id || ''),
  userId: String(row.user_id || row.userId || ''),
  balance: Number(row.balance || 0),
  currency: String(row.currency || 'NGN'),
  isActive: Boolean(row.is_active ?? row.isActive ?? true),
  createdAt: String(row.created_at || row.createdAt || ''),
  updatedAt: String(row.updated_at || row.updatedAt || ''),
});

const mapWalletTransaction = (row: Raw): WalletTransaction => ({
  id: String(row.id || ''),
  walletId: String(row.wallet_id || row.walletId || ''),
  type: String(row.type || 'credit') as WalletTransaction['type'],
  amount: Number(row.amount || 0),
  balanceBefore: Number(row.balance_before ?? row.balanceBefore ?? 0),
  balanceAfter: Number(row.balance_after ?? row.balanceAfter ?? 0),
  reference: String(row.reference || ''),
  description: String(row.description || ''),
  createdAt: String(row.created_at || row.createdAt || ''),
});

// ========== SUBSCRIPTION PLANS (Admin) ==========

export const fetchSubscriptionPlans = async (token: string, filters?: { isActive?: boolean; page?: number; limit?: number }): Promise<{ plans: SubscriptionPlan[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/subscriptions/plans?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { plans?: Raw[] };
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
  return { plans: (body.data?.plans ?? []).map(mapPlan), pagination: body.pagination };
};

export const createPlan = async (data: Partial<SubscriptionPlan> & { name: string; code: string; price: number; durationDays: number; billingCycle: string }, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updatePlan = async (planId: string, data: Partial<SubscriptionPlan>, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans/${planId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deletePlan = async (planId: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans/${planId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== SUBSCRIPTIONS (Admin) ==========

export const fetchAllSubscriptions = async (token: string, filters?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<unknown>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`${baseUrl}/subscriptions?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== INVOICES (Admin) ==========

export const fetchAllInvoices = async (token: string, filters?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Invoice>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`${baseUrl}/subscriptions/invoices?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as PaginatedResponse<Raw>;
  return { ...body, data: (body.data || []).map(mapInvoice) };
};

// ========== WALLET ==========

export const fetchWallet = async (userId: string, token: string): Promise<{ wallet: Wallet }> => {
  const response = await fetch(`${baseUrl}/subscriptions/wallet?userId=${encodeURIComponent(userId)}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as { data?: { wallet?: Raw } };
  if (!body.data?.wallet) throw new Error('Wallet response was missing wallet data');
  return { wallet: mapWallet(body.data.wallet) };
};

export const fetchWalletTransactions = async (userId: string, token: string, page = 1, limit = 20): Promise<{ transactions: WalletTransaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const response = await fetch(
    `${baseUrl}/subscriptions/wallet/transactions?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  const body = (await handleApiError(response)) as {
    data?: { transactions?: Raw[]; pagination?: { page: number; limit: number; total: number; totalPages: number } };
  };
  if (!body.data?.pagination) throw new Error('Wallet transaction response was missing pagination data');
  return { transactions: (body.data.transactions ?? []).map(mapWalletTransaction), pagination: body.data.pagination };
};

export const fundWallet = async (userId: string, amount: number, gateway: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/wallet/fund`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId, amount, gateway }),
  });
  return handleApiError(response);
};
