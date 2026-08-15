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
  sectionId?: string;
  topicId?: string;
  title: string;
  slug?: string;
  description?: string;
  learningObjectives?: string[];
  type: LessonType;
  contentType?: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  writtenContent?: string;
  keyPoints?: string[];
  durationMinutes?: number;
  estimatedMinutes?: number;
  order: number;
  orderIndex?: number;
  isFree?: boolean;
  isPublished?: boolean;
  resources?: LessonResource[];
  createdAt: string;
  updatedAt: string;
}
