'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import Modal from '@/components/Modal';
import ResourceForm, { type LibraryResourceFormValues } from './ResourceForm';
import {
  fetchAdminLibraryResources,
  createAdminLibraryResource,
  updateAdminLibraryResource,
  deleteAdminLibraryResource,
  type LibraryResourcePayload,
} from '@/services/api/libraryService';
import { LIBRARY_RESOURCE_TYPES } from '@shared/constants/enums';
import {
  BookOpenIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  VideoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatType = (type?: string) =>
  type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

export default function LibraryManager() {
  const { token, user } = useAdminAuthStore();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editResource, setEditResource] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminLibraryResources(token, {
      page: 1,
      limit: 100,
      resourceType: typeFilter === 'all' ? undefined : typeFilter,
    })
      .then(data => { setResources(data.resources || []); setError(''); })
      .catch(err => { setError(err.message || 'Failed to load resources'); })
      .finally(() => setLoading(false));
  }, [token, typeFilter]);

  const openCreate = () => {
    setEditResource(null);
    setModalOpen(true);
  };

  const openEdit = (resource: any) => {
    setEditResource(resource);
    setModalOpen(true);
  };

  const handleSubmit = async (values: LibraryResourceFormValues) => {
    if (!token) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload: LibraryResourcePayload = {
        title: values.title,
        resourceType: values.resourceType,
        fileUrl: values.fileUrl,
        thumbnailUrl: values.thumbnailUrl || undefined,
        description: values.description || undefined,
        subjectId: values.subjectId || undefined,
        topicId: values.topicId || undefined,
        classId: values.classId || undefined,
        examBoard: values.examBoard || undefined,
        examYear: values.examYear ? parseInt(values.examYear) : null,
        authorId: user?.id || undefined,
        isFree: values.isFree,
        fileSizeBytes: values.fileSizeBytes ? parseInt(values.fileSizeBytes) : null,
        mimeType: values.mimeType || undefined,
        tags: values.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editResource) {
        await updateAdminLibraryResource(token, editResource.id, payload);
        setSuccess('Resource updated');
      } else {
        await createAdminLibraryResource(token, payload);
        setSuccess('Resource created');
      }
      setModalOpen(false);
      setEditResource(null);
      const data = await fetchAdminLibraryResources(token, {
        page: 1,
        limit: 100,
        resourceType: typeFilter === 'all' ? undefined : typeFilter,
      });
      setResources(data.resources || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: any) => {
    if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
    try {
      await deleteAdminLibraryResource(token!, resource.id);
      setResources(resources.filter(r => r.id !== resource.id));
      setSuccess('Resource deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const filtered = resources.filter(r => {
    const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: resources.length,
    free: resources.filter(r => r.is_free).length,
    downloads: resources.reduce((sum, r) => sum + (r.download_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <PlusIcon className="w-4 h-4" /> Add Resource
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Resources', value: stats.total, icon: BookOpenIcon, color: 'blue' },
          { label: 'Free Resources', value: stats.free, icon: EyeIcon, color: 'green' },
          { label: 'Total Downloads', value: stats.downloads, icon: DownloadIcon, color: 'yellow' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="all">All Types</option>
          {LIBRARY_RESOURCE_TYPES.map(t => (
            <option key={t} value={t}>{formatType(t)}</option>
          ))}
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No library resources found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Title', 'Type', 'Subject / Class', 'Size', 'Downloads', 'Views', 'Access', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(resource => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{resource.title}</p>
                    {resource.mime_type && <p className="text-xs text-gray-400 truncate max-w-xs">{resource.mime_type}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium uppercase text-gray-600">
                      {resource.resource_type === 'video' && <VideoIcon className="w-3 h-3" />}
                      {(resource.resource_type === 'pdf' || resource.resource_type === 'article') && <FileTextIcon className="w-3 h-3" />}
                      {formatType(resource.resource_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {(resource.subject_id || resource.class_id)
                      ? `${resource.subject_id ? resource.subject_id.slice(0, 8) : ''}${resource.subject_id && resource.class_id ? ' / ' : ''}${resource.class_id ? resource.class_id.slice(0, 8) : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatSize(resource.file_size_bytes) || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{resource.download_count || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{resource.view_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resource.is_free ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {resource.is_free ? 'Free' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(resource)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(resource)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditResource(null); }} title={editResource ? 'Edit Resource' : 'Add Resource'} size="lg">
        <ResourceForm
          token={token!}
          initial={editResource ? {
            title: editResource.title || '',
            resourceType: editResource.resource_type || 'pdf',
            fileUrl: editResource.file_url || '',
            thumbnailUrl: editResource.thumbnail_url || '',
            description: editResource.description || '',
            subjectId: editResource.subject_id || '',
            topicId: editResource.topic_id || '',
            classId: editResource.class_id || '',
            examBoard: editResource.exam_board || '',
            examYear: editResource.exam_year ? String(editResource.exam_year) : '',
            isFree: editResource.is_free ?? true,
            fileSizeBytes: editResource.file_size_bytes ? String(editResource.file_size_bytes) : '',
            mimeType: editResource.mime_type || '',
            tags: Array.isArray(editResource.tags) ? editResource.tags.join(', ') : editResource.tags || '',
            authorId: editResource.author_id || '',
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditResource(null); }}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}
