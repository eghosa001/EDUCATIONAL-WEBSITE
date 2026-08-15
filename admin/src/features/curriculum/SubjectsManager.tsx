'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, BookOpenIcon, SearchIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import Toggle from '@/components/ui/Toggle';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatNumber } from '@/utils/format';
import { useAdminAuthStore } from '@/state/auth';
import { useSubjects } from './hooks';
import { fetchSystems } from '@/services/api/educationService';
import type { EducationSystemRow } from '@/services/api/educationService';
import type { SubjectRow } from '@/services/api/curriculumService';

interface FormState {
  educationSystemId: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  orderIndex: number;
  isCore: boolean;
}

const emptyForm: FormState = { educationSystemId: '', name: '', code: '', description: '', icon: '', color: '#6366F1', orderIndex: 1, isCore: false };

export default function SubjectsManager() {
  const { token } = useAdminAuthStore();
  const { subjects, loading, error, reload, add, update, remove } = useSubjects();
  const [systems, setSystems] = useState<EducationSystemRow[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SubjectRow | null>(null);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchSystems(token)
      .then((res) => {
        const sys = res.data.systems || [];
        setSystems(sys);
        if (sys.length) setForm((f) => ({ ...f, educationSystemId: f.educationSystemId || sys[0].id }));
      })
      .catch(() => setSystems([]));
  }, [token]);

  const systemName = (id?: string) => systems.find((s) => s.id === id)?.name ?? '—';
  const filtered = subjects.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, educationSystemId: systems[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (subject: SubjectRow) => {
    setEditing(subject);
    setForm({
      educationSystemId: subject.education_system_id ?? systems[0]?.id ?? '',
      name: subject.name,
      code: subject.code,
      description: subject.description ?? '',
      icon: subject.icon ?? '',
      color: subject.color ?? '#6366F1',
      orderIndex: subject.order_index ?? 1,
      isCore: subject.is_core,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        educationSystemId: form.educationSystemId,
        name: form.name,
        code: form.code,
        description: form.description,
        icon: form.icon,
        color: form.color,
        orderIndex: form.orderIndex,
        isCore: form.isCore,
      };
      if (editing) await update(editing.id, payload);
      else await add(payload);
      setFlash(editing ? 'Subject updated' : 'Subject created');
      setModalOpen(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading subjects..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-1.5" /> Add Subject
        </Button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <BookOpenIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No subjects found. Create your first subject.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: s.color || '#6366F1' }}
                  >
                    {(s.code?.[0] || s.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3 line-clamp-2">{s.description || 'No description'}</p>
              <div className="flex gap-4 mt-4 text-sm text-gray-500">
                <span>{formatNumber(s.topics_count ?? 0)} topics</span>
                <span>{formatNumber(s.courses_count ?? 0)} courses</span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => openEdit(s)} className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg inline-flex items-center justify-center gap-1">
                  <PencilIcon className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeleting(s)} className="flex-1 text-sm text-red-600 hover:bg-red-50 py-1.5 rounded-lg inline-flex items-center justify-center gap-1">
                  <TrashIcon className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Field label="Education system" required>
            <select
              value={form.educationSystemId}
              onChange={(e) => setForm({ ...form, educationSystemId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select system</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Order">
              <Input type="number" min={1} value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: Number(e.target.value) })} />
            </Field>
            <Field label="Color">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
            </Field>
          </div>
          <Field label="Icon name (optional)">
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. book-open" />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the subject"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Core subject</span>
              <Toggle checked={form.isCore} onChange={(v) => setForm({ ...form, isCore: v })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.code || !form.educationSystemId}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Subject'}
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
        title="Delete subject"
        message={`Delete ${deleting?.name}? This will also remove its topics.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
