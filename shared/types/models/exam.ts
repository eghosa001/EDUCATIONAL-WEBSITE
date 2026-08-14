export type ExamAttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired' | 'abandoned';

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  status: ExamAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
  score?: number;
  percentage?: number;
  isPassed?: boolean;
  rank?: number;
  totalStudents?: number;
  metadata: Record<string, unknown>;
}

export interface ExamAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  studentAnswer?: unknown;
  isCorrect?: boolean;
  marksObtained: number;
  timeSpentSeconds?: number;
  answeredAt: string;
}
