import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { School, SchoolClass, Subject, Topic } from '@/types/models/school';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== SCHOOLS ==========

export interface CreateSchoolData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export const fetchSchools = async (
  filters: { page?: number; limit?: number; search?: string } = {},
  token?: string
): Promise<{ data: any[]; pagination: any }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/schools?${params.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const joinSchool = async (schoolCode: string, token: string) => {
  const response = await fetch(`${baseUrl}/schools/join`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ schoolCode, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const fetchSchoolById = async (schoolId: string, token?: string): Promise<{ school: School }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createSchool = async (data: CreateSchoolData, token: string) => {
  const response = await fetch(`${baseUrl}/schools`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateSchool = async (schoolId: string, data: Partial<CreateSchoolData>, token: string) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteSchool = async (schoolId: string, token: string) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL CLASSES ==========

export interface CreateSchoolClassData {
  name: string;
  levelId: string;
}

export const fetchSchoolClasses = async (
  schoolId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<SchoolClass>> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchSchoolClassById = async (
  schoolId: string,
  classId: string,
  token?: string
): Promise<{ schoolClass: SchoolClass }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createSchoolClass = async (
  schoolId: string,
  data: CreateSchoolClassData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateSchoolClass = async (
  schoolId: string,
  classId: string,
  data: Partial<CreateSchoolClassData>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteSchoolClass = async (schoolId: string, classId: string, token: string) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/classes/${classId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL STUDENTS ==========

export interface SchoolStudent {
  id: string;
  userId: string;
  schoolId: string;
  classId: string;
  admissionNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
}

export const fetchSchoolStudents = async (
  schoolId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<SchoolStudent>> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/students?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addStudentToSchool = async (
  schoolId: string,
  data: { userId: string; classId: string; admissionNumber?: string },
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/students`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const removeStudentFromSchool = async (
  schoolId: string,
  userId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/students/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL TEACHERS ==========

export interface SchoolTeacher {
  id: string;
  userId: string;
  schoolId: string;
  subjectIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
}

export const fetchSchoolTeachers = async (
  schoolId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<SchoolTeacher>> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/teachers?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addTeacherToSchool = async (
  schoolId: string,
  data: { userId: string; subjectIds: string[] },
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/teachers`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const removeTeacherFromSchool = async (
  schoolId: string,
  userId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/teachers/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL SUBJECTS ==========

export const fetchSchoolSubjects = async (
  schoolId: string,
  token?: string
): Promise<{ subjects: Subject[] }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/subjects`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addSubjectToSchool = async (
  schoolId: string,
  subjectId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/subjects`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subjectId, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const removeSubjectFromSchool = async (
  schoolId: string,
  subjectId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL ANALYTICS ==========

export interface SchoolAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  averageExamScore: number;
  courseCompletionRate: number;
}

export const fetchSchoolAnalytics = async (schoolId: string, token: string): Promise<{ analytics: SchoolAnalytics }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/analytics`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== SCHOOL SETTINGS ==========

export interface SchoolSettings {
  academicYear: string;
  term: string;
  schoolHours: { start: string; end: string };
  gradingSystem: string;
}

export const fetchSchoolSettings = async (schoolId: string, token: string): Promise<{ settings: SchoolSettings }> => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/settings`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateSchoolSettings = async (
  schoolId: string,
  settings: Partial<SchoolSettings>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/schools/${schoolId}/settings`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(settings), credentials: 'include'
  });
  return handleApiError(response);
};
