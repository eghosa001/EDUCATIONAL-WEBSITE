'use client';

import { useRef, useState } from 'react';
import { uploadLibraryFile } from '@/services/api/libraryService';
import { LIBRARY_RESOURCE_TYPES } from '@shared/constants/enums';
import { UploadIcon, FileTextIcon } from 'lucide-react';

export interface LibraryResourceFormValues {
  title: string;
  resourceType: string;
  fileUrl: string;
  thumbnailUrl: string;
  description: string;
  subjectId: string;
  topicId: string;
  classId: string;
  examBoard: string;
  examYear: string;
  isFree: boolean;
  fileSizeBytes: string;
  mimeType: string;
  tags: string;
  authorId: string;
}

interface ResourceFormProps {
  token: string;
  initial?: Partial<LibraryResourceFormValues>;
  submitting?: boolean;
  onSubmit: (values: LibraryResourceFormValues) => void;
  onCancel?: () => void;
}

const emptyValues: LibraryResourceFormValues = {
  title: '',
  resourceType: 'pdf',
  fileUrl: '',
  thumbnailUrl: '',
  description: '',
  subjectId: '',
  topicId: '',
  classId: '',
  examBoard: '',
  examYear: '',
  isFree: true,
  fileSizeBytes: '',
  mimeType: '',
  tags: '',
  authorId: '',
};

export default function ResourceForm({ token, initial, submitting, onSubmit, onCancel }: ResourceFormProps) {
  const [form, setForm] = useState<LibraryResourceFormValues>({ ...emptyValues, ...initial });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof LibraryResourceFormValues, value: string | boolean) =>
    setForm(p => ({ ...p, [key]: value }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const res = await uploadLibraryFile(token, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64: base64,
        folder: 'library',
      });
      const uploaded = res.data?.file;
      if (!uploaded?.url) throw new Error('Upload failed - no file URL returned');
      setForm(p => ({
        ...p,
        fileUrl: uploaded.url,
        mimeType: uploaded.mimeType || p.mimeType,
        fileSizeBytes: uploaded.size ? String(uploaded.size) : p.fileSizeBytes,
      }));
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: string) => {
    const n = parseFloat(bytes);
    if (!n) return '';
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${n} B`;
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { setUploadError('Title is required'); return; }
    if (!form.fileUrl.trim()) { setUploadError('A file URL is required (upload a file or paste a link)'); return; }
    setUploadError('');
    onSubmit(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="e.g. SS3 Mathematics Textbook"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type *</label>
        <select
          value={form.resourceType}
          onChange={e => set('resourceType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {LIBRARY_RESOURCE_TYPES.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <input
            value={form.fileUrl}
            onChange={e => set('fileUrl', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="https://... or pasted URL"
          />
        </div>
        {form.fileUrl && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <FileTextIcon className="w-3.5 h-3.5" />
            <span className="truncate">{form.fileUrl}</span>
            {form.fileSizeBytes && <span className="text-gray-400">· {formatSize(form.fileSizeBytes)}</span>}
          </div>
        )}
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="Brief description of the resource..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
          <input
            value={form.thumbnailUrl}
            onChange={e => set('thumbnailUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID</label>
          <input
            value={form.subjectId}
            onChange={e => set('subjectId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="UUID or leave empty"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
          <input
            value={form.classId}
            onChange={e => set('classId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="UUID or leave empty"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic ID</label>
          <input
            value={form.topicId}
            onChange={e => set('topicId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="UUID or leave empty"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board</label>
          <input
            value={form.examBoard}
            onChange={e => set('examBoard', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="e.g. WAEC, NECO, JAMB"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
          <input
            value={form.examYear}
            onChange={e => set('examYear', e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="e.g. 2024"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="e.g. algebra, jamb, past questions (comma separated)"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isFree}
          onChange={e => set('isFree', e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <span className="text-sm text-gray-700">Free access</span>
      </label>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Resource'}
        </button>
      </div>
    </div>
  );
}
