'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import Modal from '@/components/Modal';
import { fetchAdminQuestions, createAdminQuestion, updateAdminQuestion, deleteAdminQuestion } from '@/services/api/questionService';
import { fetchAdminCourses } from '@/services/api/courseService';
import { SearchIcon, PlusIcon, TrashIcon, PencilIcon, FilterIcon } from 'lucide-react';

const questionTypes = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'matching', 'numerical', 'image_based', 'multiple_select'];
const difficulties = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export default function QuestionsManager() {
  const { token, user } = useAdminAuthStore();
  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editQ, setEditQ] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    questionType: 'mcq', questionText: '', options: ['', '', '', ''],
    correctAnswer: '', explanation: '', difficulty: 'medium',
    marks: 1, subjectId: '', topicId: '', examName: '', examYear: '',
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchAdminQuestions(token, { page: 1, limit: 100 }),
      fetchAdminCourses(token, { page: 1, limit: 50 }),
    ])
      .then(([qRes, cRes]) => {
        setQuestions(qRes.questions || []);
        setCourses(cRes.courses || []);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditQ(null);
    setForm({ questionType: 'mcq', questionText: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'medium', marks: 1, subjectId: '', topicId: '', examName: '', examYear: '' });
    setModalOpen(true);
  };

  const openEdit = (q: any) => {
    setEditQ(q);
    const opts = q.options ? (Array.isArray(q.options) ? q.options : []) : ['', '', '', ''];
    while (opts.length < 4) opts.push('');
    setForm({
      questionType: q.question_type || 'mcq', questionText: q.question_text || '',
      options: opts, correctAnswer: q.correct_answer || '', explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium', marks: q.marks || 1,
      subjectId: q.subject_id || '', topicId: q.topic_id || '',
      examName: q.exam_name || '', examYear: q.exam_year?.toString() || '',
    });
    setModalOpen(true);
  };

  const updateOption = (idx: number, val: string) => {
    setForm(p => { const opts = [...p.options]; opts[idx] = val; return { ...p, options: opts }; });
  };

  const handleSubmit = async () => {
    if (!form.questionText.trim()) { setError('Question text is required'); return; }
    if (form.questionType === 'mcq' || form.questionType === 'multiple_select') {
      const filled = form.options.filter(o => o.trim());
      if (filled.length < 2) { setError('At least 2 options are required'); return; }
      if (!form.correctAnswer.trim()) { setError('Correct answer is required'); return; }
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        ...form, createdBy: user?.id,
        options: form.questionType === 'mcq' || form.questionType === 'multiple_select'
          ? form.options.filter(o => o.trim()).map((o, i) => ({ letter: String.fromCharCode(65 + i), text: o }))
          : undefined,
        correctAnswer: form.options[parseInt(form.correctAnswer) || 0] || form.correctAnswer,
        examYear: form.examYear ? parseInt(form.examYear) : undefined,
      };
      if (editQ) {
        await updateAdminQuestion(token!, editQ.id, payload);
        setSuccess('Question updated');
      } else {
        await createAdminQuestion(token!, payload);
        setSuccess('Question created');
      }
      setModalOpen(false);
      const res = await fetchAdminQuestions(token!, { page: 1, limit: 100 });
      setQuestions(res.questions || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (q: any) => {
    if (!confirm(`Delete this question?`)) return;
    try {
      await deleteAdminQuestion(token!, q.id);
      setQuestions(questions.filter(x => x.id !== q.id));
      setSuccess('Question deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const getCoursesForSubject = () => {
    // Return unique subjects from courses
    const seen = new Set<string>();
    const subjects: string[] = [];
    for (const c of courses) {
      if (c.title && !seen.has(c.title)) { seen.add(c.title); subjects.push(c.title); }
    }
    return subjects;
  };

  const filtered = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(search.toLowerCase()) ||
      q.exam_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'all' || (q.subject_id === filterSubject);
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || q.question_type === filterType;
    return matchesSearch && matchesSubject && matchesDifficulty && matchesType;
  });

  const getSubjectLabel = (id?: string) => courses.find(c => c.id === id)?.title || (id ? id.slice(0, 8) : '—');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option value="all">All Types</option>
          {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option value="all">All Difficulty</option>
          {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FilterIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No questions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Question', 'Type', 'Subject', 'Difficulty', 'Marks', 'Usage', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={q.question_text}>{q.question_text}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium uppercase">{q.question_type}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getSubjectLabel(q.subject_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      q.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{q.marks ?? 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{q.usage_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(q)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(q)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editQ ? 'Edit Question' : 'Add Question'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
              <select value={form.questionType} onChange={e => setForm(p => ({ ...p, questionType: e.target.value, options: e.target.value === 'true_false' ? ['True', 'False'] : ['', '', '', ''] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
            <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Enter the question..." />
          </div>
          {(form.questionType === 'mcq' || form.questionType === 'multiple_select') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options *</label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input value={opt} onChange={e => updateOption(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`} />
                    <select value={form.correctAnswer === String.fromCharCode(65 + idx) ? String.fromCharCode(65 + idx) : ''}
                      onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      title="Mark correct answer">
                      <option value="">—</option>
                      {form.options.map((_, i) => <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
          {form.questionType === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
              <select value={form.correctAnswer} onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Select...</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>
          )}
          {['fill_blank', 'short_answer', 'numerical'].includes(form.questionType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
              <input value={form.correctAnswer} onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="The correct answer..." />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input type="number" value={form.marks} onChange={e => setForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
              <input value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Why this answer is correct..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
              <input value={form.examName} onChange={e => setForm(p => ({ ...p, examName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="JAMB, WAEC, NECO..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
              <input value={form.examYear} onChange={e => setForm(p => ({ ...p, examYear: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="2024" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : (editQ ? 'Update Question' : 'Create Question')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
