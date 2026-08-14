export interface Course {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId?: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'archived';
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}
