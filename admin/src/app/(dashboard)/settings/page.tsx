'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    platformName: 'EduPlatform',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    maintenanceMode: false,
    registrationOpen: true,
    aiEnabled: true,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input value={settings.platformName} onChange={e => setSettings(p => ({ ...p, platformName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={settings.currency} onChange={e => setSettings(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                <option>NGN</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={settings.timezone} onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                <option>Africa/Lagos</option>
                <option>Africa/Nairobi</option>
                <option>Africa/Accra</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Features</h2>
          <div className="space-y-3">
            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Take the platform offline for updates' },
              { key: 'registrationOpen', label: 'Allow Registration', desc: 'Let new users create accounts' },
              { key: 'aiEnabled', label: 'AI Tutor', desc: 'Enable AI-powered tutoring' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <input type="checkbox" checked={settings[item.key as keyof typeof settings] as boolean} onChange={() => setSettings(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
