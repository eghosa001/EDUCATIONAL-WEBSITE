'use client';

import PageHeader from '@/components/ui/PageHeader';
import SettingsManager from '@/features/settings/SettingsManager';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Platform-wide configuration" />
      <SettingsManager />
    </div>
  );
}
