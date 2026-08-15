import { z } from 'zod';
import { idSchema, isoStringSchema, optionalStringSchema, nullableNumberSchema, arrayOf } from './common';

export const SubjectSchema = z.object({
  id: idSchema,
  educationSystemId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  icon: optionalStringSchema,
  color: optionalStringSchema,
  orderIndex: z.number().int().min(0),
  isCore: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const TopicSchema = z.object({
  id: idSchema,
  subjectId: idSchema,
  classId: idSchema,
  termId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  learningObjectives: arrayOf(z.string()),
  orderIndex: z.number().int().min(0),
  estimatedHours: nullableNumberSchema,
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const SubtopicSchema = z.object({
  id: idSchema,
  topicId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  learningObjectives: arrayOf(z.string()),
  orderIndex: z.number().int().min(0),
  estimatedHours: nullableNumberSchema,
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreateSubjectSchema = SubjectSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const CreateTopicSchema = TopicSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateSubtopicSchema = SubtopicSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();
export const UpdateTopicSchema = CreateTopicSchema.partial();
export const UpdateSubtopicSchema = CreateSubtopicSchema.partial();

export type Subject = z.infer<typeof SubjectSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Subtopic = z.infer<typeof SubtopicSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type CreateTopic = z.infer<typeof CreateTopicSchema>;
export type CreateSubtopic = z.infer<typeof CreateSubtopicSchema>;
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>;
export type UpdateTopic = z.infer<typeof UpdateTopicSchema>;
export type UpdateSubtopic = z.infer<typeof UpdateSubtopicSchema>;
