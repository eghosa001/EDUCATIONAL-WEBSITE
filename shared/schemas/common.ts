import { z } from 'zod';

export const idSchema = z.string().min(1);
export const uuidSchema = z.string().uuid();
export const slugSchema = z.string().min(1);
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const isoStringSchema = z.string();
export const optionalStringSchema = z.string().optional();
export const nullableStringSchema = z.string().nullable().optional();
export const recordSchema = z.record(z.string(), z.unknown());
export const tagsSchema = z.array(z.string()).default([]);
export const booleanSchema = z.boolean();
export const nonNegativeNumberSchema = z.number().min(0);
export const positiveNumberSchema = z.number().positive();

export const timestampsSchema = z.object({
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema.optional(),
});

export const softDeleteSchema = z.object({
  isActive: booleanSchema,
});

export const arrayOf = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).default([]);

export const nullableNumberSchema = z.number().nullable().optional();
export const nullableBooleanSchema = z.boolean().nullable().optional();
export const nullableDateSchema = z.string().nullable().optional();
