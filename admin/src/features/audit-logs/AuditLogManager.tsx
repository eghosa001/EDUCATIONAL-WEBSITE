'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchAuditLogs, type AuditLog } from '@/services/api/adminService';

export default function AuditLogViewer() {
  const { token } = useAdminAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchAuditLogs(token, page, 20);
      setLogs(res.data?.logs || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input
          placeholder="Search user..."
          value={filterUser}
          onChange={e => { setFilterUser(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          placeholder="Action (e.g. login, create)..."
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => { setFilterUser(''); setFilterAction(''); setFilterStartDate(''); setFilterEndDate(''); setPage(1); }}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Time', 'User', 'Action', 'Resource', 'Details', 'IP'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No audit logs found</td></tr>
            ) : logs.map((log: AuditLog) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.userId || 'System'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    log.action?.includes('create') || log.action?.includes('add') ? 'bg-green-100 text-green-700' :
                    log.action?.includes('update') || log.action?.includes('edit') ? 'bg-blue-100 text-blue-700' :
                    log.action?.includes('delete') || log.action?.includes('remove') ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.action || 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.resourceType && log.resourceId ? `${log.resourceType}:${log.resourceId}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{JSON.stringify(log.changes || {})}</td>
                <td className="px-4 py-3 text-sm text-gray-400 font-mono">{log.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              Previous
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
