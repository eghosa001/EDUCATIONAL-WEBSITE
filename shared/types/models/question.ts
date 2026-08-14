export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'short_answer'
  | 'essay'
  | 'numerical'
  | 'image_based'
  | 'multiple_select';

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export interface Question {
  id: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  classId?: string;
  questionType: QuestionType;
  questionText: string;
  questionImageUrl?: string;
  options: unknown[];
  correctAnswer: unknown;
  explanation?: string;
  explanationImageUrl?: string;
  difficulty: Difficulty;
  marks: number;
  negativeMarks: number;
  timeLimitSeconds?: number;
  source?: string;
  examYear?: number;
  examName?: string;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
