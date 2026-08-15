'use client';

import { useState } from 'react';
import { LayoutTemplateIcon, PlusIcon, TrashIcon, PencilIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Flash from '@/components/ui/Flash';
import Field from '@/components/ui/Field';
import type { NotificationType, NotificationChannel } from '@/services/api/notificationService';

export interface Template {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  createdAt: string;
}

const PRESET_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'New Course Published',
    type: 'course',
    title: 'New Course Available',
    body: 'A new course "{courseName}" has been published. Start learning now!',
    channel: 'in_app',
    createdAt: '',
  },
  {
    id: '2',
    name: 'Exam Result Ready',
    type: 'result',
    title: 'Exam Result Available',
    body: 'Your result for "{examName}" is ready. Score: {score}%',
    channel: 'email',
    createdAt: '',
  },
  {
    id: '3',
    name: 'Assignment Due Reminder',
    type: 'assignment',
    title: 'Assignment Due Soon',
    body: '"{assignmentName}" is due on {dueDate}. Complete it before the deadline.',
    channel: 'all',
    createdAt: '',
  },
  {
    id: '4',
    name: 'Payment Confirmation',
    type: 'payment',
    title: 'Payment Confirmed',
    body: 'Your payment of ₦{amount} for {purpose} has been confirmed.',
    channel: 'email',
    createdAt: '',
  },
  {
    id: '5',
    name: 'Subscription Expiring',
    type: 'subscription_expiry',
    title: 'Subscription Expiring Soon',
    body: 'Your {plan} subscription expires on {expiryDate}. Renew now to continue learning.',
    channel: 'all',
    createdAt: '',
  },
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>(PRESET_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Template>>({});
  const [flash, setFlash] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...editForm } : t)));
    setEditingId(null);
    setFlash({ tone: 'success', message: 'Template saved' });
    setTimeout(() => setFlash(null), 2000);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleVarChange = (field: keyof Template, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card title="Notification Templates" description="Manage reusable notification message templates" icon={LayoutTemplateIcon}>
      {flash && <Flash tone={flash.tone === 'success' ? 'success' : 'error'} message={flash.message} />}

      <div className="space-y-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
          >
            {editingId === t.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Template name">
                    <input
                      value={editForm.name || ''}
                      onChange={(e) => handleVarChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </Field>
                  <Field label="Type">
                    <select
                      value={editForm.type || 'custom'}
                      onChange={(e) => handleVarChange('type', e.target.value as NotificationType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="course">Course</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                      <option value="payment">Payment</option>
                      <option value="result">Result</option>
                      <option value="announcement">Announcement</option>
                      <option value="study_reminder">Study Reminder</option>
                      <option value="subscription_expiry">Subscription Expiry</option>
                      <option value="system">System</option>
                      <option value="custom">Custom</option>
                    </select>
                  </Field>
                </div>
                <Field label="Title">
                  <input
                    value={editForm.title || ''}
                    onChange={(e) => handleVarChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Message Body">
                  <textarea
                    value={editForm.body || ''}
                    onChange={(e) => handleVarChange('body', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Default Channel">
                  <select
                    value={editForm.channel || 'in_app'}
                    onChange={(e) => handleVarChange('channel', e.target.value as NotificationChannel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="in_app">In-App Only</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                    <option value="all">All Channels</option>
                  </select>
                </Field>
                <div className="flex gap-2">
                  <Button onClick={saveEdit} className="text-xs px-3 py-1">
                    Save
                  </Button>
                  <Button variant="secondary" onClick={cancelEdit} className="text-xs px-3 py-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.type.replace('_', ' ')} · {t.channel}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => startEdit(t)}
                      className="p-1.5 h-auto"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="p-1.5 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-700">{t.title}</p>
                  <p className="text-gray-500 text-xs mt-1 whitespace-pre-wrap">{t.body}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        className="mt-4 w-full border-dashed"
        onClick={() => {
          const newId = String(templates.length + 1);
          setTemplates((prev) => [
            ...prev,
            {
              id: newId,
              name: 'New Template',
              type: 'custom',
              title: '',
              body: '',
              channel: 'in_app',
              createdAt: '',
            },
          ]);
          setEditingId(newId);
          setEditForm({
            id: newId,
            name: 'New Template',
            type: 'custom',
            title: '',
            body: '',
            channel: 'in_app',
            createdAt: '',
          });
        }}
      >
        <PlusIcon className="w-4 h-4 mr-1.5" />
        Add Template
      </Button>
    </Card>
  );
}
