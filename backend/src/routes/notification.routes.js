import { Router } from 'express';
import { asyncHandler } from '../common/middleware/index.js';
import * as notificationController from '../controllers/notification.controller.js';
import { authMiddleware, requireRole } from '../common/middleware/index.js';

export const notificationRoutes = Router();

// Admin-only notification routes
notificationRoutes.use('/admin', authMiddleware, requireRole('super_admin', 'content_admin'));

notificationRoutes.get('/admin/history', asyncHandler(notificationController.listAllNotifications));
notificationRoutes.get('/admin/stats', asyncHandler(notificationController.getNotificationStats));
notificationRoutes.post('/admin/broadcast', asyncHandler(notificationController.broadcastNotification));
notificationRoutes.post('/admin/broadcast/all', asyncHandler(notificationController.broadcastToAll));
notificationRoutes.post('/admin/send', asyncHandler(notificationController.sendNotification));

// User-facing notification routes
notificationRoutes.get('/', authMiddleware, asyncHandler(notificationController.getNotifications));
notificationRoutes.post('/:id/read', authMiddleware, asyncHandler(notificationController.markAsRead));
notificationRoutes.post('/read-all', authMiddleware, asyncHandler(notificationController.markAllAsRead));
notificationRoutes.get('/unread-count', authMiddleware, asyncHandler(notificationController.getUnreadCount));
