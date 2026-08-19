export type CourseStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'rejected';

export interface Course {
  id: string;
  subjectId?: string;
  classId?: string;
  termId?: string;
  teacherId?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  difficulty: string;
  status: CourseStatus;
  price: number;
  currency: string;
  isFree: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  totalDurationHours: number;
  lessonCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
