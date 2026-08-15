import { z } from 'zod';
import { EXAM_TYPES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  nonNegativeNumberSchema,
} from './common';

export const ExamTypeSchema = z.enum(EXAM_TYPES);

export const QuizSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  lessonId: optionalStringSchema,
  title: z.string().min(1),
  description: optionalStringSchema,
  instructions: optionalStringSchema,
  timeLimitMinutes: nullableNumberSchema,
  passingScore: nonNegativeNumberSchema,
  maxAttempts: z.number().int().min(0),
  shuffleQuestions: z.boolean(),
  showExplanation: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const QuizQuestionSchema = z.object({
  id: idSchema,
  quizId: idSchema,
  questionId: idSchema,
  orderIndex: z.number().int().min(0),
  marks: nonNegativeNumberSchema,
});

export const ExamSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  description: optionalStringSchema,
  examType: ExamTypeSchema,
  subjectId: optionalStringSchema,
  classId: optionalStringSchema,
  durationMinutes: z.number().int().min(0),
  totalMarks: nonNegativeNumberSchema,
  passingMarks: nonNegativeNumberSchema,
  instructions: optionalStringSchema,
  startTime: nullableStringSchema,
  endTime: nullableStringSchema,
  isTimed: z.boolean(),
  shuffleQuestions: z.boolean(),
  showResultsImmediately: z.boolean(),
  allowReview: z.boolean(),
  maxAttempts: z.number().int().min(0),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  createdBy: optionalStringSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const ExamQuestionSchema = z.object({
  id: idSchema,
  examId: idSchema,
  questionId: idSchema,
  orderIndex: z.number().int().min(0),
  marks: nonNegativeNumberSchema,
  sectionName: optionalStringSchema,
});

export const CreateQuizSchema = QuizSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateExamSchema = ExamSchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateQuizSchema = CreateQuizSchema.partial();
export const UpdateExamSchema = CreateExamSchema.partial();

export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type CreateQuiz = z.infer<typeof CreateQuizSchema>;
export type CreateExam = z.infer<typeof CreateExamSchema>;
export type UpdateQuiz = z.infer<typeof UpdateQuizSchema>;
export type UpdateExam = z.infer<typeof UpdateExamSchema>;
