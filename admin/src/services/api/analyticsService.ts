import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface PlatformMetrics {
  newUsers: number;
  examsTaken: number;
  enrollments: number;
  transactions: number;
  revenue: number;
}

export interface RevenueBreakdown {
  period: string;
  transaction_count: number;
  total_revenue: number;
}

export interface CoursePerformance {
  id: string;
  title: string;
  enrollment_count: number;
  avg_progress: number;
}

export const fetchMetrics = async (range: string, token: string): Promise<{ metrics: PlatformMetrics }> => {
  const response = await fetch(`${baseUrl}/analytics/metrics?range=${range}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchRevenueBreakdown = async (period: string, token: string): Promise<{ breakdown: RevenueBreakdown[] }> => {
  const response = await fetch(`${baseUrl}/analytics/revenue?period=${period}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchCoursePerformance = async (token: string): Promise<{ courses: CoursePerformance[] }> => {
  const response = await fetch(`${baseUrl}/analytics/courses`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
