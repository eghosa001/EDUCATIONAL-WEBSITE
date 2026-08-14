export type LibraryResourceType = 'textbook' | 'study_notes' | 'past_question' | 'research' | 'handout' | 'lecture_notes' | 'pdf' | 'article' | 'video';

export interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  resourceType: LibraryResourceType;
  subjectId?: string;
  classId?: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  author?: string;
  isDownloadable: boolean;
  isPremium: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}
