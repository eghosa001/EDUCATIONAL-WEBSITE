'use client';

import { useState } from 'react';
import { PlusIcon, GraduationCapIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import { formatNumber } from '@/utils/format';
import { useLevels } from './hooks';
import type { EducationLevelRow } from '@/services/api/educationService';

interface FormState {
  name: string;
  code: string;
  order_index: number;
  min_age: number;
  max_age: number;
}

export default function LevelsManager() {
  const { systems, levels, selectedSystem, setSelectedSystem, loading, error, add } = useLevels();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', code: '', order_index: 1, min_age: 0, max_age: 0 });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  const selected = selectedSystem || systems[0]?.id || '';
  const showLevels = Boolean(selected) && !loading;

  const openCreate = () => {
    setForm({ name: '', code: '', order_index: levels.length + 1, min_age: 0, max_age: 0 });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await add(selected, {
        name: form.name,
        code: form.code,
        orderIndex: form.order_index,
        minAge: form.min_age,
        maxAge: form.max_age,
      });
      setFlash('Level created');
      setModalOpen(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<EducationLevelRow>[] = [
    { key: 'order', header: 'Order', render: (l) => <span className="text-sm text-gray-500">{l.order_index}</span> },
    { key: 'code', header: 'Code', render: (l) => <span className="font-mono text-sm text-gray-600">{l.code}</span> },
    { key: 'name', header: 'Name', render: (l) => <span className="text-sm font-medium text-gray-900">{l.name}</span> },
    {
      key: 'age',
      header: 'Age range',
      render: (l) => <span className="text-sm text-gray-600">{l.min_age && l.max_age ? `${l.min_age}–${l.max_age}` : '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">System:</span>
          <select
            value={selected}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={openCreate} disabled={!selected}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Add Level
        </Button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}
      {loading && <Spinner label="Loading levels..." />}

      {showLevels && (
        <DataTable
          columns={columns}
          data={levels}
          loading={false}
          emptyIcon={GraduationCapIcon}
          emptyTitle="No levels yet"
          emptyMessage="Add an education level to this system."
          keyField={(l) => l.id}
        />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Education Level">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Junior Secondary 1" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. JSS1" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Order">
              <Input type="number" min={1} value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} />
            </Field>
            <Field label="Min age">
              <Input type="number" min={0} value={form.min_age} onChange={(e) => setForm({ ...form, min_age: Number(e.target.value) })} />
            </Field>
            <Field label="Max age">
              <Input type="number" min={0} value={form.max_age} onChange={(e) => setForm({ ...form, max_age: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.code}>
              {saving ? 'Saving...' : 'Create Level'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
