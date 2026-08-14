import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as parentController from '../parents/controllers/parent.controller.js';

export const parentRoutes = Router();

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  avatarUrl: Joi.string().uri().max(500).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  occupation: Joi.string().max(200).optional(),
  address: Joi.string().optional(),
});

const addChildSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const reportSchema = Joi.object({
  childId: Joi.string().uuid().required(),
  reportType: Joi.string().valid('weekly', 'monthly', 'exam', 'progress').required(),
});

const studyTimeQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
});

parentRoutes.use(authMiddleware);

parentRoutes.get('/me', asyncHandler(parentController.getMyProfile));
parentRoutes.patch('/me', validateRequest(updateProfileSchema), asyncHandler(parentController.updateMyProfile));

parentRoutes.get('/children', asyncHandler(parentController.listMyChildren));
parentRoutes.post('/children', validateRequest(addChildSchema), asyncHandler(parentController.addChild));
parentRoutes.delete('/children/:childUserId', asyncHandler(parentController.removeChild));

parentRoutes.get('/children/:childUserId/performance', asyncHandler(parentController.getChildPerformance));
parentRoutes.get('/children/:childUserId/courses', validateRequest({ query: schemas.pagination }), asyncHandler(parentController.getChildCourses));
parentRoutes.get('/children/:childUserId/exams', validateRequest({ query: schemas.pagination }), asyncHandler(parentController.getChildExams));
parentRoutes.get('/children/:childUserId/progress', asyncHandler(parentController.getChildProgress));
parentRoutes.get('/children/:childUserId/study-time', validateRequest({ query: studyTimeQuerySchema }), asyncHandler(parentController.getChildStudyTime));

parentRoutes.get('/notifications', validateRequest({ query: schemas.pagination }), asyncHandler(parentController.listNotifications));
parentRoutes.post('/notifications/:notificationId/read', asyncHandler(parentController.markNotificationRead));

parentRoutes.get('/reports', validateRequest({ query: schemas.pagination }), asyncHandler(parentController.listReports));
parentRoutes.post('/reports', validateRequest(reportSchema), asyncHandler(parentController.generateReport));
parentRoutes.get('/reports/:reportId/download', asyncHandler(parentController.downloadReport));