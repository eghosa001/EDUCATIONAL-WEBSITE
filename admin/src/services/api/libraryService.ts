import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface LibraryResourceRow {
  id: string;
  title: string;
  resource_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  description?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  class_id?: string | null;
  exam_board?: string | null;
  exam_year?: number | null;
  author_id?: string | null;
  download_count?: number;
  view_count?: number;
  is_free?: boolean;
  is_downloadable?: boolean;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  tags?: string[] | null;
  lesson_id?: string;
  lesson_title?: string;
  course_id?: string;
  course_title?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface LibraryFilters {
  page?: number;
  limit?: number;
  resourceType?: string;
  search?: string;
}

export interface LibraryStats {
  total_resources: number;
  past_questions: number;
  total_subjects: number;
  published_courses: number;
}

export interface LibraryResourcePayload {
  title: string;
  resourceType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  classId?: string;
  examBoard?: string;
  examYear?: number | null;
  authorId?: string;
  isFree: boolean;
  fileSizeBytes?: number | null;
  mimeType?: string;
  tags?: string[];
}

export interface UploadedFile {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export const fetchAdminLibraryResources = async (
  token: string,
  filters: LibraryFilters = {}
): Promise<{ resources: LibraryResourceRow[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await fetch(`${baseUrl}/library?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { resources?: LibraryResourceRow[] };
    pagination?: Pagination;
  };
  return {
    resources: body.data?.resources ?? [],
    pagination: body.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
  };
};

export const fetchLibraryStats = async (token: string): Promise<{ stats: LibraryStats }> => {
  const response = await fetch(`${baseUrl}/library/stats`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchAdminLibraryResource = async (
  token: string,
  id: string
): Promise<{ resource: LibraryResourceRow }> => {
  const response = await fetch(`${baseUrl}/library/${id}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createAdminLibraryResource = async (
  token: string,
  data: LibraryResourcePayload
): Promise<{ resource: LibraryResourceRow }> => {
  const response = await fetch(`${baseUrl}/library`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateAdminLibraryResource = async (
  token: string,
  id: string,
  data: Partial<LibraryResourcePayload>
): Promise<{ resource: LibraryResourceRow }> => {
  const response = await fetch(`${baseUrl}/library/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteAdminLibraryResource = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${baseUrl}/library/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const uploadLibraryFile = async (
  token: string,
  payload: { fileName: string; mimeType?: string; dataBase64: string; folder?: string }
): Promise<{ data: { file: UploadedFile } }> => {
  const response = await fetch(`${baseUrl}/storage/upload`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleApiError(response);
};
