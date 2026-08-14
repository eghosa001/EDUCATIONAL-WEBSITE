import type { Question } from './question';

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMinutes?: number;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showExplanation: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionId: string;
  orderIndex: number;
  marks: number;
}

export type ExamType =
  | 'practice'
  | 'timed_test'
  | 'mock'
  | 'past_questions'
  | 'subject_test'
  | 'topic_test'
  | 'full_examination'
  | 'competition';

export interface Exam {
  id: string;
  title: string;
  slug: string;
  description?: string;
  examType: ExamType;
  subjectId?: string;
  classId?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  startTime?: string;
  endTime?: string;
  isTimed: boolean;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  allowReview: boolean;
  maxAttempts: number;
  isActive: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  orderIndex: number;
  marks: number;
  sectionName?: string;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}
