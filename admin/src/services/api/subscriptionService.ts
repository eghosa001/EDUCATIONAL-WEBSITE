import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { SubscriptionPlan, Invoice, Wallet, WalletTransaction } from '@/types/models/subscription';
import type { PaginatedResponse } from '@/types/api';

const { baseUrl } = apiConfig;

// ========== SUBSCRIPTION PLANS (Admin) ==========

export const fetchSubscriptionPlans = async (token: string, filters?: { isActive?: boolean; page?: number; limit?: number }): Promise<{ plans: SubscriptionPlan[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/subscriptions/plans?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
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
  return handleApiError(response);
};

// ========== WALLET ==========

export const fetchWallet = async (userId: string, token: string): Promise<{ wallet: Wallet }> => {
  const response = await fetch(`${baseUrl}/subscriptions/wallet?userId=${userId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchWalletTransactions = async (userId: string, token: string, page = 1, limit = 20): Promise<{ transactions: WalletTransaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const response = await fetch(
    `${baseUrl}/subscriptions/wallet/transactions?userId=${userId}&page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};

export const fundWallet = async (userId: string, amount: number, gateway: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/wallet/fund`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId, amount, gateway }),
  });
  return handleApiError(response);
};
