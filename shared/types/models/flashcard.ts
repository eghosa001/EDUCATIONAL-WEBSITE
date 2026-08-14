export interface Flashcard {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  front: string;
  back: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardReview {
  id: string;
  flashcardId: string;
  userId: string;
  rating: number;
  reviewedAt: string;
}
