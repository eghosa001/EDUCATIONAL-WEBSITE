'use client';

import { SettingsIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import { useSettings, parseBool } from './hooks';

export default function SettingsManager() {
  const { values, loaded, loading, saving, error, reload, set, save, savedFlash } = useSettings();

  if (loading) return <Spinner label="Loading settings..." />;

  const toggles = [
    { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Take the platform offline for updates' },
    { key: 'registration_open', label: 'Allow Registration', desc: 'Let new users create accounts' },
    { key: 'ai_enabled', label: 'AI Tutor', desc: 'Enable AI-powered tutoring' },
  ];

  return (
    <div className="space-y-6">
      <Card title="General" description="Platform-level configuration" icon={SettingsIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
            <input
              value={values.platform_name}
              onChange={(e) => set('platform_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={values.currency}
              onChange={(e) => set('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>NGN</option>
              <option>USD</option>
              <option>GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={values.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Africa/Lagos</option>
              <option>Africa/Nairobi</option>
              <option>Africa/Accra</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Features" description="Feature flags applied across the platform">
        <div className="space-y-3">
          {toggles.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Toggle
                checked={parseBool(values[item.key])}
                onChange={(v) => set(item.key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      {error && <Flash tone="error" message={error} />}
      {savedFlash && !error && <Flash tone="success" message="Settings saved" />}

      <div className="flex items-center gap-3 justify-end">
        {loaded && (
          <button onClick={reload} className="text-sm text-gray-500 hover:text-gray-700">
            Reload
          </button>
        )}
        <Button onClick={save} loading={saving} disabled={!loaded}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
