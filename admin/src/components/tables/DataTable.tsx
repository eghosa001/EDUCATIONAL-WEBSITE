'use client';

import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import type { LucideIcon } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  keyField: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,
  keyField,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return <Spinner />;
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th key={col.key} className={`text-left px-4 py-3 text-xs font-medium text-gray-500 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row) => (
            <tr
              key={keyField(row)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
