'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import Modal from '@/components/Modal';
import { fetchAdminExams, createAdminExam, updateAdminExam, publishAdminExam, deleteAdminExam } from '@/services/api/examService';
import { fetchAdminCourses } from '@/services/api/courseService';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, ClockIcon, EyeIcon, InfoIcon, SearchIcon } from 'lucide-react';

const examTypes = ['practice', 'timed_test', 'mock', 'past_questions', 'subject_test', 'topic_test', 'full_examination', 'competition'];

export default function ExamsPage() {
  const { token, user } = useAdminAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', examType: 'practice',
    subjectId: '', classId: '', durationMinutes: 60,
    totalMarks: 100, passingMarks: 50, instructions: '',
    startTime: '', endTime: '', isTimed: true,
    shuffleQuestions: false, showResultsImmediately: false,
    allowReview: false, maxAttempts: 3, isPublic: false,
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchAdminExams(token, { page: 1, limit: 100 }),
      fetchAdminCourses(token, { page: 1, limit: 50 }),
    ])
      .then(([eRes, cRes]) => {
        setExams(eRes.exams || []);
        setCourses(cRes.courses || []);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditExam(null);
    setForm({ title: '', description: '', examType: 'practice', subjectId: '', classId: '', durationMinutes: 60, totalMarks: 100, passingMarks: 50, instructions: '', startTime: '', endTime: '', isTimed: true, shuffleQuestions: false, showResultsImmediately: false, allowReview: false, maxAttempts: 3, isPublic: false });
    setModalOpen(true);
  };

  const openEdit = (exam: any) => {
    setEditExam(exam);
    setForm({
      title: exam.title || '', description: exam.description || '', examType: exam.exam_type || 'practice',
      subjectId: exam.subject_id || '', classId: exam.class_id || '',
      durationMinutes: exam.duration_minutes || 60, totalMarks: exam.total_marks || 100,
      passingMarks: exam.passing_marks || 50, instructions: exam.instructions || '',
      startTime: exam.start_time ? exam.start_time.slice(0, 16) : '',
      endTime: exam.end_time ? exam.end_time.slice(0, 16) : '',
      isTimed: exam.is_timed ?? true, shuffleQuestions: exam.shuffle_questions ?? false,
      showResultsImmediately: exam.show_results_immediately ?? false,
      allowReview: exam.allow_review ?? false, maxAttempts: exam.max_attempts || 3,
      isPublic: exam.is_public ?? false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        ...form, createdBy: user?.id,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      };
      if (editExam) {
        await updateAdminExam(token!, editExam.id, payload);
        setSuccess('Exam updated');
      } else {
        await createAdminExam(token!, payload);
        setSuccess('Exam created');
      }
      setModalOpen(false);
      const res = await fetchAdminExams(token!, { page: 1, limit: 100, examType: typeFilter === 'all' ? undefined : typeFilter });
      setExams(res.exams || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (exam: any) => {
    if (!confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    try {
      await deleteAdminExam(token!, exam.id);
      setExams(exams.filter(e => e.id !== exam.id));
      setSuccess('Exam deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (exam: any) => {
    try {
      await publishAdminExam(token!, exam.id);
      setExams(exams.map(e => e.id === exam.id ? { ...e, is_active: true } : e));
      setSuccess('Exam published');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    }
  };

  const filtered = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || e.exam_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const getClassLabel = (id?: string) => courses.find(c => c.id === id)?.title || (id ? id.slice(0, 8) : '—');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> New Exam
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option value="all">All Types</option>
          {examTypes.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <InfoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No exams found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Title', 'Type', 'Class', 'Duration', 'Marks', 'Attempts', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(exam => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{exam.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getTypeLabel(exam.exam_type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getClassLabel(exam.class_id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />{exam.duration_minutes ? `${exam.duration_minutes}m` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{exam.total_marks || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{exam.max_attempts ?? '∞'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {exam.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!exam.is_active && (
                        <button onClick={() => handlePublish(exam)} title="Publish" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(exam)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(exam)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editExam ? 'Edit Exam' : 'New Exam'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. SS2 Biology Mid-Term" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select value={form.examType} onChange={e => setForm(p => ({ ...p, examType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {examTypes.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
              <select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Select class...</option>
                {courses.map(c => <option key={c.id} value={c.class_id || c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Exam description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Instructions for students..." />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
              <input type="number" value={form.passingMarks} onChange={e => setForm(p => ({ ...p, passingMarks: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
              <input type="number" value={form.maxAttempts} onChange={e => setForm(p => ({ ...p, maxAttempts: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isTimed} onChange={e => setForm(p => ({ ...p, isTimed: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Timed exam (enforces time limit)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm(p => ({ ...p, shuffleQuestions: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Shuffle questions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showResultsImmediately} onChange={e => setForm(p => ({ ...p, showResultsImmediately: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Show results immediately</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allowReview} onChange={e => setForm(p => ({ ...p, allowReview: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Allow review after submission</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublic} onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Publicly accessible</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : (editExam ? 'Update Exam' : 'Create Exam')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
