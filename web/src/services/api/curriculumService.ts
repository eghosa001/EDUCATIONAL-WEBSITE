import { getSupabase } from '@/lib/supabase';

// Curriculum is standard application data, so the web client reads it directly
// from Supabase and relies on RLS for access control.

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

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export const fetchEducationLevels = async (_token?: string): Promise<EducationLevel[]> => {
  const { data, error } = await getSupabase()
    .from('education_levels')
    .select('*')
    .eq('is_active', true)
    .order('order_index');
  throwIfError(error);
  return (data || []) as EducationLevel[];
};

export interface SubjectFilters {
  page?: number;
  limit?: number;
  educationSystemId?: string;
  classId?: string;
  levelCode?: string;
}

export const fetchSubjects = async (filters: SubjectFilters = {}, _token?: string): Promise<Subject[]> => {
  const supabase = getSupabase();
  let educationSystemId = filters.educationSystemId;

  if (filters.levelCode && !educationSystemId) {
    const { data: level, error } = await supabase
      .from('education_levels')
      .select('education_system_id')
      .eq('code', filters.levelCode)
      .eq('is_active', true)
      .maybeSingle();
    throwIfError(error);
    educationSystemId = level?.education_system_id;
  }

  let query = supabase.from('subjects').select('*').eq('is_active', true).order('order_index');
  if (educationSystemId) query = query.eq('education_system_id', educationSystemId);

  if (filters.classId) {
    const { data: classSubjects, error } = await supabase
      .from('class_subjects')
      .select('subject_id')
      .eq('class_id', filters.classId);
    throwIfError(error);
    const subjectIds = (classSubjects || []).map((row: any) => row.subject_id);
    if (!subjectIds.length) return [];
    query = query.in('id', subjectIds);
  }

  if (filters.limit) query = query.limit(Math.min(200, Math.max(1, filters.limit)));
  if (filters.page && filters.limit) query = query.range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

  const { data, error } = await query;
  throwIfError(error);
  return (data || []) as Subject[];
};

export const fetchSubjectsByLevel = async (levelCode: string, token?: string) =>
  fetchSubjects({ levelCode, limit: 100 }, token);

export interface TopicFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  classId?: string;
  termId?: string;
  levelCode?: string;
}

export const fetchTopics = async (filters: TopicFilters = {}, _token?: string): Promise<Topic[]> => {
  const supabase = getSupabase();
  let classIds: string[] | undefined;

  if (filters.levelCode) {
    const { data: level, error: levelError } = await supabase
      .from('education_levels')
      .select('id')
      .eq('code', filters.levelCode)
      .eq('is_active', true)
      .maybeSingle();
    throwIfError(levelError);
    if (!level) return [];

    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('education_level_id', level.id)
      .eq('is_active', true);
    throwIfError(programsError);
    const programIds = (programs || []).map((row: any) => row.id);
    if (!programIds.length) return [];

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .in('program_id', programIds)
      .eq('is_active', true);
    throwIfError(classesError);
    classIds = (classes || []).map((row: any) => row.id);
  }

  let query = supabase
    .from('topics')
    .select('*, terms(name)')
    .eq('is_active', true)
    .order('order_index');

  if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
  if (filters.classId) query = query.eq('class_id', filters.classId);
  else if (classIds) {
    if (!classIds.length) return [];
    query = query.in('class_id', classIds);
  }
  if (filters.termId) query = query.eq('term_id', filters.termId);
  if (filters.limit) query = query.limit(Math.min(500, Math.max(1, filters.limit)));
  if (filters.page && filters.limit) query = query.range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

  const { data, error } = await query;
  throwIfError(error);

  return (data || []).map((row: any) => ({
    ...row,
    term_name: row.terms?.name || '',
  })) as Topic[];
};

export const fetchSubjectTopics = async (subjectId: string, levelCode: string, token?: string) =>
  fetchTopics({ subjectId, levelCode, limit: 200 }, token);
