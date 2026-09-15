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
  teacherId?: string;
  courseTitle?: string;
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
  teacherId: row.teacher_id || undefined,
  courseTitle: row.courses?.title || undefined,
  title: row.title,
  description: row.description || undefined,
  instructions: row.instructions || undefined,
  assignmentType: row.assignment_type,
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
  status: row.status,
  score: row.score == null ? undefined : Number(row.score),
  feedback: row.feedback || undefined,
  gradedBy: row.graded_by || undefined,
  gradedAt: row.graded_at || undefined,
  isLate: Boolean(row.is_late),
  submittedAt: row.submitted_at,
  createdAt: row.submitted_at,
});

const requireUser = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user;
};

export const fetchAssignments = async (
  filters: { page?: number; limit?: number; courseId?: string } = {},
  _token?: string
): Promise<{ data: Assignment[]; pagination?: any }> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase()
    .from('assignments')
    .select('*, courses(title)', { count: 'exact' })
    .eq('is_active', true)
    .order('due_date', { ascending: true })
    .range(from, from + limit - 1);
  if (filters.courseId) query = query.eq('course_id', filters.courseId);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data || []).map(mapAssignment), pagination: { page, limit, total: count || 0 } };
};

export const fetchMyAssignments = async (_token: string, courseId?: string): Promise<{ assignments: Assignment[] }> => {
  const result = await fetchAssignments({ page: 1, limit: 100, courseId });
  return { assignments: result.data };
};

export const fetchMySubmissions = async (
  _token: string,
  page = 1,
  limit = 20
): Promise<{ submissions: AssignmentSubmission[]; pagination: any }> => {
  const user = await requireUser();
  const from = (Math.max(1, page) - 1) * limit;
  const { data, error, count } = await getSupabase()
    .from('submissions')
    .select('*', { count: 'exact' })
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  return { submissions: (data || []).map(mapSubmission), pagination: { page, limit, total: count || 0 } };
};

export const fetchAssignmentById = async (assignmentId: string, _token: string): Promise<{ assignment: Assignment }> => {
  const { data, error } = await getSupabase().from('assignments').select('*, courses(title)').eq('id', assignmentId).eq('is_active', true).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Assignment not found');
  return { assignment: mapAssignment(data) };
};

export const submitAssignment = async (
  assignmentId: string,
  data: { content: string; fileUrls?: string[] },
  _token: string
): Promise<{ submission: AssignmentSubmission }> => {
  const user = await requireUser();
  const { data: assignment, error: assignmentError } = await getSupabase().from('assignments').select('due_date,allow_late_submission').eq('id', assignmentId).eq('is_active', true).maybeSingle();
  if (assignmentError || !assignment) throw new Error(assignmentError?.message || 'Assignment not found');
  const isLate = new Date(assignment.due_date).getTime() < Date.now();
  if (isLate && !assignment.allow_late_submission) throw new Error('This assignment no longer accepts submissions.');
  const { data: existing } = await getSupabase().from('submissions').select('id').eq('assignment_id', assignmentId).eq('student_id', user.id).maybeSingle();
  if (existing) throw new Error('You have already submitted this assignment.');
  const { data: row, error } = await getSupabase().from('submissions').insert({
    assignment_id: assignmentId,
    student_id: user.id,
    content: data.content.trim(),
    file_urls: data.fileUrls || [],
    status: isLate ? 'late' : 'submitted',
    is_late: isLate,
    submitted_at: new Date().toISOString(),
  }).select('*').single();
  if (error) throw new Error(error.message);
  return { submission: mapSubmission(row) };
};

export const gradeSubmission = async (_assignmentId: string, submissionId: string, data: { score: number; feedback: string }, _token: string): Promise<{ submission: AssignmentSubmission }> => {
  const { data: row, error } = await getSupabase().from('submissions').update({ score: data.score, feedback: data.feedback, status: 'graded', graded_at: new Date().toISOString() }).eq('id', submissionId).select('*').single();
  if (error) throw new Error(error.message);
  return { submission: mapSubmission(row) };
};

export const fetchAssignmentSubmissions = async (assignmentId: string, _token: string): Promise<{ submissions: AssignmentSubmission[] }> => {
  const { data, error } = await getSupabase().from('submissions').select('*').eq('assignment_id', assignmentId).order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { submissions: (data || []).map(mapSubmission) };
};
