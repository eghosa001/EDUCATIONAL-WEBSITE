import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

// ========== TYPES ==========

export interface EducationLevel {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description: string | null;
  order_index: number;
  min_age: number | null;
  max_age: number | null;
  is_active: boolean;
}

export interface Subject {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
  is_core: boolean;
  is_active: boolean;
}

export interface Topic {
  id: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  term_name: string;
  name: string;
  code: string;
  description: string | null;
  learning_objectives: string[];
  order_index: number;
  estimated_hours: string | null;
  is_active: boolean;
}

// ========== EDUCATION LEVELS ==========

export const fetchEducationLevels = async (token?: string) => {
  const response = await fetch(`${baseUrl}/curriculum/education-levels`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const json = await handleApiError(response);
  return json.data.educationLevels as EducationLevel[];
};

// ========== SUBJECTS ==========

export interface SubjectFilters {
  page?: number;
  limit?: number;
  educationSystemId?: string;
  classId?: string;
  levelCode?: string;
}

export const fetchSubjects = async (filters: SubjectFilters = {}, token?: string) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/curriculum/subjects?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const json = await handleApiError(response);
  return json.data.subjects as Subject[];
};

export const fetchSubjectsByLevel = async (levelCode: string, token?: string) => {
  return fetchSubjects({ levelCode, limit: 100 }, token);
};

// ========== TOPICS ==========

export interface TopicFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  classId?: string;
  termId?: string;
  levelCode?: string;
}

export const fetchTopics = async (filters: TopicFilters = {}, token?: string) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/curriculum/topics?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const json = await handleApiError(response);
  return json.data.topics as Topic[];
};

export const fetchSubjectTopics = async (
  subjectId: string,
  levelCode: string,
  token?: string
) => {
  return fetchTopics({ subjectId, levelCode, limit: 200 }, token);
};
