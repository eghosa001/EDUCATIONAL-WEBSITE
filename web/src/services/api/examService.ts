import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Exam, ExamResult, ExamAttempt } from '@/types/models/exam';
import type { Question } from '@/types/models/question';
import type { PaginatedResponse } from '@/types/api/api';
import { getSupabase } from '@/lib/supabase';

const { baseUrl } = apiConfig;

// ========== EXAMS ==========

export interface ExamFilters {
  page?: number;
  limit?: number;
  examType?: string;
  subjectId?: string;
  classId?: string;
  isPublic?: boolean;
}

export interface ExamWithStats extends Exam {
  questionCount: number;
  totalMarks: number;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  options: unknown[];
  marks: number;
  orderIndex: number;
  sectionName?: string;
  difficulty?: string;
  timeLimitSeconds?: number;
}

export interface ExamAttemptData {
  examId: string;
  answers: Array<{
    questionId: string;
    studentAnswer: unknown;
    timeSpentSeconds?: number;
  }>;
  timeSpentSeconds?: number;
}

export interface ExamResultData {
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  showResults: boolean;
}

export const fetchExams = async (
  filters: ExamFilters = {},
  token?: string
): Promise<PaginatedResponse<Exam>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/exams?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchExamById = async (examId: string, token?: string): Promise<{ exam: ExamWithStats }> => {
  const response = await fetch(`${baseUrl}/exams/${examId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createExam = async (examData: Partial<Exam>, token: string) => {
  const response = await fetch(`${baseUrl}/exams`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(examData), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateExam = async (examId: string, examData: Partial<Exam>, token: string) => {
  const response = await fetch(`${baseUrl}/exams/${examId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(examData), credentials: 'include'
  });
  return handleApiError(response);
};

export const publishExam = async (examId: string, token: string) => {
  const response = await fetch(`${baseUrl}/exams/${examId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteExam = async (examId: string, token: string) => {
  const response = await fetch(`${baseUrl}/exams/${examId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== EXAM QUESTIONS ==========

export const fetchExamQuestions = async (examId: string, token: string): Promise<{ questions: ExamQuestion[] }> => {
  const response = await fetch(`${baseUrl}/exams/${examId}/questions`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addQuestionToExam = async (
  examId: string,
  questionData: { questionId: string; orderIndex?: number; marks?: number; sectionName?: string },
  token: string
) => {
  const response = await fetch(`${baseUrl}/exams/${examId}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(questionData), credentials: 'include'
  });
  return handleApiError(response);
};

export const removeQuestionFromExam = async (
  examId: string,
  questionId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/exams/${examId}/questions/${questionId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== EXAM ATTEMPTS ==========

export const startExamAttempt = async (examId: string, token: string) => {
  const response = await fetch(`${baseUrl}/exams/${examId}/attempts`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const submitExamAttempt = async (
  examId: string,
  attemptId: string,
  attemptData: ExamAttemptData,
  token: string
): Promise<{ attempt: ExamAttempt; result: ExamResultData }> => {
  const response = await fetch(
    `${baseUrl}/exams/${examId}/attempts/${attemptId}/submit`,
    {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(attemptData), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchMyExamAttempts = async (
  page: number = 1,
  limit: number = 20,
  _token: string
): Promise<PaginatedResponse<ExamAttempt>> => {
  const supabase = getSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('You must be signed in');
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from('exam_attempts')
    .select('*, exams:exam_id(title)', { count: 'exact' })
    .eq('student_id', auth.user.id)
    .order('started_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const attempts = (data || []).map((row: any) => ({
    ...row,
    examId: row.exam_id,
    studentId: row.student_id,
    examTitle: row.exams?.title || 'Exam',
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    timeSpentSeconds: row.time_spent_seconds,
    percentage: row.percentage == null ? undefined : Number(row.percentage),
    score: row.score == null ? undefined : Number(row.score),
    isPassed: Boolean(row.is_passed),
  })) as ExamAttempt[];
  const total = count || 0;
  return { data: attempts, page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const fetchExamAttempts = async (
  examId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<ExamAttempt>> => {
  const response = await fetch(
    `${baseUrl}/exams/${examId}/attempts?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchExamAttempt = async (
  examId: string,
  attemptId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/exams/${examId}/attempts/${attemptId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchExamLeaderboard = async (examId: string, token?: string) => {
  const response = await fetch(`${baseUrl}/exams/${examId}/leaderboard`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
