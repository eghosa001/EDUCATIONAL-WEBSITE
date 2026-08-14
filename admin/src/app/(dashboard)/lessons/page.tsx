'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import Modal from '@/components/Modal';
import { fetchAdminLessons, createAdminLesson, updateAdminLesson, publishAdminLesson, deleteAdminLesson } from '@/services/api/lessonService';
import { fetchAdminCourses } from '@/services/api/courseService';
import { BookOpenIcon, PlayCircleIcon, FileTextIcon, VideoIcon, EyeIcon, CheckCircleIcon, TrashIcon, PencilIcon, PlusIcon } from 'lucide-react';

export default function LessonsPage() {
  const { token, user } = useAdminAuthStore();
  const [lessons, setLessons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const contentTypes = ['video', 'text', 'pdf', 'audio', 'interactive', 'live'];

  const [form, setForm] = useState({
    courseId: '', sectionId: '', title: '', description: '',
    contentType: 'video', videoUrl: '', writtenContent: '',
    keyPoints: '', orderIndex: 0, estimatedMinutes: 20,
    isFree: true, isPublished: false,
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchAdminLessons(token, { page: 1, limit: 100 }),
      fetchAdminCourses(token, { page: 1, limit: 100 }),
    ])
      .then(([lessonsRes, coursesRes]) => {
        setLessons(lessonsRes.lessons || []);
        setCourses(coursesRes.courses || []);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditLesson(null);
    setForm({ courseId: '', sectionId: '', title: '', description: '', contentType: 'video', videoUrl: '', writtenContent: '', keyPoints: '', orderIndex: 0, estimatedMinutes: 20, isFree: true, isPublished: false });
    setModalOpen(true);
  };

  const openEdit = (lesson: any) => {
    setEditLesson(lesson);
    setForm({
      courseId: lesson.course_id || '', sectionId: lesson.section_id || '',
      title: lesson.title || '', description: lesson.description || '',
      contentType: lesson.content_type || 'video', videoUrl: lesson.video_url || '',
      writtenContent: lesson.written_content || '', keyPoints: lesson.key_points || '',
      orderIndex: lesson.order_index || 0, estimatedMinutes: lesson.estimated_minutes || 20,
      isFree: lesson.is_free ?? true, isPublished: lesson.is_published ?? false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.courseId.trim()) { setError('Title and Course are required'); return; }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, createdBy: user?.id };
      if (editLesson) {
        await updateAdminLesson(token!, editLesson.id, payload);
        setSuccess('Lesson updated');
      } else {
        await createAdminLesson(token!, payload);
        setSuccess('Lesson created');
      }
      setModalOpen(false);
      const res = await fetchAdminLessons(token!, { page: 1, limit: 100, courseId: courseFilter === 'all' ? undefined : courseFilter });
      setLessons(res.lessons || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lesson: any) => {
    if (!confirm(`Delete "${lesson.title}"?`)) return;
    try {
      await deleteAdminLesson(token!, lesson.id);
      setLessons(lessons.filter(l => l.id !== lesson.id));
      setSuccess('Lesson deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (lesson: any) => {
    try {
      await publishAdminLesson(token!, lesson.id);
      setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_published: true } : l));
      setSuccess('Lesson published');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    }
  };

  const filtered = lessons.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = courseFilter === 'all' || l.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const getCourseTitle = (id?: string) => courses.find(c => c.id === id)?.title || (id ? id.slice(0, 8) : '—');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> New Lesson
        </button>
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No lessons found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Title', 'Course', 'Type', 'Views', 'Completed', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lesson => (
                <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{lesson.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getCourseTitle(lesson.course_id)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium uppercase text-gray-600">
                      {lesson.content_type === 'video' && <VideoIcon className="w-3 h-3" />}
                      {lesson.content_type === 'text' && <FileTextIcon className="w-3 h-3" />}
                      {lesson.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lesson.view_count || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lesson.completion_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lesson.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!lesson.is_published && (
                        <button onClick={() => handlePublish(lesson)} title="Publish" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(lesson)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lesson)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editLesson ? 'Edit Lesson' : 'New Lesson'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="e.g. Cell Structure Overview" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {contentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Index</label>
              <input type="number" value={form.orderIndex} onChange={e => setForm(p => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Brief description of the lesson..." />
          </div>
          {(form.contentType === 'video' || form.contentType === 'audio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video/Audio URL</label>
              <input value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="https://..." />
            </div>
          )}
          {form.contentType === 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Written Content</label>
                <textarea value={form.writtenContent} onChange={e => setForm(p => ({ ...p, writtenContent: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Lesson content..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Points</label>
                <textarea value={form.keyPoints} onChange={e => setForm(p => ({ ...p, keyPoints: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Bullet points..." />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Minutes</label>
            <input type="number" value={form.estimatedMinutes} onChange={e => setForm(p => ({ ...p, estimatedMinutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" min="1" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={e => setForm(p => ({ ...p, isFree: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Free access</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : (editLesson ? 'Update Lesson' : 'Create Lesson')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
