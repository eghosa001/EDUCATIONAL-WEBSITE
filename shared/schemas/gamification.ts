import { z } from 'zod';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  recordSchema,
} from './common';

export const BadgeSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  iconUrl: optionalStringSchema,
  criteria: recordSchema,
  xpReward: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const AchievementSchema = z.object({
  id: idSchema,
  userId: idSchema,
  badgeId: idSchema,
  earnedAt: isoStringSchema,
  metadata: recordSchema,
});

export const StudentPointSchema = z.object({
  id: idSchema,
  userId: idSchema,
  totalPoints: z.number().int().min(0),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  level: z.number().int().min(0),
  xpToNextLevel: z.number().int().min(0),
  updatedAt: isoStringSchema,
});

export const LeaderboardEntrySchema = z.object({
  id: idSchema,
  type: z.string().min(1),
  period: z.string().min(1),
  userId: idSchema,
  userName: z.string().min(1),
  userAvatarUrl: optionalStringSchema,
  rank: z.number().int().min(0),
  points: z.number().int().min(0),
  stats: recordSchema,
  periodStart: isoStringSchema.optional(),
  periodEnd: isoStringSchema.optional(),
  createdAt: isoStringSchema,
});

export const CreateBadgeSchema = BadgeSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const UpdateBadgeSchema = CreateBadgeSchema.partial();

export type Badge = z.infer<typeof BadgeSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type StudentPoint = z.infer<typeof StudentPointSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type CreateBadge = z.infer<typeof CreateBadgeSchema>;
export type UpdateBadge = z.infer<typeof UpdateBadgeSchema>;
