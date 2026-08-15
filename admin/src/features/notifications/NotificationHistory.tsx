'use client';

import { useState, useMemo, useEffect } from 'react';
import { BellIcon, MailIcon, SmartphoneIcon, GlobeIcon, SearchIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useNotificationHistory } from './hooks';
import type { NotificationRow } from '@/services/api/notificationService';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  in_app: <BellIcon className="w-3 h-3" />,
  email: <MailIcon className="w-3 h-3" />,
  sms: <SmartphoneIcon className="w-3 h-3" />,
  push: <SmartphoneIcon className="w-3 h-3" />,
  all: <GlobeIcon className="w-3 h-3" />,
};

const CHANNEL_TONES: Record<string, 'blue' | 'green' | 'yellow' | 'purple' | 'gray'> = {
  in_app: 'blue',
  email: 'green',
  sms: 'yellow',
  push: 'purple',
  all: 'gray',
};

export default function NotificationHistory() {
  const { notifications, loading, error, page, totalPages, total, filters, load, updateFilters, setPage } = useNotificationHistory();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    updateFilters({ type: typeFilter || undefined, search: search || undefined });
  }, [typeFilter, search]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.body || '').toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || n.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [notifications, search, typeFilter]);

  const columns: Column<NotificationRow>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (n) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{n.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-md">{n.body}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (n) => (
        <Badge tone="indigo">{(n.type || 'unknown').replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (n) => (
        <span className="inline-flex items-center gap-1 text-xs capitalize text-gray-600">
          {CHANNEL_ICONS[n.channel] || <BellIcon className="w-3 h-3" />}
          {n.channel || 'in_app'}
        </span>
      ),
    },
    {
      key: 'readAt',
      header: 'Status',
      render: (n) =>
        n.readAt ? (
          <Badge tone="green">Read</Badge>
        ) : (
          <Badge tone="yellow">Unread</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Sent',
      render: (n) => (
        <span className="text-xs text-gray-500">
          {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  return (
    <Card title="Notification History" description={`${total} notifications sent across the platform`} icon={BellIcon}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or message..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="course">Course</option>
          <option value="exam">Exam</option>
          <option value="assignment">Assignment</option>
          <option value="payment">Payment</option>
          <option value="result">Result</option>
          <option value="announcement">Announcement</option>
          <option value="study_reminder">Study Reminder</option>
          <option value="subscription_expiry">Subscription Expiry</option>
          <option value="system">System</option>
        </select>
        {(search || typeFilter) && (
          <Button variant="ghost" onClick={() => { setSearch(''); setTypeFilter(''); }} className="text-xs">
            Clear
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyIcon={BellIcon}
        emptyTitle="No notifications yet"
        emptyMessage="Notifications will appear here once they are sent."
        keyField={(n) => n.id}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="text-xs px-3 py-1"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="text-xs px-3 py-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
