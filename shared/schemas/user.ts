import { z } from 'zod';
import { GENDERS, USER_ROLES, USER_STATUSES } from '../constants/enums';
import { idSchema, emailSchema, isoStringSchema, optionalStringSchema, recordSchema } from './common';

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const genderSchema = z.enum(GENDERS);

export const UserSchema = z.object({
  id: idSchema,
  email: emailSchema,
  phone: optionalStringSchema,
  passwordHash: optionalStringSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: optionalStringSchema,
  dateOfBirth: optionalStringSchema,
  gender: genderSchema.optional(),
  avatarUrl: optionalStringSchema,
  isVerified: z.boolean(),
  isActive: z.boolean(),
  lastLoginAt: isoStringSchema.optional(),
  emailVerifiedAt: isoStringSchema.optional(),
  phoneVerifiedAt: isoStringSchema.optional(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const RoleSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: optionalStringSchema,
  permissions: recordSchema,
  createdAt: isoStringSchema,
});

export const UserRoleAssignmentSchema = z.object({
  userId: idSchema,
  roleId: idSchema,
  assignedAt: isoStringSchema,
  assignedBy: optionalStringSchema,
});

export const SessionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  tokenHash: z.string().min(1),
  refreshTokenHash: optionalStringSchema,
  deviceInfo: recordSchema.optional(),
  ipAddress: optionalStringSchema,
  userAgent: optionalStringSchema,
  expiresAt: isoStringSchema,
  createdAt: isoStringSchema,
});

export const PasswordResetSchema = z.object({
  id: idSchema,
  userId: idSchema,
  tokenHash: z.string().min(1),
  expiresAt: isoStringSchema,
  usedAt: isoStringSchema.optional(),
  createdAt: isoStringSchema,
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  passwordHash: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type User = z.infer<typeof UserSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type PasswordReset = z.infer<typeof PasswordResetSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
