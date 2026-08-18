export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  status: 'draft' | 'published' | 'closed';
  questions?: ExamQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionText: string;
  questionImageUrl?: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
}

export interface ExamAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  percentage: number;
  isPassed: boolean;
  timeSpent: string;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  date: string;
  questions: Array<{
    id: number;
    text: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}
