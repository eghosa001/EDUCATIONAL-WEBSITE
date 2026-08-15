'use client';

import { useState } from 'react';
import { Users, GraduationCap, Layers, BookOpen, MapPin, Phone, Mail, Pencil, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Badge, { statusTone } from '@/components/ui/Badge';
import Flash from '@/components/ui/Flash';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import { formatNumber } from '@/utils/format';
import { useSchool } from './useSchool';

export default function SchoolDetail({ id }: { id: string }) {
  const { school, stats, loading, error, save } = useSchool(id);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');

  if (loading) return <Spinner label="Loading school..." />;

  if (error || !school) return <Flash tone="error" message={error || 'School not found'} />;

  const startEdit = () => {
    setForm({
      name: school.name || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      state: school.state || '',
      lga: school.lga || '',
      type: school.type || '',
    });
    setEditing(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save(form);
      setFlash('School updated');
      setEditing(false);
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash((err as Error).message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: 'Students', value: formatNumber(Number(stats?.students ?? school.student_count ?? 0)), icon: Users, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Teachers', value: formatNumber(Number(stats?.teachers ?? school.teacher_count ?? 0)), icon: GraduationCap, tone: 'text-purple-600 bg-purple-50' },
    { label: 'Classes', value: formatNumber(Number(stats?.classes ?? 0)), icon: Layers, tone: 'text-green-600 bg-green-50' },
    { label: 'Courses', value: formatNumber(Number(school.courses_count ?? 0)), icon: BookOpen, tone: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {flash && <Flash tone="success" message={flash} />}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
            {(school.name?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-gray-500 text-sm">
              {school.code} · {[school.state, school.lga].filter(Boolean).join(', ') || 'No location'}
            </p>
            <span className="inline-block mt-2">
              <Badge tone={statusTone(school.status === 'active' ? 'active' : 'inactive')}>{school.status}</Badge>
            </span>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : (
              <Button variant="secondary" onClick={startEdit}>
                <Pencil className="w-4 h-4 mr-1.5" /> Edit School
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${s.tone} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Card title="School Information" description={editing ? 'Editing school details' : 'View school details'}>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="School name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Type">
                <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
              <Field label="LGA">
                <Input value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={submit} disabled={saving}>
                <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {school.address || 'No address'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {[school.state, school.lga].filter(Boolean).join(', ') || 'No location'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              {school.email || 'No email'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              {school.phone || 'No phone'}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
