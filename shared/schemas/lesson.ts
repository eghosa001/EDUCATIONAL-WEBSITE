import { z } from 'zod';
import { LESSON_CONTENT_TYPES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  arrayOf,
} from './common';

export const LessonContentTypeSchema = z.enum(LESSON_CONTENT_TYPES);

export const LessonSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  sectionId: optionalStringSchema,
  topicId: optionalStringSchema,
  subtopicId: optionalStringSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  description: optionalStringSchema,
  learningObjectives: arrayOf(z.string()),
  contentType: LessonContentTypeSchema,
  videoUrl: optionalStringSchema,
  videoDurationSeconds: nullableNumberSchema,
  videoThumbnailUrl: optionalStringSchema,
  writtenContent: optionalStringSchema,
  keyPoints: arrayOf(z.string()),
  orderIndex: z.number().int().min(0),
  isFree: z.boolean(),
  isPublished: z.boolean(),
  estimatedMinutes: z.number().int().min(0),
  viewCount: z.number().int().min(0),
  completionCount: z.number().int().min(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const LessonResourceSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  title: z.string().min(1),
  resourceType: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSizeBytes: nullableNumberSchema,
  mimeType: optionalStringSchema,
  description: optionalStringSchema,
  isDownloadable: z.boolean(),
  orderIndex: z.number().int().min(0),
  createdAt: isoStringSchema,
});

export const CreateLessonSchema = LessonSchema.omit({
  id: true,
  slug: true,
  viewCount: true,
  completionCount: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateLessonResourceSchema = LessonResourceSchema.omit({
  id: true,
  createdAt: true,
});

export const UpdateLessonSchema = CreateLessonSchema.partial();
export const UpdateLessonResourceSchema = CreateLessonResourceSchema.partial();

export type Lesson = z.infer<typeof LessonSchema>;
export type LessonResource = z.infer<typeof LessonResourceSchema>;
export type CreateLesson = z.infer<typeof CreateLessonSchema>;
export type CreateLessonResource = z.infer<typeof CreateLessonResourceSchema>;
export type UpdateLesson = z.infer<typeof UpdateLessonSchema>;
export type UpdateLessonResource = z.infer<typeof UpdateLessonResourceSchema>;
