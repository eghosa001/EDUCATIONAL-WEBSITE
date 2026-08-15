'use client';

import { useState } from 'react';
import { BellIcon, UsersIcon, LayoutTemplateIcon, HistoryIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import BroadcastComposer from '@/features/notifications/BroadcastComposer';
import NotificationHistory from '@/features/notifications/NotificationHistory';
import TemplateManager from '@/features/notifications/TemplateManager';
import { useNotificationStats } from '@/features/notifications/hooks';

type Tab = 'broadcast' | 'history' | 'templates';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('broadcast');
  const { stats, loading } = useNotificationStats();

  const tabs: Array<{ id: Tab; label: string; icon: typeof BellIcon }> = [
    { id: 'broadcast', label: 'Broadcast', icon: BellIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Send broadcasts and manage notification templates"
      />

      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sent" value={String(stats.total)} icon={BellIcon} tone="indigo" />
          <StatCard label="Sent Today" value={String(stats.today)} icon={BellIcon} tone="blue" />
          <StatCard label="Unread" value={String(stats.unread)} icon={UsersIcon} tone="yellow" />
          <StatCard label="Channels" value="4" icon={BellIcon} tone="green" />
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'broadcast' && <BroadcastComposer />}
      {activeTab === 'history' && <NotificationHistory />}
      {activeTab === 'templates' && <TemplateManager />}
    </div>
  );
}
