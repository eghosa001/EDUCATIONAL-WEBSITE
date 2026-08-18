export interface SubjectPerformance {
  subject: string;
  subjectId: string;
  completionPercentage: number;
  avgScore: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesTaken: number;
  weakTopics: string[];
  strongTopics: string[];
}

export interface StudySession {
  id: string;
  subjectId?: string;
  topicId?: string;
  courseId?: string;
  lessonId?: string;
  sessionType: 'video' | 'quiz' | 'reading' | 'flashcard' | 'exam' | 'assignment';
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  score?: number;
  isCompleted: boolean;
}

export interface ProgressData {
  coursesCompleted: number;
  coursesInProgress: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  bestStreak: number;
  overallPercentage: number;
  xp: number;
  level: number;
}
