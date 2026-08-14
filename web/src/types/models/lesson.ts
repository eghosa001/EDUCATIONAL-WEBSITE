export type LessonType = 'video' | 'text' | 'interactive' | 'quiz';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: LessonType;
  contentUrl?: string;
  durationMinutes?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}
