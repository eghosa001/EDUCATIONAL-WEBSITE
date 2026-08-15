'use client';

import { useState } from 'react';
import { DownloadIcon, CreditCardIcon, RotateCcwIcon, SearchIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Badge, { statusTone } from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatNaira, formatDate } from '@/utils/format';
import { usePayments } from './hooks';
import type { Payment } from '@/services/api/paymentService';

const paymentStatusTone = (status: string): 'green' | 'yellow' | 'red' | 'blue' =>
  status === 'completed' ? 'green' : status === 'refunded' ? 'blue' : status === 'pending' ? 'yellow' : 'red';

export default function PaymentsManager() {
  const { payments, stats, loading, error, reload, refund } = usePayments();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [flash, setFlash] = useState('');

  const filtered = payments.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim().toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completedTotal = stats?.completed?.total_amount ?? 0;

  const doRefund = async () => {
    if (!refundTarget) return;
    try {
      await refund(refundTarget.id, 'Refund requested by admin');
      setFlash(`Payment ${refundTarget.reference} refunded`);
      setRefundTarget(null);
      setTimeout(() => setFlash(''), 4000);
    } catch (err) {
      setFlash((err as Error).message || 'Refund failed');
    }
  };

  if (loading) return <Spinner label="Loading payments..." />;

  const columns: Column<Payment>[] = [
    {
      key: 'user',
      header: 'User',
      render: (p) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {p.first_name} {p.last_name}
          </p>
          <p className="text-xs text-gray-400">{p.email || p.userId}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => <span className="text-sm font-semibold text-gray-900">{formatNaira(p.amount)}</span>,
    },
    { key: 'method', header: 'Method', render: (p) => <span className="text-sm text-gray-500 capitalize">{p.method || '—'}</span> },
    {
      key: 'reference',
      header: 'Reference',
      render: (p) => <span className="text-xs font-mono text-gray-500">{p.reference}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge tone={paymentStatusTone(p.status)}>{p.status}</Badge>,
    },
    { key: 'date', header: 'Date', render: (p) => <span className="text-sm text-gray-500">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) =>
        p.status === 'completed' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setRefundTarget(p); }}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <RotateCcwIcon className="w-3.5 h-3.5" /> Refund
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <DownloadIcon className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Completed" value={formatNaira(stats?.completed?.total_amount ?? 0)} icon={CreditCardIcon} tone="green" />
        <StatCard label="Total Payments" value={String(stats?.total?.total ?? payments.length)} icon={CreditCardIcon} tone="blue" />
        <StatCard label="Gross Revenue" value={formatNaira(stats?.total?.total_amount ?? completedTotal)} icon={CreditCardIcon} tone="purple" />
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or reference..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {flash && <Flash tone={flash.toLowerCase().includes('failed') ? 'error' : 'success'} message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        emptyIcon={CreditCardIcon}
        emptyTitle="No payments found"
        emptyMessage="Payments appear here once users make purchases."
        keyField={(p) => p.id}
      />

      <ConfirmDialog
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        onConfirm={doRefund}
        title="Refund payment"
        message={`Refund ${refundTarget ? formatNaira(refundTarget.amount) : ''} for ${refundTarget?.first_name} ${refundTarget?.last_name}? A wallet credit will be issued.`}
        confirmLabel="Refund"
        tone="danger"
      />
    </div>
  );
}
