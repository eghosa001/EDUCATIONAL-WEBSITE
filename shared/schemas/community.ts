import { z } from 'zod';
import {
  COMMENT_STATUSES,
  COMMUNITY_POST_STATUSES,
  COMMUNITY_POST_TYPES,
} from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  arrayOf,
} from './common';

export const CommunityPostTypeSchema = z.enum(COMMUNITY_POST_TYPES);
export const CommunityPostStatusSchema = z.enum(COMMUNITY_POST_STATUSES);
export const CommentStatusSchema = z.enum(COMMENT_STATUSES);

export const CommunityPostSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: CommunityPostTypeSchema,
  title: z.string().min(1),
  content: z.string().min(1),
  subjectId: optionalStringSchema,
  topicId: optionalStringSchema,
  courseId: optionalStringSchema,
  tags: arrayOf(z.string()),
  isPinned: z.boolean(),
  isLocked: z.boolean(),
  views: z.number().int().min(0),
  likesCount: z.number().int().min(0),
  repliesCount: z.number().int().min(0),
  lastReplyAt: nullableStringSchema,
  status: CommunityPostStatusSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CommentSchema = z.object({
  id: idSchema,
  postId: optionalStringSchema,
  parentId: optionalStringSchema,
  userId: idSchema,
  content: z.string().min(1),
  likesCount: z.number().int().min(0),
  status: CommentStatusSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CommentThreadSchema: z.ZodType<z.infer<typeof CommentSchema> & { replies: z.infer<typeof CommentSchema>[] }> =
  CommentSchema.extend({
    replies: z.array(z.lazy(() => CommentSchema)),
  });

export const CreateCommunityPostSchema = CommunityPostSchema.omit({
  id: true,
  isPinned: true,
  isLocked: true,
  views: true,
  likesCount: true,
  repliesCount: true,
  lastReplyAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateCommentSchema = CommentSchema.omit({
  id: true,
  likesCount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCommunityPostSchema = CreateCommunityPostSchema.partial();
export const UpdateCommentSchema = CreateCommentSchema.partial();

export type CommunityPost = z.infer<typeof CommunityPostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CommentThread = z.infer<typeof CommentThreadSchema>;
export type CreateCommunityPost = z.infer<typeof CreateCommunityPostSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type UpdateCommunityPost = z.infer<typeof UpdateCommunityPostSchema>;
export type UpdateComment = z.infer<typeof UpdateCommentSchema>;
