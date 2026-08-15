import { z } from 'zod';
import { EXAM_ATTEMPT_STATUSES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  nullableBooleanSchema,
  recordSchema,
} from './common';

export const ExamAttemptStatusSchema = z.enum(EXAM_ATTEMPT_STATUSES);

export const ExamAttemptSchema = z.object({
  id: idSchema,
  examId: idSchema,
  studentId: idSchema,
  attemptNumber: z.number().int().min(1),
  status: ExamAttemptStatusSchema,
  startedAt: isoStringSchema,
  submittedAt: nullableStringSchema,
  timeSpentSeconds: nullableNumberSchema,
  score: nullableNumberSchema,
  percentage: nullableNumberSchema,
  isPassed: nullableBooleanSchema,
  rank: nullableNumberSchema,
  totalStudents: nullableNumberSchema,
  metadata: recordSchema,
});

export const ExamAnswerSchema = z.object({
  id: idSchema,
  attemptId: idSchema,
  questionId: idSchema,
  studentAnswer: z.unknown().optional(),
  isCorrect: nullableBooleanSchema,
  marksObtained: z.number().min(0),
  timeSpentSeconds: nullableNumberSchema,
  answeredAt: isoStringSchema,
});

export const CreateExamAttemptSchema = ExamAttemptSchema.omit({
  id: true,
  status: true,
  submittedAt: true,
  timeSpentSeconds: true,
  score: true,
  percentage: true,
  isPassed: true,
  rank: true,
  totalStudents: true,
  metadata: true,
});

export const UpdateExamAttemptSchema = CreateExamAttemptSchema.partial();

export type ExamAttempt = z.infer<typeof ExamAttemptSchema>;
export type ExamAnswer = z.infer<typeof ExamAnswerSchema>;
export type CreateExamAttempt = z.infer<typeof CreateExamAttemptSchema>;
export type UpdateExamAttempt = z.infer<typeof UpdateExamAttemptSchema>;
