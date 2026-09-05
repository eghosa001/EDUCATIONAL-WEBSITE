import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as adminController from '../admin/controllers/admin.controller.js';

export const adminRoutes = Router();
adminRoutes.use(authMiddleware, requireRole('super_admin', 'content_admin'));

adminRoutes.get('/dashboard', asyncHandler(adminController.getDashboard));
adminRoutes.get('/audit-logs', validateRequest({ query: schemas.pagination }), asyncHandler(adminController.listAuditLogs));
adminRoutes.get('/settings', requireRole('super_admin'), asyncHandler(adminController.getSettings));
adminRoutes.patch('/settings', requireRole('super_admin'), validateRequest(Joi.object({
  updates: Joi.array().items(Joi.object({
    key: Joi.string().trim().min(1).max(100).required(),
    value: Joi.alternatives().try(Joi.string().max(5000), Joi.number(), Joi.boolean(), Joi.object()).required(),
  })).min(1).max(100).required(),
})), asyncHandler(adminController.updateSettings));
adminRoutes.get('/content/pending', asyncHandler(adminController.getPendingContent));
adminRoutes.patch('/content/:type/:id/approve', validateRequest(Joi.object({ type: Joi.string().valid('course', 'lesson').required() })), asyncHandler(adminController.approveContent));
adminRoutes.patch('/content/:type/:id/reject', validateRequest(Joi.object({ type: Joi.string().valid('course', 'lesson').required() })), asyncHandler(adminController.rejectContent));
adminRoutes.get('/moderation/posts', validateRequest({ query: schemas.pagination }), asyncHandler(adminController.listModerationPosts));
adminRoutes.patch('/moderation/posts/:postId/hide', asyncHandler(adminController.hidePost));
adminRoutes.patch('/moderation/posts/:postId/unhide', asyncHandler(adminController.unhidePost));
adminRoutes.patch('/moderation/comments/:commentId/hide', asyncHandler(adminController.hideComment));
adminRoutes.patch('/moderation/comments/:commentId/unhide', asyncHandler(adminController.unhideComment));
