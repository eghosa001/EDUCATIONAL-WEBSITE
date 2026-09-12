const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function fetchJSON(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface PastQuestionFile {
  id: string;
  bucket_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  board: string;
  subject: string;
  year: number | null;
  paper_type: string | null;
  file_url: string | null;
  public_url: string;
  is_processed: boolean;
  questions_extracted: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BoardInfo {
  board: string;
  file_count: number;
  subject_count: number;
  total_mb: number;
}

export interface SubjectInfo {
  subject: string;
  file_count: number;
  total_mb: number;
  min_year: number | null;
  max_year: number | null;
  all_processed: boolean;
}

export interface StorageStats {
  total_files: number;
  boards: number;
  subjects: number;
  total_mb: number;
  processed_files: number;
  total_questions_extracted: number;
}

export const pastQuestionFilesAPI = {
  async getBoards(token?: string): Promise<{ data: { boards: BoardInfo[] } }> {
    return fetchJSON(`${API_BASE}/past-questions/files/boards`, token);
  },

  async getStats(token?: string): Promise<{ data: { stats: StorageStats } }> {
    return fetchJSON(`${API_BASE}/past-questions/files/stats`, token);
  },

  async listFiles(params: {
    board?: string;
    subject?: string;
    year?: number;
    page?: number;
    limit?: number;
    search?: string;
  } = {}, token?: string) {
    const query = new URLSearchParams();
    if (params.board) query.set('board', params.board);
    if (params.subject) query.set('subject', params.subject);
    if (params.year) query.set('year', String(params.year));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const suffix = query.toString();
    return fetchJSON(`${API_BASE}/past-questions/files${suffix ? `?${suffix}` : ''}`, token);
  },

  async listByBoard(board: string, params: {
    subject?: string;
    year?: number;
    page?: number;
    limit?: number;
  } = {}, token?: string) {
    const query = new URLSearchParams();
    if (params.subject) query.set('subject', params.subject);
    if (params.year) query.set('year', String(params.year));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const suffix = query.toString();
    return fetchJSON(`${API_BASE}/past-questions/files/boards/${encodeURIComponent(board)}${suffix ? `?${suffix}` : ''}`, token);
  },

  async getSubjectsByBoard(board: string, token?: string): Promise<{ data: { subjects: SubjectInfo[] } }> {
    return fetchJSON(`${API_BASE}/past-questions/files/boards/${encodeURIComponent(board)}/subjects`, token);
  },

  async getYearsByBoard(board: string, token?: string): Promise<{ data: { years: number[] } }> {
    return fetchJSON(`${API_BASE}/past-questions/files/boards/${encodeURIComponent(board)}/years`, token);
  },

  async getFile(id: string, token?: string): Promise<{ data: { file: PastQuestionFile } }> {
    return fetchJSON(`${API_BASE}/past-questions/files/${encodeURIComponent(id)}`, token);
  },
};

export function getStoragePublicUrl(bucket: string, filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required to build a public storage URL');
  }
  const cleanBase = supabaseUrl.replace(/\/$/, '');
  const safeBucket = encodeURIComponent(bucket);
  const safePath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${cleanBase}/storage/v1/object/public/${safeBucket}/${safePath}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
