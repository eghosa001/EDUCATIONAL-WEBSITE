import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { AiTutorSession, ChatMessage } from '@/types/models/ai';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== AI TUTOR ==========

export interface AiTutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiTutorRequest {
  message: string;
  subjectId?: string;
  topicId?: string;
  context?: Record<string, unknown>;
}

export interface AiTutorResponse {
  message: ChatMessage;
  sessionId: string;
}

export const sendAiTutorMessage = async (
  data: AiTutorRequest,
  token: string
): Promise<AiTutorResponse> => {
  const response = await fetch(`${baseUrl}/ai/tutor`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const fetchAiTutorSessions = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<AiTutorSession>> => {
  const response = await fetch(
    `${baseUrl}/ai/tutor/sessions?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};

export const fetchAiTutorSession = async (
  sessionId: string,
  token: string
): Promise<{ session: AiTutorSession }> => {
  const response = await fetch(`${baseUrl}/ai/tutor/sessions/${sessionId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteAiTutorSession = async (sessionId: string, token: string) => {
  const response = await fetch(`${baseUrl}/ai/tutor/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== AI QUIZ GENERATOR ==========

export interface AiQuizRequest {
  subjectId: string;
  topicId?: string;
  difficulty?: string;
  questionCount: number;
  questionTypes?: string[];
}

export interface AiGeneratedQuiz {
  id: string;
  questions: Array<{
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: string;
  }>;
  createdAt: string;
}

export const generateAiQuiz = async (data: AiQuizRequest, token: string): Promise<{ quiz: AiGeneratedQuiz }> => {
  const response = await fetch(`${baseUrl}/ai/quiz-generator`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== AI STUDY PLAN ==========

export interface AiStudyPlanRequest {
  subjectId: string;
  targetScore?: number;
  availableHoursPerDay: number;
  examDate?: string;
}

export interface AiStudyPlan {
  id: string;
  subjectId: string;
  dailySchedule: Array<{
    day: string;
    topics: string[];
    hours: number;
    resources: string[];
  }>;
  totalDurationDays: number;
  createdAt: string;
}

export const generateAiStudyPlan = async (
  data: AiStudyPlanRequest,
  token: string
): Promise<{ studyPlan: AiStudyPlan }> => {
  const response = await fetch(`${baseUrl}/ai/study-plan`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== AI EXPLAINER ==========

export interface AiExplainRequest {
  question: string;
  subjectId?: string;
  topicId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AiExplanation {
  explanation: string;
  keyPoints: string[];
  examples?: string[];
}

export const getAiExplanation = async (
  data: AiExplainRequest,
  token: string
): Promise<{ explanation: AiExplanation }> => {
  const response = await fetch(`${baseUrl}/ai/explain`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== AI FLASHCARDS ==========

export interface AiFlashcardRequest {
  subjectId: string;
  topicId?: string;
  count: number;
}

export interface AiFlashcard {
  id: string;
  front: string;
  back: string;
  subjectId: string;
  topicId?: string;
}

export const generateAiFlashcards = async (
  data: AiFlashcardRequest,
  token: string
): Promise<{ flashcards: AiFlashcard[] }> => {
  const response = await fetch(`${baseUrl}/ai/flashcards`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== AI SUMMARIZER ==========

export interface AiSummarizeRequest {
  content: string;
  type: 'lesson' | 'article' | 'video_transcript';
  length?: 'short' | 'medium' | 'detailed';
}

export interface AiSummary {
  summary: string;
  keyPoints: string[];
  readingTimeMinutes: number;
}

export const generateAiSummary = async (
  data: AiSummarizeRequest,
  token: string
): Promise<{ summary: AiSummary }> => {
  const response = await fetch(`${baseUrl}/ai/summarize`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== AI USAGE ==========

export interface AiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  mostUsedFeature: string;
}

export const fetchAiUsageStats = async (token: string): Promise<{ stats: AiUsageStats }> => {
  const response = await fetch(`${baseUrl}/ai/usage`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
