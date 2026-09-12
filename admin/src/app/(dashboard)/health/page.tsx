'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { apiConfig } from '@/services/api/config';

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
  services: {
    api: string;
    database: string;
  };
}

const statusDot = (status: string) => status === 'healthy' || status === 'ok'
  ? 'bg-green-500'
  : status === 'inactive'
    ? 'bg-gray-300'
    : 'bg-red-500';

export default function HealthPage() {
  const { token } = useAdminAuthStore();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiConfig.baseUrl}/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const data = (await res.json()) as HealthStatus;
      setHealth(data);
      if (!res.ok && !data.message) setError(`Health check failed (${res.status})`);
    } catch (err) {
      setHealth(null);
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
          <div className={`rounded-xl border p-6 ${health.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${health.success ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-lg font-semibold">{health.success ? 'All Probed Systems Operational' : 'Degraded Performance'}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{health.message}</p>
            <p className="mt-1 text-xs text-gray-400">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Database Connectivity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Local PostgreSQL', status: health.database.local, detail: health.database.mode === 'local' ? 'Configured database' : 'Not configured' },
                { label: 'Supabase PostgreSQL', status: health.database.supabase, detail: health.database.mode === 'supabase' ? 'Configured database' : 'Not configured' },
                { label: 'Connection Mode', status: health.database.mode, detail: 'Active backend database mode' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${item.label === 'Connection Mode' ? 'bg-blue-500' : statusDot(item.status)}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.detail}: {item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Version', value: health.version },
                { label: 'Environment', value: health.environment },
                { label: 'API', value: health.services.api },
                { label: 'Database', value: health.services.database },
              ].map(item => (
                <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{item.label}</p>
                  <p className="font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Probe Coverage</h2>
            <p className="text-sm text-gray-600">
              This page verifies the API process and its configured database connection. Email, push notifications,
              queues, caches, and payment gateways are not shown as healthy unless they have their own live probe.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
