'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import Modal from '@/components/Modal';
import { fetchAdminCourses, createAdminCourse, updateAdminCourse, publishAdminCourse, deleteAdminCourse } from '@/services/api/courseService';
import { BookOpenIcon, UsersIcon, FileTextIcon, ClipboardCheckIcon, PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

export default function CoursesPage() {
  const { token, user } = useAdminAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '', shortDescription: '', fullDescription: '',
    subjectId: '', classId: '', termId: '', difficulty: 'beginner',
    price: 0, currency: 'NGN', isFree: false, isFeatured: false,
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminCourses(token, { page: 1, limit: 50, status: statusFilter === 'all' ? undefined : statusFilter })
      .then(data => { setCourses(data.courses || []); setError(''); })
      .catch(err => { setError(err.message || 'Failed to load courses'); })
      .finally(() => setLoading(false));
  }, [token, statusFilter]);

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: '', shortDescription: '', fullDescription: '', subjectId: '', classId: '', termId: '', difficulty: 'beginner', price: 0, currency: 'NGN', isFree: true, isFeatured: false });
    setModalOpen(true);
  };

  const openEdit = (course: any) => {
    setEditCourse(course);
    setForm({
      title: course.title || '', shortDescription: course.short_description || '', fullDescription: course.full_description || '',
      subjectId: course.subject_id || '', classId: course.class_id || '', termId: course.term_id || '',
      difficulty: course.difficulty || 'beginner', price: course.price || 0, currency: course.currency || 'NGN',
      isFree: course.is_free || false, isFeatured: course.is_featured || false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        teacherId: user?.id,
        status: editCourse ? editCourse.status : 'draft',
      };
      if (editCourse) {
        await updateAdminCourse(token!, editCourse.id, payload);
        setSuccess('Course updated successfully');
      } else {
        await createAdminCourse(token!, payload);
        setSuccess('Course created successfully');
      }
      setModalOpen(false);
      const data = await fetchAdminCourses(token!, { page: 1, limit: 50, status: statusFilter === 'all' ? undefined : statusFilter });
      setCourses(data.courses || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course: any) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await deleteAdminCourse(token!, course.id);
      setCourses(courses.filter(c => c.id !== course.id));
      setSuccess('Course deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (course: any) => {
    try {
      await publishAdminCourse(token!, course.id);
      setCourses(courses.map(c => c.id === course.id ? { ...c, status: 'published', published_at: new Date().toISOString() } : c));
      setSuccess('Course published');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    }
  };

  const filtered = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    drafts: courses.filter(c => c.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> New Course
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total', value: stats.total, icon: BookOpenIcon, color: 'blue' },
          { label: 'Published', value: stats.published, icon: ClipboardCheckIcon, color: 'green' },
          { label: 'Drafts', value: stats.drafts, icon: FileTextIcon, color: 'yellow' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="pending_review">Pending Review</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No courses found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Title', 'Subject', 'Class', 'Status', 'Price', 'Enrollments', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{course.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{course.subject_id || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{course.class_id || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'published' ? 'bg-green-100 text-green-700' :
                      course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      course.status === 'pending_review' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{course.status?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{course.is_free ? 'Free' : `₦${Number(course.price || 0).toLocaleString()}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{course.enrollment_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {course.status !== 'published' && (
                        <button onClick={() => handlePublish(course)} title="Publish" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(course)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(course)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCourse ? 'Edit Course' : 'New Course'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. SS2 Biology - Cell Biology" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID</label>
              <input value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="UUID or leave empty" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
              <input value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="UUID or leave empty" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <textarea value={form.shortDescription} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Brief description for cards/listings..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea value={form.fullDescription} onChange={e => setForm(p => ({ ...p, fullDescription: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Detailed course description..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {['beginner', 'easy', 'medium', 'hard', 'expert'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={e => setForm(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? 0 : p.price }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Free course</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : (editCourse ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
