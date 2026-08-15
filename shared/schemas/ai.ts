import { z } from 'zod';
import { AI_MESSAGE_ROLES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  recordSchema,
} from './common';

export const AiMessageRoleSchema = z.enum(AI_MESSAGE_ROLES);

export const AiConversationSchema = z.object({
  id: idSchema,
  userId: idSchema,
  subjectId: optionalStringSchema,
  topicId: optionalStringSchema,
  title: optionalStringSchema,
  metadata: recordSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const AiMessageSchema = z.object({
  id: idSchema,
  conversationId: idSchema,
  role: AiMessageRoleSchema,
  content: z.string().min(1),
  metadata: recordSchema,
  createdAt: isoStringSchema,
});

export const AiUsageSchema = z.object({
  id: idSchema,
  userId: idSchema,
  model: z.string().min(1),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  cost: z.number().min(0),
  createdAt: isoStringSchema,
});

export const CreateAiConversationSchema = AiConversationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateAiMessageSchema = AiMessageSchema.omit({
  id: true,
  createdAt: true,
});

export type AiConversation = z.infer<typeof AiConversationSchema>;
export type AiMessage = z.infer<typeof AiMessageSchema>;
export type AiUsage = z.infer<typeof AiUsageSchema>;
export type CreateAiConversation = z.infer<typeof CreateAiConversationSchema>;
export type CreateAiMessage = z.infer<typeof CreateAiMessageSchema>;
