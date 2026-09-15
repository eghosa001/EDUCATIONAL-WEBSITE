import { getSupabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  body?: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion' | string;
  data?: Record<string, unknown>;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  created_at?: string;
}
export interface NotificationFilters { page?: number; limit?: number; isRead?: boolean; type?: string; }

const mapRow = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.body || '',
  body: row.body || '',
  type: row.type,
  data: row.data || {},
  isRead: Boolean(row.read_at),
  read: Boolean(row.read_at),
  createdAt: row.created_at,
  created_at: row.created_at,
});

const requireUser = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user;
};

export const fetchNotifications = async (filters: NotificationFilters = {}, _token: string): Promise<PaginatedResponse<Notification>> => {
  const user = await requireUser();
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase().from('notifications').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.isRead === true) query = query.not('read_at', 'is', null);
  if (filters.isRead === false) query = query.is('read_at', null);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data || []).map(mapRow), page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};

export const fetchUnreadNotifications = async (_token: string): Promise<{ notifications: Notification[]; count: number }> => {
  const result = await fetchNotifications({ page: 1, limit: 100, isRead: false }, _token);
  return { notifications: result.data, count: result.total };
};

export const markNotificationAsRead = async (notificationId: string, _token: string) => {
  const user = await requireUser();
  const { error } = await getSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true };
};
export const markAllNotificationsAsRead = async (_token: string) => {
  const user = await requireUser();
  const { error } = await getSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  if (error) throw new Error(error.message);
  return { success: true };
};
export const deleteNotification = async (notificationId: string, _token: string) => {
  const user = await requireUser();
  const { error } = await getSupabase().from('notifications').delete().eq('id', notificationId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true };
};
export const deleteAllNotifications = async (_token: string) => {
  const user = await requireUser();
  const { error } = await getSupabase().from('notifications').delete().eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true };
};

export interface NotificationPreferences { email: boolean; push: boolean; sms: boolean; examReminders: boolean; courseUpdates: boolean; promotional: boolean; }
const defaultPreferences: NotificationPreferences = { email: true, push: true, sms: false, examReminders: true, courseUpdates: true, promotional: false };
export const fetchNotificationPreferences = async (_token: string): Promise<{ preferences: NotificationPreferences }> => {
  if (typeof window === 'undefined') return { preferences: defaultPreferences };
  const raw = window.localStorage.getItem('the-guide-notification-preferences');
  return { preferences: raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences };
};
export const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>, token: string) => {
  const current = (await fetchNotificationPreferences(token)).preferences;
  const next = { ...current, ...preferences };
  if (typeof window !== 'undefined') window.localStorage.setItem('the-guide-notification-preferences', JSON.stringify(next));
  return { preferences: next };
};

export interface NotificationSocketMessage { type: 'notification' | 'read_receipt' | 'ping'; data: Notification | { notificationId: string } | null; }
let realtimeChannel: any = null;
export const connectNotificationSocket = async (_token: string, onMessage: (message: NotificationSocketMessage) => void) => {
  if (realtimeChannel) return;
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) return;
  realtimeChannel = getSupabase().channel(`notifications:${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => onMessage({ type: 'notification', data: mapRow(payload.new) })).subscribe();
};
export const disconnectNotificationSocket = () => {
  if (realtimeChannel) void getSupabase().removeChannel(realtimeChannel);
  realtimeChannel = null;
};
export const sendSocketMessage = (_message: Omit<NotificationSocketMessage, 'type'>) => {};
