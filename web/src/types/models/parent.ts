export interface ChildProgress {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  className?: string;
  schoolName?: string;
  coursesEnrolled: number;
  averageScore: number;
  studyTimeMinutes: number;
  currentStreak: number;
  weakSubjects: string[];
  strongSubjects: string[];
  lastActiveAt: string;
}

export interface ParentDashboardData {
  childId: string;
  userName: string;
  coursesCompleted: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  averageScore: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  subjectPerformance: Array<{
    subject: string;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    timestamp: string;
  }>;
}
