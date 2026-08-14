export type LessonContentType = 'video' | 'text' | 'pdf' | 'audio' | 'interactive' | 'live';

export interface Lesson {
  id: string;
  courseId: string;
  sectionId?: string;
  topicId?: string;
  subtopicId?: string;
  title: string;
  slug: string;
  description?: string;
  learningObjectives: string[];
  contentType: LessonContentType;
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoThumbnailUrl?: string;
  writtenContent?: string;
  keyPoints: string[];
  orderIndex: number;
  isFree: boolean;
  isPublished: boolean;
  estimatedMinutes: number;
  viewCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonResource {
  id: string;
  lessonId: string;
  title: string;
  resourceType: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  description?: string;
  isDownloadable: boolean;
  orderIndex: number;
  createdAt: string;
}
