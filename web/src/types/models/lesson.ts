export type LessonType = 'video' | 'text' | 'interactive' | 'quiz';

export interface LessonResource {
  id: string;
  lessonId: string;
  title: string;
  resourceType: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  description?: string;
  isDownloadable?: boolean;
  orderIndex: number;
}

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
