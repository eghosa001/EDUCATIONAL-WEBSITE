import { apiConfig, getAuthHeaders, handleApiError } from '@/services/api/config';
import type { PaginatedResponse } from '@/types/api/api';
import { getSupabase } from '@/lib/supabase';

const { baseUrl } = apiConfig;

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  subjectTitle?: string;
  teacherName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetingUrl?: string;
  studentCount?: number;
}

export interface LiveClassFilters {
  page?: number;
  limit?: number;
  status?: string;
  subjectId?: string;
  teacherId?: string;
  search?: string;
}

export interface CreateLiveClassInput {
  title: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants?: number;
  meetingUrl: string;
}

const mapLiveClass = (row: any): LiveClass => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  scheduledAt: row.scheduled_at,
  durationMinutes: Number(row.duration_minutes || 60),
  status: row.status,
  meetingUrl: row.status === 'ended' ? (row.recording_url || row.meeting_url || undefined) : (row.meeting_url || undefined),
  studentCount: Number(row.student_count || 0),
});

export const fetchLiveClasses = async (
  filters: LiveClassFilters = {},
  _token?: string
): Promise<PaginatedResponse<LiveClass>> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase().from('live_classes').select('*', { count: 'exact' }).neq('status', 'cancelled');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`);
  const { data, error, count } = await query.order('scheduled_at', { ascending: true }).range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const total = count || 0;
  return { data: (data || []).map(mapLiveClass), page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const fetchMyLiveClasses = async (
  _token: string,
  filters: { page?: number; limit?: number; status?: string } = {}
): Promise<PaginatedResponse<LiveClass>> => {
  const { data: auth, error: authError } = await getSupabase().auth.getUser();
  if (authError || !auth.user) throw new Error('You must be signed in');
  return fetchLiveClasses({ ...filters, teacherId: auth.user.id });
};

export const createLiveClass = async (data: CreateLiveClassInput, token: string): Promise<{ data: LiveClass }> => {
  const response = await fetch(`${baseUrl}/live-classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    credentials: 'include'
  });
  return handleApiError(response);
};

export const getLiveClass = async (id: string, token?: string): Promise<{ data: LiveClass }> => {
  const response = await fetch(`${baseUrl}/live-classes/${id}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const joinLiveClass = async (id: string, _token: string): Promise<{ data: { meetingUrl: string } }> => {
  const { data, error } = await getSupabase().from('live_classes').select('meeting_url,status').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Live class not found');
  if (!data.meeting_url) throw new Error('The teacher has not provided a meeting link yet.');
  return { data: { meetingUrl: data.meeting_url } };
};

export const leaveLiveClass = async (id: string, token: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/live-classes/${id}/leave`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
