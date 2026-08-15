'use client';

import { useState } from 'react';
import { UsersIcon, BadgeCheckIcon, BanIcon, RefreshCwIcon, EyeIcon, MailIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Badge, { statusTone } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Flash from '@/components/ui/Flash';
import { formatNumber, formatDate } from '@/utils/format';
import { useTeachers, type TeacherProfile } from './hooks';
import { verifyTeacher } from '@/services/api/teacherService';
import { useAdminAuthStore } from '@/state/auth';
import type { AdminUserRow } from '@/services/api/userService';

export default function TeachersTable() {
  const { token } = useAdminAuthStore();
  const { teachers, loading, error, reload, getProfile } = useTeachers();
  const [viewing, setViewing] = useState<TeacherProfile | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<AdminUserRow | null>(null);
  const [flash, setFlash] = useState('');

  const openProfile = async (user: AdminUserRow) => {
    setViewingLoading(true);
    const profile = await getProfile(user.id);
    setViewingLoading(false);
    if (profile) setViewing(profile);
    else setFlash(`Could not load profile for ${user.firstName} ${user.lastName}`);
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'Teacher',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
            {(u.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
              {u.firstName} {u.lastName}
              {u.isVerified && <BadgeCheckIcon className="w-4 h-4 text-emerald-500" />}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MailIcon className="w-3 h-3" /> {u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'verified',
      header: 'Verification',
      render: (u) =>
        u.isVerified ? <Badge tone="green">Verified</Badge> : <Badge tone="yellow">Pending</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge tone={statusTone(u.isActive ? 'active' : 'inactive')}>{u.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u) => <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openProfile(u); }}
            title="View profile"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {u.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); setVerifyTarget(u); }}
              title="Toggle verification"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              {u.isVerified ? <BanIcon className="w-4 h-4" /> : <BadgeCheckIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  const toggleVerification = async () => {
    if (!verifyTarget || !token) return;
    try {
      await verifyTeacher(token, verifyTarget.id, !verifyTarget.isVerified);
      setFlash(`Verification ${verifyTarget.isVerified ? 'revoked' : 'granted'} for ${verifyTarget.firstName} ${verifyTarget.lastName}`);
    } catch (err) {
      setFlash((err as Error).message || 'Update failed');
    } finally {
      setVerifyTarget(null);
      reload();
      setTimeout(() => setFlash(''), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCwIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {flash && <Flash tone={flash.toLowerCase().includes('could not') ? 'error' : 'success'} message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <DataTable
        columns={columns}
        data={teachers}
        loading={loading}
        emptyIcon={UsersIcon}
        emptyTitle="No teachers found"
        emptyMessage="Teachers appear here once they join the platform."
        keyField={(u) => u.id}
      />

      <ConfirmDialog
        isOpen={Boolean(verifyTarget)}
        onClose={() => setVerifyTarget(null)}
        onConfirm={toggleVerification}
        title={verifyTarget?.isVerified ? 'Revoke verification' : 'Verify teacher'}
        message={`${verifyTarget?.isVerified ? 'Revoke' : 'Grant'} verification for ${verifyTarget?.firstName} ${verifyTarget?.lastName}?`}
        confirmLabel={verifyTarget?.isVerified ? 'Revoke' : 'Verify'}
      />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
                  {(viewing.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewing.firstName} {viewing.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{viewing.email}</p>
                </div>
              </div>
              {viewingLoading ? (
                <p className="text-sm text-gray-400 py-4">Loading profile...</p>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">{formatNumber(viewing.taughtCourses ?? 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Courses taught</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">{formatNumber(viewing.enrolledCourses ?? 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Enrolled</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">{viewing.isVerified ? 'Yes' : 'No'}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified</p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewing(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
