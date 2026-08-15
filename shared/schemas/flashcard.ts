import { z } from 'zod';
import { FLASHCARD_MODES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
} from './common';

export const FlashcardModeSchema = z.enum(FLASHCARD_MODES);

export const FlashcardCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  imageUrl: optionalStringSchema,
  order: z.number().int().min(0),
});

export const FlashcardSchema = z.object({
  id: idSchema,
  courseId: optionalStringSchema,
  lessonId: optionalStringSchema,
  topicId: optionalStringSchema,
  subjectId: optionalStringSchema,
  title: z.string().min(1),
  description: optionalStringSchema,
  cards: z.array(FlashcardCardSchema).default([]),
  mode: FlashcardModeSchema,
  isPublic: z.boolean(),
  createdBy: optionalStringSchema,
  viewCount: z.number().int().min(0),
  usageCount: z.number().int().min(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const FlashcardReviewSchema = z.object({
  id: idSchema,
  flashcardId: idSchema,
  cardIndex: z.number().int().min(0),
  userId: idSchema,
  easeFactor: z.number().positive(),
  intervalDays: z.number().min(0),
  nextReviewAt: isoStringSchema,
  reviewsCount: z.number().int().min(0),
  lastAnswerCorrect: z.boolean().optional(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreateFlashcardSchema = FlashcardSchema.omit({
  id: true,
  viewCount: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateFlashcardSchema = CreateFlashcardSchema.partial();

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardCard = z.infer<typeof FlashcardCardSchema>;
export type FlashcardReview = z.infer<typeof FlashcardReviewSchema>;
export type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;
export type UpdateFlashcard = z.infer<typeof UpdateFlashcardSchema>;
