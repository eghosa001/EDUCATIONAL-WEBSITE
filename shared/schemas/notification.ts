import { z } from 'zod';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  recordSchema,
} from './common';

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const NotificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);

export const NotificationSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  data: recordSchema,
  actionUrl: optionalStringSchema,
  channel: NotificationChannelSchema,
  isRead: z.boolean(),
  readAt: nullableStringSchema,
  sentAt: nullableStringSchema,
  createdAt: isoStringSchema,
});

export const NotificationPreferencesSchema = z.object({
  userId: idSchema,
  push: z.boolean(),
  email: z.boolean(),
  sms: z.boolean(),
  inApp: z.boolean(),
  whatsapp: z.boolean().optional(),
  types: z.record(z.string(), z.boolean()),
});

export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  isRead: true,
  readAt: true,
  sentAt: true,
  createdAt: true,
});

export const UpdateNotificationSchema = CreateNotificationSchema.partial();

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
