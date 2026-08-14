export type LibraryResourceType = 'textbook' | 'study_notes' | 'past_question' | 'research' | 'handout' | 'lecture_notes' | 'pdf' | 'article' | 'video';

export interface LibraryResource {
  id: string;
  title: string;
  slug: string;
  resourceType: LibraryResourceType;
  fileUrl: string;
  thumbnailUrl?: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  classId?: string;
  examBoard?: string;
  examYear?: number;
  authorId?: string;
  downloadCount: number;
  viewCount: number;
  isFree: boolean;
  fileSizeBytes?: number;
  mimeType?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
