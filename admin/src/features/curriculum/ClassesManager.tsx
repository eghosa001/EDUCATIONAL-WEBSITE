'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, LayoutGridIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import { useClasses } from './hooks';
import type { ClassRoomRow } from '@/services/api/educationService';

interface FormState {
  name: string;
  code: string;
  description: string;
  order_index: number;
}

export default function ClassesManager() {
  const { systems, levels, programs, classes, loading, error, selectLevel, selectProgram, add, selectedProgram } = useClasses();
  const [selectedLevel, setSelectedLevel] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', code: '', description: '', order_index: 1 });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (levels.length && !selectedLevel) {
      setSelectedLevel(levels[0].id);
      selectLevel(levels[0].id);
    }
  }, [levels, selectedLevel, selectLevel]);

  const openCreate = () => {
    setForm({ name: '', code: '', description: '', order_index: classes.length + 1 });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await add(selectedProgram, {
        name: form.name,
        code: form.code,
        description: form.description,
        orderIndex: form.order_index,
      });
      setFlash('Class created');
      setModalOpen(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ClassRoomRow>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-sm text-gray-600">{c.code}</span> },
    { key: 'name', header: 'Name', render: (c) => <span className="text-sm font-medium text-gray-900">{c.name}</span> },
    { key: 'order', header: 'Order', render: (c) => <span className="text-sm text-gray-500">{c.order_index}</span> },
  ];

  if (loading && !classes.length) return <Spinner label="Loading classes..." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            selectLevel(e.target.value);
          }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={selectedProgram}
          onChange={(e) => selectProgram(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          {programs.length === 0 && <option value="">No programs</option>}
        </select>
        <Button onClick={openCreate} disabled={!selectedProgram}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Add Class
        </Button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <DataTable
        columns={columns}
        data={classes}
        loading={loading}
        emptyIcon={LayoutGridIcon}
        emptyTitle="No classes yet"
        emptyMessage="Add a class to this program."
        keyField={(c) => c.id}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Class">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Senior Secondary 1A" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SSS1A" />
            </Field>
          </div>
          <Field label="Order">
            <Input type="number" min={1} value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.code || !selectedProgram}>
              {saving ? 'Saving...' : 'Create Class'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
