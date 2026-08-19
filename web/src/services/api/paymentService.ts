import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== PAYMENTS ==========

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePaymentData {
  amount: number;
  currency?: string;
  method: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export const fetchPayments = async (
  filters: PaymentFilters = {},
  token: string
): Promise<PaginatedResponse<Payment>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/payments?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchPaymentById = async (paymentId: string, token: string): Promise<{ payment: Payment }> => {
  const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createPayment = async (data: CreatePaymentData, token: string) => {
  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const verifyPayment = async (reference: string, token: string) => {
  const response = await fetch(`${baseUrl}/payments/verify`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ reference, credentials: 'include' }),
  });
  return handleApiError(response);
};

// ========== PAYMENT GATEWAYS ==========

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

export const fetchPaymentGateways = async (token?: string): Promise<{ gateways: PaymentGateway[] }> => {
  const response = await fetch(`${baseUrl}/payments/gateways`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== WALLET ==========

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference?: string;
  balanceAfter: number;
  createdAt: string;
}

export const fetchMyWallet = async (token: string): Promise<{ wallet: Wallet }> => {
  const response = await fetch(`${baseUrl}/payments/wallet`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchWalletTransactions = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<WalletTransaction>> => {
  const response = await fetch(
    `${baseUrl}/payments/wallet/transactions?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fundWallet = async (amount: number, paymentMethodId: string, token: string) => {
  const response = await fetch(`${baseUrl}/payments/wallet/fund`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ amount, paymentMethodId, credentials: 'include' }),
  });
  return handleApiError(response);
};
