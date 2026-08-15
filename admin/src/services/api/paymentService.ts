import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  total: { total: number; total_amount: number };
  completed: { total: number; total_amount: number };
}

export const fetchPaymentGateways = async (): Promise<{ gateways: PaymentGateway[] }> => {
  const response = await fetch(`${baseUrl}/payments/gateways`);
  return handleApiError(response);
};

export const fetchPayments = async (
  token: string,
  filters?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }
): Promise<{ data: { data: Payment[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${baseUrl}/payments?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchPaymentStats = async (token: string, userId?: string): Promise<{ data: { stats: PaymentStats } }> => {
  const params = userId ? `?userId=${userId}` : '';
  const response = await fetch(`${baseUrl}/payments/stats${params}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const refundPayment = async (token: string, paymentId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ reason: reason || 'Refund requested by admin' }),
  });
  return handleApiError(response);
};
