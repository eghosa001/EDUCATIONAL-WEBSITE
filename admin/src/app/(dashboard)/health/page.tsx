'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuthStore } from '@/state/auth';

export interface HealthStatus {
  success: boolean;
  message: string;
  timestamp: string;
  version: string;
  environment: string;
  database: {
    local: string;
    supabase: string;
    mode: string;
  };
}

export default function HealthPage() {
  const { token } = useAdminAuthStore();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/health', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check health');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Checking system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <button onClick={checkHealth} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {health && (
        <>
          {/* Overall Status */}
          <div className={`rounded-xl border p-6 ${health.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${health.success ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-lg font-semibold">{health.success ? 'All Systems Operational' : 'Degraded Performance'}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{health.message}</p>
            <p className="mt-1 text-xs text-gray-400">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Database Connectivity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Local PostgreSQL', status: health.database.local, detail: health.database.mode.includes('local') ? 'Active' : 'Inactive' },
                { label: 'Supabase PostgreSQL', status: health.database.supabase, detail: health.database.mode.includes('supabase') ? 'Active' : 'Inactive' },
                { label: 'Connection Mode', status: health.database.mode, detail: '' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${item.status === 'ok' ? 'bg-green-500' : item.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.detail || item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Version', value: health.version },
                { label: 'Environment', value: health.environment },
                { label: 'Uptime', value: 'Running' },
                { label: 'API Prefix', value: '/api/v1' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{item.label}</p>
                  <p className="font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services Status (mock — would check actual services) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Service Status</h2>
            <div className="space-y-3">
              {[
                { name: 'API Server', status: 'healthy', detail: 'Express on port 3000' },
                { name: 'JWT Authentication', status: 'healthy', detail: 'Token validation active' },
                { name: 'Email Service', status: 'healthy', detail: 'Nodemailer configured' },
                { name: 'FCM Push Notifications', status: 'healthy', detail: 'Firebase Admin SDK ready' },
                { name: 'Redis Cache', status: 'unknown', detail: 'Not connected (optional)' },
                { name: 'BullMQ Queue', status: 'unknown', detail: 'Not connected (optional)' },
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'unknown' ? 'bg-gray-300' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{service.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
