import { z } from 'zod';
import { idSchema, isoStringSchema, optionalStringSchema, nullableNumberSchema } from './common';

export const EducationSystemSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  country: z.string().min(1),
  description: optionalStringSchema,
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const EducationLevelSchema = z.object({
  id: idSchema,
  educationSystemId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  orderIndex: z.number().int().min(0),
  minAge: nullableNumberSchema,
  maxAge: nullableNumberSchema,
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const ProgramSchema = z.object({
  id: idSchema,
  educationLevelId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  durationYears: nullableNumberSchema,
  orderIndex: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const ClassRoomSchema = z.object({
  id: idSchema,
  programId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  orderIndex: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const TermSchema = z.object({
  id: idSchema,
  educationSystemId: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  orderIndex: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const CreateEducationSystemSchema = EducationSystemSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const CreateEducationLevelSchema = EducationLevelSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const CreateProgramSchema = ProgramSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const CreateClassRoomSchema = ClassRoomSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const CreateTermSchema = TermSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export type EducationSystem = z.infer<typeof EducationSystemSchema>;
export type EducationLevel = z.infer<typeof EducationLevelSchema>;
export type Program = z.infer<typeof ProgramSchema>;
export type ClassRoom = z.infer<typeof ClassRoomSchema>;
export type Term = z.infer<typeof TermSchema>;
export type CreateEducationSystem = z.infer<typeof CreateEducationSystemSchema>;
export type CreateEducationLevel = z.infer<typeof CreateEducationLevelSchema>;
export type CreateProgram = z.infer<typeof CreateProgramSchema>;
export type CreateClassRoom = z.infer<typeof CreateClassRoomSchema>;
export type CreateTerm = z.infer<typeof CreateTermSchema>;
