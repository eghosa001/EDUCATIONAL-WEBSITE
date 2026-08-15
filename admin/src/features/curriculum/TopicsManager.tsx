'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, SearchIcon, FileTextIcon, PencilIcon, TrashIcon } from 'lucide-react';
import DataTable, { type Column } from '@/components/tables/DataTable';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Toggle from '@/components/ui/Toggle';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatNumber } from '@/utils/format';
import { useTopics, useSubjects } from './hooks';
import { fetchTerms } from '@/services/api/educationService';
import { useAdminAuthStore } from '@/state/auth';
import type { TopicRow } from '@/services/api/curriculumService';

interface FormState {
  subject_id: string;
  term_id: string;
  name: string;
  code: string;
  description: string;
  estimated_hours: number;
  order_index: number;
  is_active: boolean;
}

export default function TopicsManager() {
  const { topics, loading, error, reload, add, update, remove } = useTopics();
  const { subjects } = useSubjects();
  const [terms, setTerms] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TopicRow | null>(null);
  const [form, setForm] = useState<FormState>({
    subject_id: '',
    term_id: '',
    name: '',
    code: '',
    description: '',
    estimated_hours: 1,
    order_index: 1,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TopicRow | null>(null);
  const [flash, setFlash] = useState('');

  const { token } = useAdminAuthStore();
  useEffect(() => {
    if (!token) return;
    fetchTerms(token)
      .then((res) => setTerms(res.data.terms || []))
      .catch(() => setTerms([]));
  }, [token]);

  const subjectName = (id?: string) => subjects.find((s) => s.id === id)?.name ?? '—';
  const termName = (id?: string) => terms.find((t) => t.id === id)?.name ?? '—';
  const filtered = topics.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || subjectName(t.subject_id).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      subject_id: subjects[0]?.id ?? '',
      term_id: terms[0]?.id ?? '',
      name: '',
      code: '',
      description: '',
      estimated_hours: 1,
      order_index: topics.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (topic: TopicRow) => {
    setEditing(topic);
    setForm({
      subject_id: topic.subject_id ?? '',
      term_id: topic.term_id ?? terms[0]?.id ?? '',
      name: topic.name,
      code: topic.code,
      description: topic.description ?? '',
      estimated_hours: topic.estimated_hours ?? 1,
      order_index: topic.order_index ?? 1,
      is_active: topic.is_active,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        subjectId: form.subject_id,
        termId: form.term_id,
        name: form.name,
        code: form.code,
        description: form.description,
        estimatedHours: form.estimated_hours,
        orderIndex: form.order_index,
        isActive: form.is_active,
      };
      if (editing) await update(editing.id, payload);
      else await add(payload);
      setFlash(editing ? 'Topic updated' : 'Topic created');
      setModalOpen(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading topics..." />;

  const columns: Column<TopicRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (t) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{t.name}</p>
          <p className="text-xs text-gray-400 font-mono">{t.code}</p>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (t) => <span className="text-sm text-gray-600">{subjectName(t.subject_id)}</span> },
    { key: 'term', header: 'Term', render: (t) => <span className="text-sm text-gray-600">{termName(t.term_id)}</span> },
    { key: 'subtopics', header: 'Subtopics', render: (t) => <span className="text-sm text-gray-600">{formatNumber(t.subtopics_count ?? 0)}</span> },
    { key: 'hours', header: 'Est. hours', render: (t) => <span className="text-sm text-gray-600">{t.estimated_hours ?? '—'}</span> },
    {
      key: 'active',
      header: 'Status',
      render: (t) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {t.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(t); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleting(t); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Add Topic
        </Button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        emptyIcon={FileTextIcon}
        emptyTitle="No topics found"
        emptyMessage="Create topics under your subjects."
        keyField={(t) => t.id}
      />

          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Topic' : 'Add Topic'}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Subject" required>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Term" required>
                  <select
                    value={form.term_id}
                    onChange={(e) => setForm({ ...form, term_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select term</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Algebra Basics" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ALG-01" />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estimated hours">
              <Input
                type="number"
                min={1}
                value={form.estimated_hours}
                onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })}
              />
            </Field>
            <Field label="Order index">
              <Input
                type="number"
                min={1}
                value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Active</span>
            <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.code || !form.subject_id || !form.term_id}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await remove(deleting.id);
          setFlash(`${deleting.name} deleted`);
          setDeleting(null);
          setTimeout(() => setFlash(''), 3000);
        }}
        title="Delete topic"
        message={`Delete ${deleting?.name}? Its subtopics will also be removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
