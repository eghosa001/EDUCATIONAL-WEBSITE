export interface Flashcard {
  id: string;
  front: string;
  back: string;
  courseId?: string;
  subjectId?: string;
  topicId?: string;
  createdBy: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewDate?: string;
  repetitionLevel?: number;
  easeFactor?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardReview {
  userId: string;
  flashcardId: string;
  rating: number;
  repetitionLevel: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewedAt: string;
  nextReviewDate: string;
}
