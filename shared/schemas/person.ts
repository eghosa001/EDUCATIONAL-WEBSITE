import { z } from 'zod';
import { UserSchema } from './user';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableNumberSchema,
  arrayOf,
  nonNegativeNumberSchema,
} from './common';

export const TeacherSchema = UserSchema.extend({
  schoolId: optionalStringSchema,
  subjectIds: arrayOf(z.string()),
  verified: z.boolean(),
  bio: optionalStringSchema,
  yearsOfExperience: nullableNumberSchema,
  qualifications: arrayOf(z.string()).optional(),
  earnings: nonNegativeNumberSchema,
});

export const TeacherEarningSchema = z.object({
  id: idSchema,
  teacherId: idSchema,
  amount: nonNegativeNumberSchema,
  currency: z.string().min(1),
  source: z.string().min(1),
  createdAt: isoStringSchema,
});

export const ParentSchema = UserSchema.extend({
  studentIds: arrayOf(z.string()),
  occupation: optionalStringSchema,
});

export const ParentChildSchema = z.object({
  id: idSchema,
  parentId: idSchema,
  studentId: idSchema,
  relationship: z.string().min(1),
  addedAt: isoStringSchema,
});

export type Teacher = z.infer<typeof TeacherSchema>;
export type TeacherEarning = z.infer<typeof TeacherEarningSchema>;
export type Parent = z.infer<typeof ParentSchema>;
export type ParentChild = z.infer<typeof ParentChildSchema>;
