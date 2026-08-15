import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface AiUsageStats {
  todayRequests?: number;
  weekRequests?: number;
  totalRequests?: number;
  totalCost?: number;
  modelUsage?: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  [key: string]: unknown;
}

export const fetchAiUsage = async (token: string): Promise<{ data: { stats: AiUsageStats } }> => {
  const response = await fetch(`${baseUrl}/ai/usage`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};
