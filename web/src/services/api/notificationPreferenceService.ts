import { getSupabase } from '@/lib/supabase';

export type NotificationChannel = 'email' | 'push' | 'in_app';

export interface NotificationPreference {
  channel: NotificationChannel;
  notificationType: string;
  isEnabled: boolean;
}

const currentUserId = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user.id;
};

export const fetchNotificationPreferences = async (): Promise<NotificationPreference[]> => {
  const userId = await currentUserId();
  const { data, error } = await getSupabase()
    .from('user_notification_preferences')
    .select('channel,notification_type,is_enabled')
    .eq('user_id', userId)
    .order('channel')
    .order('notification_type');
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    channel: row.channel as NotificationChannel,
    notificationType: String(row.notification_type || ''),
    isEnabled: Boolean(row.is_enabled),
  }));
};

export const saveNotificationPreferences = async (preferences: NotificationPreference[]) => {
  const userId = await currentUserId();
  const rows = preferences.map((preference) => ({
    user_id: userId,
    channel: preference.channel,
    notification_type: preference.notificationType,
    is_enabled: preference.isEnabled,
    updated_at: new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await getSupabase()
    .from('user_notification_preferences')
    .upsert(rows, { onConflict: 'user_id,channel,notification_type' });
  if (error) throw new Error(error.message);
};
