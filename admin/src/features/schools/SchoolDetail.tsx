'use client';

import { useState } from 'react';
import {
  Users, GraduationCap, Layers, BookOpen, CalendarDays,
  UserCheck, DollarSign, FileText, Pencil, Save,
  Search, Clock, TrendingUp, AlertCircle
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Badge, { statusTone } from '@/components/ui/Badge';
import Flash from '@/components/ui/Flash';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Field from '@/components/ui/Field';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { formatNumber } from '@/utils/format';
import { useSchool } from './useSchool';
import type { SchoolClass, TimetableEntry, AttendanceRecord, FeeRecord, SchoolResult } from '@/services/api/schoolService';

type Tab = 'info' | 'classes' | 'timetable' | 'attendance' | 'fees' | 'results';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchoolDetail({ id }: { id: string }) {
  const { school, stats, classes, timetables, attendance, attendanceStats, fees, feeSummary, results, resultSummary, loading, error, save } = useSchool(id);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'info', label: 'Info', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'classes', label: 'Classes', icon: <Layers className="w-3.5 h-3.5" />, count: classes.length },
    { id: 'timetable', label: 'Timetable', icon: <CalendarDays className="w-3.5 h-3.5" />, count: timetables.length },
    { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-3.5 h-3.5" />, count: attendance.length },
    { id: 'fees', label: 'Fees', icon: <DollarSign className="w-3.5 h-3.5" />, count: fees.length },
    { id: 'results', label: 'Results', icon: <FileText className="w-3.5 h-3.5" />, count: results.length },
  ];

  if (loading) return <Spinner label="Loading school..." />;
  if (error && !school) return <Flash tone="error" message={error || 'School not found'} />;
  if (!school) return null;

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

  const formatCurrency = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
  const formatTime = (t?: string) => t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      {flash && <Flash tone="success" message={flash} />}

      {/* Header */}
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
              <>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>
                  <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={startEdit}>
                <Pencil className="w-4 h-4 mr-1.5" /> Edit School
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(Number(stats?.students ?? school.student_count ?? 0))}</p>
          <p className="text-sm text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(Number(stats?.teachers ?? school.teacher_count ?? 0))}</p>
          <p className="text-sm text-gray-500">Teachers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(classes.length)}</p>
          <p className="text-sm text-gray-500">Classes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(results.length)}</p>
          <p className="text-sm text-gray-500">Results</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
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
                <Clock className="w-4 h-4 text-gray-400" />
                {school.address || 'No address'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                {[school.state, school.lga].filter(Boolean).join(', ') || 'No location'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                {school.email || 'No email'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                {school.phone || 'No phone'}
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'classes' && (
        <Card title="Classes" description={`${classes.length} classes registered for this school`}>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No classes registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Class</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Teacher</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Capacity</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Academic Year</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.class_name || c.class_id}</td>
                      <td className="px-4 py-3 text-gray-500">{c.teacher_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.capacity ? formatNumber(c.capacity) : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.academic_year || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(c.status)}>{c.status || 'active'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'timetable' && (
        <Card title="Timetable" description={`${timetables.length} timetable entries`}>
          {timetables.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No timetable entries yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Day</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Class</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Teacher</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {timetables.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{t.day_of_week}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatTime(t.start_time)} – {formatTime(t.end_time)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.class_name || t.class_code || t.class_id}</td>
                      <td className="px-4 py-3 text-gray-500">{t.subject_name || t.subject_code || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{t.room || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {attendanceStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present_count}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent_count}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late_count}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-gray-600">{attendanceStats.excused_count}</p>
                <p className="text-xs text-gray-500">Excused</p>
              </div>
            </div>
          )}
          <Card title="Attendance Records" description={`${attendance.length} records`}>
            {attendance.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No attendance records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Class</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {a.first_name} {a.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{a.class_name || a.class_code || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(a.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Badge tone={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : a.status === 'late' ? 'yellow' : 'blue'}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{a.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="space-y-4">
          {feeSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(feeSummary.total_amount)}</p>
                <p className="text-xs text-gray-500">Total Amount</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-green-600">{formatCurrency(feeSummary.total_collected)}</p>
                <p className="text-xs text-gray-500">Collected</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-red-600">{formatCurrency(feeSummary.total_balance)}</p>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-yellow-600">{feeSummary.pending_count}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          )}
          <Card title="Fee Records" description={`${fees.length} fee records`}>
            {fees.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No fee records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Fee Type</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Paid</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Balance</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fees.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {f.first_name} {f.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{f.fee_type}</td>
                        <td className="px-4 py-3 text-gray-500">{formatCurrency(f.amount)}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(f.amount_paid)}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{formatCurrency(f.balance)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(f.status)}>{f.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {f.due_date ? new Date(f.due_date).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {resultSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-gray-900">{resultSummary.total_results}</p>
                <p className="text-xs text-gray-500">Total Results</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-blue-600">{resultSummary.avg_score?.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-green-600">{resultSummary.passed_count}</p>
                <p className="text-xs text-gray-500">Passed</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xl font-bold text-red-600">{resultSummary.failed_count}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          )}
          <Card title="Exam Results" description={`${results.length} result records`}>
            {results.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No results yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Class</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Subject</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Coursework</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Exam</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Grade</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.class_name || r.class_code || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.subject_name || r.subject_code || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.coursework_score ?? 0}</td>
                        <td className="px-4 py-3 text-gray-500">{r.exam_score ?? 0}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.total_score ?? 0}</td>
                        <td className="px-4 py-3">
                          <Badge tone={(r.grade === 'A' || r.grade === 'B') ? 'green' : r.grade === 'F' ? 'red' : 'yellow'}>
                            {r.grade || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {r.published ? (
                            <Badge tone="green">Published</Badge>
                          ) : (
                            <Badge tone="gray">Draft</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
