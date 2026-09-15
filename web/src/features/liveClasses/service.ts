import { getSupabase } from '@/lib/supabase';

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  subjectTitle?: string;
  teacherName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended';
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

const mapRow = (row: any): LiveClass => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  teacherName: row.users ? [row.users.first_name, row.users.last_name].filter(Boolean).join(' ') : undefined,
  scheduledAt: row.scheduled_at,
  durationMinutes: Number(row.duration_minutes || 0),
  status: row.status,
  meetingUrl: row.status === 'ended' ? (row.recording_url || row.meeting_url || undefined) : (row.meeting_url || undefined),
  studentCount: Number(row.student_count || 0),
});

const queryClasses = async (filters: LiveClassFilters = {}, ownTeacher = false): Promise<{ data: LiveClass[]; page: number; pageSize: number; total: number; totalPages: number }> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase().from('live_classes').select('*, users:teacher_id(first_name,last_name)', { count: 'exact' }).neq('status', 'cancelled').order('scheduled_at', { ascending: true }).range(from, from + limit - 1);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (ownTeacher) {
    const user = (await getSupabase().auth.getUser()).data.user;
    if (!user) throw new Error('You must be signed in');
    query = query.eq('teacher_id', user.id);
  }
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data || []).map(mapRow), page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};

export const fetchLiveClasses = async (filters: LiveClassFilters = {}, _token: string) => queryClasses(filters, false);
export const fetchMyLiveClasses = async (_token: string, filters: { page?: number; limit?: number; status?: string } = {}) => queryClasses(filters, true);

export const getLiveClass = async (id: string, _token: string): Promise<{ data: LiveClass }> => {
  const { data, error } = await getSupabase().from('live_classes').select('*, users:teacher_id(first_name,last_name)').eq('id', id).neq('status', 'cancelled').maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Live class not found');
  return { data: mapRow(data) };
};

export const createLiveClass = async (data: { title: string; description?: string; scheduledAt: string; durationMinutes: number; meetingUrl: string }, _token: string): Promise<{ data: LiveClass }> => {
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) throw new Error('You must be signed in');
  if (new Date(data.scheduledAt).getTime() <= Date.now()) throw new Error('Choose a future date and time.');
  const { data: row, error } = await getSupabase().from('live_classes').insert({
    teacher_id: user.id,
    title: data.title,
    description: data.description || null,
    scheduled_at: data.scheduledAt,
    duration_minutes: data.durationMinutes,
    meeting_url: data.meetingUrl,
    status: 'scheduled',
    student_count: 0,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return { data: mapRow(row) };
};

export const joinLiveClass = async (id: string, _token: string): Promise<{ data: { meetingUrl: string } }> => {
  const { data, error } = await getSupabase().from('live_classes').select('meeting_url,status,scheduled_at').eq('id', id).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Live class not found');
  if (!['scheduled', 'live'].includes(data.status)) throw new Error('This live class is no longer available.');
  if (!data.meeting_url) throw new Error('The meeting link is not available yet.');
  return { data: { meetingUrl: data.meeting_url } };
};

export const leaveLiveClass = async (_id: string, _token: string): Promise<{ success: boolean }> => ({ success: true });
