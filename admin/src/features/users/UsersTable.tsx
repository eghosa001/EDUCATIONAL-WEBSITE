'use client';

import { useState } from 'react';
import { UserIcon, MailIcon, ShieldCheckIcon, PencilIcon, TrashIcon, SearchIcon, UsersIcon, EyeIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/utils/format';
import { useUsers, hasRole } from './hooks';
import type { AdminUserRow } from '@/services/api/userService';

interface UsersTableProps {
  roleFilter?: 'student' | 'parent' | 'teacher' | 'all';
}

export default function UsersTable({ roleFilter = 'all' }: UsersTableProps) {
  const { users, loading, error, reload, removeUser } = useUsers();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewing, setViewing] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);
  const [flash, setFlash] = useState('');

  const filtered = users.filter((u) => {
    const roleOk = roleFilter === 'all' ? true : hasRole(u, roleFilter);
    const searchOk =
      !search ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return roleOk && searchOk && statusOk;
  });

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {(u.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MailIcon className="w-3 h-3" /> {u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {(u.roles || []).map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
              <UserIcon className="w-3 h-3" />
              {r.replace('_', ' ')}
            </span>
          ))}
          {(u.roles || []).length === 0 && <span className="text-xs text-gray-400">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span className="inline-flex items-center gap-1">
          <Badge tone={statusTone(u.isActive ? 'active' : 'inactive')}>
            <ShieldCheckIcon className="w-3 h-3 mr-1" />
            {u.isActive ? 'active' : 'inactive'}
          </Badge>
          {u.isVerified && <Badge tone="green">verified</Badge>}
        </span>
      ),
    },
    {
      key: 'createdAt',
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
            onClick={(e) => { e.stopPropagation(); setViewing(u); }}
            title="View"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {u.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleting(u); }}
              title="Deactivate"
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {flash && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{flash}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyIcon={UsersIcon}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search or filters."
        keyField={(u) => u.id}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await removeUser(deleting.id);
          setDeleting(null);
          setFlash(`${deleting.firstName} ${deleting.lastName} deactivated`);
          setTimeout(() => setFlash(''), 3000);
        }}
        title="Deactivate user"
        message={`Deactivate ${deleting?.firstName} ${deleting?.lastName}? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
      />

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="User Details">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                {(viewing.firstName?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {viewing.firstName} {viewing.lastName}
                </p>
                <p className="text-sm text-gray-500">{viewing.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Roles</p>
                <p className="font-medium text-gray-900">{(viewing.roles || []).join(', ') || 'None'}</p>
              </div>
              <div>
                <p className="text-gray-500">Verified</p>
                <p className="font-medium text-gray-900">{viewing.isVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{viewing.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">{formatDate(viewing.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Last login</p>
                <p className="font-medium text-gray-900">{viewing.lastLoginAt ? formatDate(viewing.lastLoginAt) : 'Never'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
