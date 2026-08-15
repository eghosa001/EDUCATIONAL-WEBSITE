export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  subjectId?: string;
  teacherId?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  status: 'draft' | 'published' | 'archived';
  lessonCount?: number;
  enrollmentCount?: number;
  totalDurationHours?: number;
  estimatedDuration?: number;
  difficulty?: string;
  isFree?: boolean;
  price?: number;
  currency?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
}
