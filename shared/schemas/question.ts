import { z } from 'zod';
import { DIFFICULTIES, QUESTION_TYPES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  arrayOf,
} from './common';

export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export const DifficultySchema = z.enum(DIFFICULTIES);

export const QuestionSchema = z.object({
  id: idSchema,
  subjectId: optionalStringSchema,
  topicId: optionalStringSchema,
  subtopicId: optionalStringSchema,
  classId: optionalStringSchema,
  questionType: QuestionTypeSchema,
  questionText: z.string().min(1),
  questionImageUrl: optionalStringSchema,
  options: z.array(z.unknown()).default([]),
  correctAnswer: z.unknown(),
  explanation: optionalStringSchema,
  explanationImageUrl: optionalStringSchema,
  difficulty: DifficultySchema,
  marks: z.number().min(0),
  negativeMarks: z.number().default(0),
  timeLimitSeconds: nullableNumberSchema,
  source: optionalStringSchema,
  examYear: nullableNumberSchema,
  examName: optionalStringSchema,
  tags: arrayOf(z.string()),
  isActive: z.boolean(),
  usageCount: z.number().int().min(0),
  createdBy: optionalStringSchema,
  reviewedBy: optionalStringSchema,
  reviewedAt: nullableStringSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreateQuestionSchema = QuestionSchema.omit({
  id: true,
  usageCount: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isActive: z.boolean().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>;
