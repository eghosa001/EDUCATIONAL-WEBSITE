import { z } from 'zod';
import {
  SCHOOL_STATUSES,
  SCHOOL_SUBSCRIPTION_STATUSES,
  SCHOOL_TYPES,
} from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableNumberSchema,
  nullableStringSchema,
} from './common';

export const SchoolTypeSchema = z.enum(SCHOOL_TYPES);
export const SchoolStatusSchema = z.enum(SCHOOL_STATUSES);
export const SchoolSubscriptionStatusSchema = z.enum(SCHOOL_SUBSCRIPTION_STATUSES);

export const SchoolSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  email: optionalStringSchema,
  phone: optionalStringSchema,
  address: optionalStringSchema,
  state: optionalStringSchema,
  lga: optionalStringSchema,
  type: SchoolTypeSchema.optional(),
  logoUrl: optionalStringSchema,
  establishedYear: nullableNumberSchema,
  maxStudents: nullableNumberSchema,
  status: SchoolStatusSchema,
  adminId: optionalStringSchema,
  subscriptionId: optionalStringSchema,
  subscriptionStatus: SchoolSubscriptionStatusSchema,
  features: z.record(z.string(), z.boolean()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const SchoolStudentSchema = z.object({
  id: idSchema,
  schoolId: idSchema,
  studentId: idSchema,
  classId: optionalStringSchema,
  enrollmentYear: nullableNumberSchema,
  admissionNumber: optionalStringSchema,
  status: z.enum(['active', 'graduated', 'transferred', 'expelled']),
  createdAt: isoStringSchema,
});

export const SchoolTeacherSchema = z.object({
  id: idSchema,
  schoolId: idSchema,
  teacherId: idSchema,
  employeeId: optionalStringSchema,
  department: optionalStringSchema,
  employmentDate: nullableStringSchema,
  status: z.enum(['active', 'inactive', 'on_leave']),
  createdAt: isoStringSchema,
});

export const SchoolClassSchema = z.object({
  id: idSchema,
  schoolId: idSchema,
  classId: optionalStringSchema,
  teacherId: optionalStringSchema,
  capacity: nullableNumberSchema,
  termId: optionalStringSchema,
  academicYear: nullableNumberSchema,
  status: z.enum(['active', 'inactive']),
  createdAt: isoStringSchema,
});

export const CreateSchoolSchema = SchoolSchema.omit({
  id: true,
  status: true,
  subscriptionStatus: true,
  features: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSchoolSchema = CreateSchoolSchema.partial();

export type School = z.infer<typeof SchoolSchema>;
export type SchoolStudent = z.infer<typeof SchoolStudentSchema>;
export type SchoolTeacher = z.infer<typeof SchoolTeacherSchema>;
export type SchoolClass = z.infer<typeof SchoolClassSchema>;
export type CreateSchool = z.infer<typeof CreateSchoolSchema>;
export type UpdateSchool = z.infer<typeof UpdateSchoolSchema>;
