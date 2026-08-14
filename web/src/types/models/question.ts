export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';

export interface Question {
  id: string;
  examId?: string;
  subjectId: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}
