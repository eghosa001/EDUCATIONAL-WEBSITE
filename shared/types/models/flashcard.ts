export type FlashcardMode = 'standard' | 'spaced_repetition' | 'shuffle' | 'test_mode';

export interface Flashcard {
  id: string;
  courseId?: string;
  lessonId?: string;
  topicId?: string;
  subjectId?: string;
  title: string;
  description?: string;
  cards: FlashcardCard[];
  mode: FlashcardMode;
  isPublic: boolean;
  createdBy?: string;
  viewCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCard {
  front: string;
  back: string;
  imageUrl?: string;
  order: number;
}

export interface FlashcardReview {
  id: string;
  flashcardId: string;
  cardIndex: number;
  userId: string;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string;
  reviewsCount: number;
  lastAnswerCorrect?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Report {
  id: string;
  type: string;
  title: string;
  description?: string;
  filters: Record<string, unknown>;
  generatedBy?: string;
  fileUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  topicId?: string;
  title: string;
  context: Record<string, unknown>;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed?: number;
  model?: string;
  createdAt: string;
}

export interface AiUsage {
  id: string;
  userId: string;
  date: string;
  questionsAsked: number;
  tokensUsed: number;
  conversationsStarted: number;
}
