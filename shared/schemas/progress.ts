import { z } from 'zod';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  recordSchema,
} from './common';

export const LessonProgressStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const StudentCourseSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  courseId: idSchema,
  enrolledAt: isoStringSchema,
  completedAt: nullableStringSchema,
  progressPercentage: z.number().min(0).max(100),
  lastAccessedAt: nullableStringSchema,
  certificateIssuedAt: nullableStringSchema,
  certificateUrl: optionalStringSchema,
});

export const LessonProgressSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  lessonId: idSchema,
  courseId: idSchema,
  status: LessonProgressStatusSchema,
  progressPercentage: z.number().min(0).max(100),
  watchTimeSeconds: z.number().min(0),
  completedAt: nullableStringSchema,
  lastPositionSeconds: z.number().min(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const StudySessionSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  courseId: optionalStringSchema,
  lessonId: optionalStringSchema,
  startedAt: isoStringSchema,
  endedAt: nullableStringSchema,
  durationSeconds: nullableNumberSchema,
  activityType: optionalStringSchema,
  metadata: recordSchema,
});

export const CreateLessonProgressSchema = LessonProgressSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateLessonProgressSchema = CreateLessonProgressSchema.partial();

export type StudentCourse = z.infer<typeof StudentCourseSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
export type CreateLessonProgress = z.infer<typeof CreateLessonProgressSchema>;
export type UpdateLessonProgress = z.infer<typeof UpdateLessonProgressSchema>;
