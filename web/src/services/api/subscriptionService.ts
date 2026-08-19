import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Subscription, SubscriptionPlan, Invoice } from '@/types/models/subscription';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== SUBSCRIPTION PLANS ==========

export const fetchSubscriptionPlans = async (token?: string): Promise<{ plans: SubscriptionPlan[] }> => {
  const response = await fetch(`${baseUrl}/subscriptions/plans`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchSubscriptionPlanById = async (
  planId: string,
  token?: string
): Promise<{ plan: SubscriptionPlan }> => {
  const response = await fetch(`${baseUrl}/subscriptions/plans/${planId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SUBSCRIPTIONS ==========

export interface CreateSubscriptionData {
  planId: string;
  paymentMethodId?: string;
  couponCode?: string;
}

export const fetchMySubscription = async (token: string): Promise<{ subscription: Subscription }> => {
  const response = await fetch(`${baseUrl}/subscriptions/my`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createSubscription = async (
  data: CreateSubscriptionData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateSubscription = async (
  subscriptionId: string,
  data: { planId?: string; paymentMethodId?: string },
  token: string
) => {
  const response = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const cancelSubscription = async (subscriptionId: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const resumeSubscription = async (subscriptionId: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== INVOICES ==========

export const fetchMyInvoices = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<Invoice>> => {
  const response = await fetch(
    `${baseUrl}/subscriptions/invoices?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchInvoiceById = async (invoiceId: string, token: string): Promise<{ invoice: Invoice }> => {
  const response = await fetch(`${baseUrl}/subscriptions/invoices/${invoiceId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const downloadInvoice = async (invoiceId: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/invoices/${invoiceId}/download`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== PAYMENT METHODS ==========

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  details: Record<string, unknown>;
  isDefault: boolean;
}

export const fetchMyPaymentMethods = async (token: string): Promise<{ paymentMethods: PaymentMethod[] }> => {
  const response = await fetch(`${baseUrl}/subscriptions/payment-methods`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addPaymentMethod = async (
  data: { type: string; details: Record<string, unknown> },
  token: string
) => {
  const response = await fetch(`${baseUrl}/subscriptions/payment-methods`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deletePaymentMethod = async (paymentMethodId: string, token: string) => {
  const response = await fetch(
    `${baseUrl}/subscriptions/payment-methods/${paymentMethodId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const setDefaultPaymentMethod = async (paymentMethodId: string, token: string) => {
  const response = await fetch(
    `${baseUrl}/subscriptions/payment-methods/${paymentMethodId}/default`,
    {
      method: 'POST',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== ADMIN: PLAN MANAGEMENT ==========

export interface CreatePlanData {
  name: string;
  code: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  durationDays: number;
  trialDays?: number;
  features?: string[];
  limits?: Record<string, unknown>;
  isActive?: boolean;
  isPopular?: boolean;
  displayOrder?: number;
}

export const createPlan = async (data: CreatePlanData, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updatePlan = async (planId: string, data: Partial<CreatePlanData>, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans/${planId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deletePlan = async (planId: string, token: string) => {
  const response = await fetch(`${baseUrl}/subscriptions/plans/${planId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== COUPON ==========

export interface CouponValidationResult {
  coupon: import('@/types/models/subscription').Coupon;
  discountAmount: number;
  finalAmount: number;
}

export const applyCouponHandler = async (
  couponCode: string,
  planId: string,
  token: string
): Promise<CouponValidationResult> => {
  const response = await fetch(`${baseUrl}/subscriptions/coupon/validate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ couponCode, planId, credentials: 'include' }),
  });
  return handleApiError(response);
};
