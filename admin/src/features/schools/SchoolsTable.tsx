'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2Icon, MapPinIcon, PhoneIcon, MailIcon, TrashIcon, EyeIcon, SearchIcon, ShieldCheckIcon, ShieldXIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Badge, { statusTone } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Flash from '@/components/ui/Flash';
import { formatNumber, formatDate } from '@/utils/format';
import { useSchools } from './hooks';
import type { SchoolRow } from '@/services/api/schoolService';

export default function SchoolsTable() {
  const router = useRouter();
  const { schools, loading, error, reload, removeSchool, setStatus } = useSchools();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<SchoolRow | null>(null);
  const [toggling, setToggling] = useState<SchoolRow | null>(null);
  const [flash, setFlash] = useState('');

  const filtered = schools.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<SchoolRow>[] = [
    {
      key: 'school',
      header: 'School',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {(s.name?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{s.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPinIcon className="w-3 h-3" /> {[s.state, s.lga].filter(Boolean).join(', ') || '—'} · {s.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (s) => (
        <div className="text-sm text-gray-600 space-y-0.5">
          {s.email && <p className="flex items-center gap-1"><MailIcon className="w-3 h-3" /> {s.email}</p>}
          {s.phone && <p className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {s.phone}</p>}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      render: (s) => (
        <span className="text-sm text-gray-600">
          {formatNumber(s.student_count ?? 0)} students · {formatNumber(s.teacher_count ?? 0)} teachers
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge tone={statusTone(s.status === 'active' ? 'active' : 'inactive')}>{s.status}</Badge>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (s) => <span className="text-sm text-gray-500">{formatDate(s.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/schools/${s.id}`); }}
            title="View"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setToggling(s); }}
            title={s.status === 'active' ? 'Deactivate' : 'Activate'}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
          >
            {s.status === 'active' ? <ShieldXIcon className="w-4 h-4" /> : <ShieldCheckIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleting(s); }}
            title="Delete"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyIcon={Building2Icon}
        emptyTitle="No schools found"
        emptyMessage="Schools appear here once they onboard onto the platform."
        keyField={(s) => s.id}
        onRowClick={(s) => router.push(`/schools/${s.id}`)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await removeSchool(deleting.id);
          setFlash(`${deleting.name} deleted`);
          setDeleting(null);
          setTimeout(() => setFlash(''), 3000);
        }}
        title="Delete school"
        message={`Permanently delete ${deleting?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={Boolean(toggling)}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          if (!toggling) return;
          const next = toggling.status === 'active' ? 'inactive' : 'active';
          await setStatus(toggling.id, next);
          setFlash(`${toggling.name} ${next === 'active' ? 'activated' : 'deactivated'}`);
          setToggling(null);
          setTimeout(() => setFlash(''), 3000);
        }}
        title={toggling?.status === 'active' ? 'Deactivate school' : 'Activate school'}
        message={`Change status of ${toggling?.name} to ${toggling?.status === 'active' ? 'inactive' : 'active'}?`}
        confirmLabel={toggling?.status === 'active' ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
