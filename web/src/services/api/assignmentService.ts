import { getSupabase } from '@/lib/supabase';

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrls?: string[];
  status: 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  isLate: boolean;
  submittedAt: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  teacherId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignmentType: string;
  maxScore: number;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const mapAssignment = (row: any): Assignment => ({
  id: row.id,
  courseId: row.course_id,
  courseTitle: row.courses?.title || undefined,
  teacherId: row.teacher_id || undefined,
  title: row.title,
  description: row.description || undefined,
  instructions: row.instructions || undefined,
  assignmentType: row.assignment_type || 'written',
  maxScore: Number(row.max_score || 0),
  dueDate: row.due_date,
  allowLateSubmission: Boolean(row.allow_late_submission),
  latePenaltyPercent: Number(row.late_penalty_percent || 0),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSubmission = (row: any): AssignmentSubmission => ({
  id: row.id,
  assignmentId: row.assignment_id,
  studentId: row.student_id,
  content: row.content || undefined,
  fileUrls: Array.isArray(row.file_urls) ? row.file_urls : [],
  status: row.status || 'submitted',
  score: row.score == null ? undefined : Number(row.score),
  feedback: row.feedback || undefined,
  gradedBy: row.graded_by || undefined,
  gradedAt: row.graded_at || undefined,
  isLate: Boolean(row.is_late),
  submittedAt: row.submitted_at,
  createdAt: row.submitted_at,
});

const currentUserId = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user.id;
};

export const fetchAssignments = async (
  filters: { page?: number; limit?: number; courseId?: string } = {},
  _token?: string
): Promise<{ data: Assignment[]; pagination: any }> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase()
    .from('assignments')
    .select('*, courses:course_id(title)', { count: 'exact' })
    .eq('is_active', true)
    .order('due_date', { ascending: true })
    .range(from, from + limit - 1);
  if (filters.courseId) query = query.eq('course_id', filters.courseId);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const total = count || 0;
  return { data: (data || []).map(mapAssignment), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const fetchMyAssignments = async (token: string, courseId?: string): Promise<{ assignments: Assignment[] }> => {
  const result = await fetchAssignments({ page: 1, limit: 100, courseId }, token);
  return { assignments: result.data };
};

export const fetchMySubmissions = async (
  _token: string,
  page = 1,
  limit = 20
): Promise<{ submissions: AssignmentSubmission[]; pagination: any }> => {
  const userId = await currentUserId();
  const from = (page - 1) * limit;
  const { data, error, count } = await getSupabase()
    .from('submissions')
    .select('*', { count: 'exact' })
    .eq('student_id', userId)
    .order('submitted_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const total = count || 0;
  return { submissions: (data || []).map(mapSubmission), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const fetchAssignmentById = async (assignmentId: string, _token: string): Promise<{ assignment: Assignment }> => {
  const { data, error } = await getSupabase()
    .from('assignments')
    .select('*, courses:course_id(title)')
    .eq('id', assignmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Assignment not found');
  return { assignment: mapAssignment(data) };
};

export const submitAssignment = async (
  assignmentId: string,
  data: { content: string; fileUrls?: string[] },
  _token: string
): Promise<{ submission: AssignmentSubmission }> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const { data: existing, error: existingError } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', userId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return { submission: mapSubmission(existing) };

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from('assignments')
    .select('due_date,allow_late_submission')
    .eq('id', assignmentId)
    .eq('is_active', true)
    .maybeSingle();
  if (assignmentError) throw new Error(assignmentError.message);
  if (!assignmentRow) throw new Error('Assignment not found');

  const isLate = Boolean(assignmentRow.due_date && new Date(assignmentRow.due_date) < new Date());
  if (isLate && !assignmentRow.allow_late_submission) throw new Error('This assignment no longer accepts submissions');

  const { data: inserted, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: userId,
      content: data.content,
      file_urls: data.fileUrls || [],
      status: isLate ? 'late' : 'submitted',
      is_late: isLate,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { submission: mapSubmission(inserted) };
};

export const gradeSubmission = async (
  assignmentId: string,
  submissionId: string,
  data: { score: number; feedback: string },
  _token: string
): Promise<{ submission: AssignmentSubmission }> => {
  const { data: updated, error } = await getSupabase()
    .from('submissions')
    .update({ score: data.score, feedback: data.feedback, status: 'graded', graded_at: new Date().toISOString() })
    .eq('id', submissionId)
    .eq('assignment_id', assignmentId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { submission: mapSubmission(updated) };
};

export const fetchAssignmentSubmissions = async (
  assignmentId: string,
  _token: string
): Promise<{ submissions: AssignmentSubmission[] }> => {
  const { data, error } = await getSupabase()
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { submissions: (data || []).map(mapSubmission) };
};
