import { z } from 'zod';
import { LIBRARY_RESOURCE_TYPES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableNumberSchema,
  arrayOf,
} from './common';

export const LibraryResourceTypeSchema = z.enum(LIBRARY_RESOURCE_TYPES);

export const LibraryResourceSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  resourceType: LibraryResourceTypeSchema,
  fileUrl: z.string().min(1),
  thumbnailUrl: optionalStringSchema,
  description: optionalStringSchema,
  subjectId: optionalStringSchema,
  topicId: optionalStringSchema,
  classId: optionalStringSchema,
  examBoard: optionalStringSchema,
  examYear: nullableNumberSchema,
  authorId: optionalStringSchema,
  downloadCount: z.number().int().min(0),
  viewCount: z.number().int().min(0),
  isFree: z.boolean(),
  fileSizeBytes: nullableNumberSchema,
  mimeType: optionalStringSchema,
  tags: arrayOf(z.string()),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreateLibraryResourceSchema = LibraryResourceSchema.omit({
  id: true,
  slug: true,
  downloadCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateLibraryResourceSchema = CreateLibraryResourceSchema.partial();

export type LibraryResource = z.infer<typeof LibraryResourceSchema>;
export type CreateLibraryResource = z.infer<typeof CreateLibraryResourceSchema>;
export type UpdateLibraryResource = z.infer<typeof UpdateLibraryResourceSchema>;
