import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';

export interface PastQuestionTopicInsight {
  topicId: string;
  topicName: string;
  subjectId?: string | null;
  subjectName: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface PastQuestionSubjectInsight {
  subjectId: string;
  subjectName: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface PastQuestionBoardInsight {
  board: string;
  sessions: number;
  questions: number;
  correct: number;
  accuracy: number;
}

export interface PastQuestionRecentAttempt {
  id: string;
  board: string;
  year?: number | null;
  questionCount: number;
  correctCount: number;
  percentage: number;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface PastQuestionInsights {
  sessions: number;
  questions: number;
  correct: number;
  accuracy: number;
  timeSpentSeconds: number;
  boards: PastQuestionBoardInsight[];
  subjects: PastQuestionSubjectInsight[];
  strongTopics: PastQuestionTopicInsight[];
  weakTopics: PastQuestionTopicInsight[];
  weakSubjects: PastQuestionSubjectInsight[];
  recentAttempts: PastQuestionRecentAttempt[];
}

export const fetchPastQuestionInsights = async (token: string, limit = 200): Promise<PastQuestionInsights> => {
  const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions/insights?limit=${Math.max(1, Math.min(500, limit))}`, {
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
  });
  const payload = await handleApiResponse<{ data: { insights: PastQuestionInsights } }>(response);
  return payload.data.insights;
};
