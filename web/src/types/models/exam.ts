export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  passed: boolean;
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
