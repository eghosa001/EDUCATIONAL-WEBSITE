import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, requireRole } from '../common/middleware/index.js';
import { listAuditLogs, getAuditLogsByResource, getSettings, getSetting, updateSettings } from '../administration/controllers/administration.controller.js';

export const administrationRoutes = Router();

administrationRoutes.use(authMiddleware, requireRole('super_admin', 'content_admin'));

// Audit logs
administrationRoutes.get('/audit-logs', validateRequest({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    action: Joi.string().optional(),
    resourceType: Joi.string().optional(),
  }),
}), asyncHandler(listAuditLogs));

administrationRoutes.get('/audit-logs/:resourceType/:resourceId', asyncHandler(getAuditLogsByResource));

// Settings
administrationRoutes.get('/settings', asyncHandler(getSettings));
administrationRoutes.get('/settings/:key', asyncHandler(getSetting));
administrationRoutes.patch('/settings', validateRequest({
  body: Joi.alternatives().try(
    Joi.object({
      key: Joi.string().required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object()).required(),
    }),
    Joi.object({
      updates: Joi.array().items(Joi.object({
        key: Joi.string().required(),
        value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object()).required(),
      })).required(),
    }),
  ).required(),
}), asyncHandler(updateSettings));
