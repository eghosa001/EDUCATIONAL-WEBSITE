export interface StudentCourse {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progressPercentage: number;
  lastAccessedAt?: string;
  certificateIssuedAt?: string;
  certificateUrl?: string;
}

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  courseId: string;
  status: LessonProgressStatus;
  progressPercentage: number;
  watchTimeSeconds: number;
  completedAt?: string;
  lastPositionSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  studentId: string;
  courseId?: string;
  lessonId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  activityType?: string;
  metadata: Record<string, unknown>;
}
