'use client';

import { useState } from 'react';
import { SendIcon, UsersIcon, GlobeIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Card from '@/components/ui/Card';
import Flash from '@/components/ui/Flash';
import { useBroadcast, useNotificationStats } from './hooks';
import type { NotificationChannel, NotificationType } from '@/services/api/notificationService';

const NOTIFICATION_TYPES: Array<{ value: NotificationType; label: string }> = [
  { value: 'course', label: 'Course' },
  { value: 'exam', label: 'Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'payment', label: 'Payment' },
  { value: 'result', label: 'Result' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'study_reminder', label: 'Study Reminder' },
  { value: 'subscription_expiry', label: 'Subscription Expiry' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
];

const CHANNELS: Array<{ value: NotificationChannel; label: string }> = [
  { value: 'in_app', label: 'In-App Only' },
  { value: 'email', label: 'Email Only' },
  { value: 'sms', label: 'SMS Only' },
  { value: 'push', label: 'Push Notification' },
  { value: 'all', label: 'All Channels' },
];

interface Props {
  recipientUserIds?: string[];
  onBroadcast?: (message: string) => void;
}

export default function BroadcastComposer({ recipientUserIds, onBroadcast }: Props) {
  const { stats, loading: statsLoading } = useNotificationStats();
  const { send, sendToAll, sending, lastResult } = useBroadcast();
  const [type, setType] = useState<NotificationType>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<NotificationChannel>('in_app');
  const [actionUrl, setActionUrl] = useState('');
  const [flash, setFlash] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const handleSendSelected = async () => {
    if (!recipientUserIds?.length) {
      setFlash({ tone: 'error', message: 'No recipients selected' });
      return;
    }
    if (!title.trim() || !body.trim()) {
      setFlash({ tone: 'error', message: 'Title and message are required' });
      return;
    }
    const result = await send({ userIds: recipientUserIds, type, title, body, channel, actionUrl: actionUrl || undefined });
    if (result.success) {
      setFlash({ tone: 'success', message: result.message });
      setTitle('');
      setBody('');
      onBroadcast?.(result.message);
    } else {
      setFlash({ tone: 'error', message: result.message });
    }
    setTimeout(() => setFlash(null), 4000);
  };

  const handleSendAll = async () => {
    if (!title.trim() || !body.trim()) {
      setFlash({ tone: 'error', message: 'Title and message are required' });
      return;
    }
    const result = await sendToAll({ type, title, body, channel });
    if (result.success) {
      setFlash({ tone: 'success', message: result.message });
      setTitle('');
      setBody('');
      onBroadcast?.(result.message);
    } else {
      setFlash({ tone: 'error', message: result.message });
    }
    setTimeout(() => setFlash(null), 4000);
  };

  return (
    <Card title="Send Notification" description="Broadcast to selected users or all active users" icon={SendIcon}>
      {flash && <Flash tone={flash.tone === 'success' ? 'success' : 'error'} message={flash.message} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Notification type" required>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Channel" required>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as NotificationChannel)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Title" required>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </Field>

      <div className="mt-3">
        <Field label="Message" required>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message body"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>
      </div>

      <Field label="Action URL (optional)">
        <input
          value={actionUrl}
          onChange={(e) => setActionUrl(e.target.value)}
          placeholder="https://example.com/action"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </Field>

      {lastResult && (
        <p className="mt-3 text-sm text-gray-500">{lastResult}</p>
      )}

      <div className="flex items-center gap-3 mt-5">
        <Button onClick={handleSendSelected} loading={sending}>
          <SendIcon className="w-4 h-4" />
          {recipientUserIds?.length ? `Send to ${recipientUserIds.length} users` : 'Send'}
        </Button>
        <Button variant="secondary" onClick={handleSendAll} loading={sending}>
          <GlobeIcon className="w-4 h-4" />
          Send to All
        </Button>
        {stats && (
          <span className="text-xs text-gray-400 ml-auto">
            {stats.today} sent today · {stats.total} total
          </span>
        )}
      </div>
    </Card>
  );
}
