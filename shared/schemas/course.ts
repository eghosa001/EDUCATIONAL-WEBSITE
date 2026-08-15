import { z } from 'zod';
import { COURSE_STATUSES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  nonNegativeNumberSchema,
} from './common';

export const CourseStatusSchema = z.enum(COURSE_STATUSES);

export const CourseSchema = z.object({
  id: idSchema,
  subjectId: optionalStringSchema,
  classId: optionalStringSchema,
  termId: optionalStringSchema,
  teacherId: optionalStringSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: optionalStringSchema,
  fullDescription: optionalStringSchema,
  thumbnailUrl: optionalStringSchema,
  previewVideoUrl: optionalStringSchema,
  difficulty: z.string(),
  status: CourseStatusSchema,
  price: nonNegativeNumberSchema,
  currency: z.string().default('NGN'),
  isFree: z.boolean(),
  isFeatured: z.boolean(),
  enrollmentCount: z.number().int().min(0),
  rating: nonNegativeNumberSchema,
  reviewCount: z.number().int().min(0),
  totalDurationHours: nonNegativeNumberSchema,
  lessonCount: z.number().int().min(0),
  publishedAt: nullableStringSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CourseSectionSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  title: z.string().min(1),
  description: optionalStringSchema,
  orderIndex: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  slug: true,
  status: true,
  enrollmentCount: true,
  rating: true,
  reviewCount: true,
  totalDurationHours: true,
  lessonCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: CourseStatusSchema.optional(),
});

export const CreateCourseSectionSchema = CourseSectionSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCourseSchema = CreateCourseSchema.partial();
export const UpdateCourseSectionSchema = CreateCourseSectionSchema.partial();

export type Course = z.infer<typeof CourseSchema>;
export type CourseSection = z.infer<typeof CourseSectionSchema>;
export type CreateCourse = z.infer<typeof CreateCourseSchema>;
export type CreateCourseSection = z.infer<typeof CreateCourseSectionSchema>;
export type UpdateCourse = z.infer<typeof UpdateCourseSchema>;
export type UpdateCourseSection = z.infer<typeof UpdateCourseSectionSchema>;
