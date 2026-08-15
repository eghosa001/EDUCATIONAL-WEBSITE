import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface SchoolRow {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  lga?: string;
  type?: string;
  logo_url?: string;
  status: string;
  student_count?: number;
  teacher_count?: number;
  created_at: string;
  [key: string]: unknown;
}

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const fetchSchools = async (token: string, filters: SchoolFilters = {}): Promise<{ data: { data: SchoolRow[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '50');
  const response = await fetch(`${baseUrl}/schools?${params.toString()}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const fetchSchool = async (token: string, id: string): Promise<{ data: SchoolRow }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export interface SchoolStats {
  students: number;
  teachers: number;
  classes: number;
  [key: string]: unknown;
}

export const fetchSchoolStats = async (token: string, id: string): Promise<{ data: SchoolStats }> => {
  const response = await fetch(`${baseUrl}/schools/${id}/stats`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createSchool = async (token: string, data: Record<string, unknown>): Promise<{ data: SchoolRow; message: string }> => {
  const response = await fetch(`${baseUrl}/schools`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateSchool = async (token: string, id: string, data: Record<string, unknown>): Promise<{ data: SchoolRow; message: string }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteSchool = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ---- Classes ----
export interface SchoolClass {
  id: string;
  school_id: string;
  class_id: string;
  teacher_id?: string;
  teacher_name?: string;
  class_name?: string;
  class_code?: string;
  capacity?: number;
  term_id?: string;
  academic_year?: number;
  status?: string;
  created_at: string;
}

export interface ClassFilters {
  page?: number;
  limit?: number;
}

export const fetchSchoolClasses = async (
  token: string,
  schoolId: string,
  filters: ClassFilters = {}
): Promise<{ data: { data: SchoolClass[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '20');
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createSchoolClass = async (
  token: string,
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ data: SchoolClass }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateSchoolClass = async (
  token: string,
  schoolId: string,
  classId: string,
  data: Record<string, unknown>
): Promise<{ data: SchoolClass }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteSchoolClass = async (
  token: string,
  schoolId: string,
  classId: string
): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchClassStudents = async (
  token: string,
  schoolId: string,
  classId: string
): Promise<{ data: Array<{ id: string; first_name: string; last_name: string; email: string }> }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}/students`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ---- Timetable ----
export interface TimetableEntry {
  id: string;
  school_id: string;
  class_id: string;
  subject_id?: string;
  teacher_id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  academic_year?: number;
  term_id?: string;
  is_active?: boolean;
  class_name?: string;
  class_code?: string;
  subject_name?: string;
  subject_code?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface TimetableFilters {
  page?: number;
  limit?: number;
  classId?: string;
  dayOfWeek?: string;
  termId?: string;
}

export const fetchTimetables = async (
  token: string,
  schoolId: string,
  filters: TimetableFilters = {}
): Promise<{ data: { data: TimetableEntry[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '50');
  const response = await fetch(`${baseUrl}/schools/${schoolId}/timetables?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createTimetable = async (
  token: string,
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ data: TimetableEntry }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/timetables`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateTimetable = async (
  token: string,
  schoolId: string,
  timeTableId: string,
  data: Record<string, unknown>
): Promise<{ data: TimetableEntry }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/timetables/${timeTableId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteTimetable = async (
  token: string,
  schoolId: string,
  timeTableId: string
): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/timetables/${timeTableId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ---- Attendance ----
export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  class_name?: string;
  class_code?: string;
  created_at: string;
}

export interface AttendanceStats {
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  total: number;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  classId?: string;
  startDate?: string;
  endDate?: string;
  studentId?: string;
}

export const fetchAttendance = async (
  token: string,
  schoolId: string,
  filters: AttendanceFilters = {}
): Promise<{ data: { data: AttendanceRecord[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '20');
  const response = await fetch(`${baseUrl}/schools/${schoolId}/attendance?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchAttendanceStats = async (
  token: string,
  schoolId: string,
  filters: { classId?: string; startDate?: string; endDate?: string } = {}
): Promise<{ data: AttendanceStats }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/schools/${schoolId}/attendance/stats?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const markAttendance = async (
  token: string,
  schoolId: string,
  data: { studentId: string; date: string; status: string; notes?: string; classId?: string }
): Promise<{ data: AttendanceRecord }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const bulkMarkAttendance = async (
  token: string,
  schoolId: string,
  records: Array<{ studentId: string; date: string; status: string; notes?: string }>
): Promise<{ data: Array<{ studentId: string; error?: string }> }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/attendance/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ records }),
  });
  return handleApiError(response);
};

// ---- Fees ----
export interface FeeRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  term_id?: string;
  academic_year?: number;
  fee_type: string;
  description?: string;
  amount: number;
  discount: number;
  final_amount: number;
  amount_paid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'waived' | 'overdue';
  due_date?: string;
  paid_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  class_name?: string;
  class_code?: string;
  created_at: string;
}

export interface FeeSummary {
  total_fees: number;
  paid_count: number;
  pending_count: number;
  partial_count: number;
  overdue_count: number;
  total_amount: number;
  total_collected: number;
  total_balance: number;
}

export interface FeeFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  status?: string;
  termId?: string;
}

export const fetchFees = async (
  token: string,
  schoolId: string,
  filters: FeeFilters = {}
): Promise<{ data: { data: FeeRecord[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '20');
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchFeeSummary = async (
  token: string,
  schoolId: string,
  filters: { classId?: string; termId?: string; academicYear?: number } = {}
): Promise<{ data: FeeSummary }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees/summary?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createFee = async (
  token: string,
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ data: FeeRecord }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const recordPayment = async (
  token: string,
  schoolId: string,
  feeId: string,
  data: { amount: number; reference?: string }
): Promise<{ data: FeeRecord }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees/${feeId}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateFee = async (
  token: string,
  schoolId: string,
  feeId: string,
  data: Record<string, unknown>
): Promise<{ data: FeeRecord }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees/${feeId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteFee = async (
  token: string,
  schoolId: string,
  feeId: string
): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/fees/${feeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ---- Results ----
export interface SchoolResult {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  subject_id?: string;
  exam_id?: string;
  term_id?: string;
  academic_year?: number;
  coursework_score: number;
  exam_score: number;
  total_score: number;
  grade?: string;
  remark?: string;
  teacher_id?: string;
  published?: boolean;
  published_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  class_name?: string;
  class_code?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  created_at: string;
}

export interface ResultSummary {
  total_results: number;
  avg_score: number;
  passed_count: number;
  failed_count: number;
}

export interface ResultFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  termId?: string;
  academicYear?: number;
  published?: boolean;
}

export const fetchResults = async (
  token: string,
  schoolId: string,
  filters: ResultFilters = {}
): Promise<{ data: { data: SchoolResult[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '20');
  const response = await fetch(`${baseUrl}/schools/${schoolId}/results?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchResultSummary = async (
  token: string,
  schoolId: string,
  filters: { classId?: string; termId?: string; academicYear?: number } = {}
): Promise<{ data: ResultSummary }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/schools/${schoolId}/results/summary?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createResult = async (
  token: string,
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ data: SchoolResult }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/results`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateResult = async (
  token: string,
  schoolId: string,
  resultId: string,
  data: Record<string, unknown>
): Promise<{ data: SchoolResult }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/results/${resultId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteResult = async (
  token: string,
  schoolId: string,
  resultId: string
): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/results/${resultId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
