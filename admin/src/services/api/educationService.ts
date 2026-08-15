import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface EducationSystemRow {
  id: string;
  name: string;
  code: string;
  country: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface EducationLevelRow {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description?: string;
  order_index: number;
  min_age?: number;
  max_age?: number;
  is_active: boolean;
  created_at: string;
}

export interface ProgramRow {
  id: string;
  education_level_id: string;
  name: string;
  code: string;
  description?: string;
  duration_years?: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface ClassRoomRow {
  id: string;
  program_id: string;
  name: string;
  code: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export const fetchSystems = async (token: string): Promise<{ data: { systems: EducationSystemRow[]; pagination?: unknown } }> => {
  const response = await fetch(`${baseUrl}/education/systems?page=1&limit=100`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createSystem = async (token: string, data: Record<string, unknown>): Promise<{ data: { system: EducationSystemRow } }> => {
  const response = await fetch(`${baseUrl}/education/systems`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const fetchLevels = async (token: string, systemId: string): Promise<{ data: { levels: EducationLevelRow[] } }> => {
  const response = await fetch(`${baseUrl}/education/systems/${systemId}/levels`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createLevel = async (token: string, systemId: string, data: Record<string, unknown>): Promise<{ data: { level: EducationLevelRow } }> => {
  const response = await fetch(`${baseUrl}/education/systems/${systemId}/levels`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const fetchPrograms = async (token: string, levelId: string): Promise<{ data: { programs: ProgramRow[] } }> => {
  const response = await fetch(`${baseUrl}/education/levels/${levelId}/programs`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createProgram = async (token: string, levelId: string, data: Record<string, unknown>): Promise<{ data: { program: ProgramRow } }> => {
  const response = await fetch(`${baseUrl}/education/levels/${levelId}/programs`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const fetchClasses = async (token: string, programId: string): Promise<{ data: { classes: ClassRoomRow[] } }> => {
  const response = await fetch(`${baseUrl}/education/programs/${programId}/classes`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createClass = async (token: string, programId: string, data: Record<string, unknown>): Promise<{ data: { class: ClassRoomRow } }> => {
  const response = await fetch(`${baseUrl}/education/programs/${programId}/classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const fetchTerms = async (token: string): Promise<{ data: { terms: Array<{ id: string; name: string; code: string; order_index: number }> } }> => {
  const response = await fetch(`${baseUrl}/education/terms?page=1&limit=100`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};
