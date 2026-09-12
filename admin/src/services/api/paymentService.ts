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

type RawPayment = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  gateway?: string;
  method?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

const mapPayment = (row: RawPayment): Payment => ({
  id: String(row.id || ''),
  userId: String(row.user_id || ''),
  email: row.email,
  first_name: row.first_name,
  last_name: row.last_name,
  amount: Number(row.amount || 0),
  currency: String(row.currency || 'NGN'),
  status: String(row.status || ''),
  method: String(row.gateway || row.method || ''),
  reference: String(row.reference || ''),
  description: row.description,
  metadata: row.metadata,
  createdAt: String(row.created_at || ''),
  updatedAt: String(row.updated_at || ''),
});

export const fetchPaymentGateways = async (): Promise<{ gateways: PaymentGateway[] }> => {
  const response = await fetch(`${baseUrl}/payments/gateways`);
  const body = (await handleApiError(response)) as { data?: { gateways?: PaymentGateway[] } };
  return { gateways: body.data?.gateways ?? [] };
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
  const body = (await handleApiError(response)) as {
    data?: { data?: RawPayment[]; pagination?: { page: number; limit: number; total: number; totalPages: number } };
  };
  const pagination = body.data?.pagination ?? { page: filters?.page || 1, limit: filters?.limit || 20, total: 0, totalPages: 0 };
  return { data: { data: (body.data?.data ?? []).map(mapPayment), pagination } };
};

export const fetchPaymentStats = async (token: string, userId?: string): Promise<{ data: { stats: PaymentStats } }> => {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
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
