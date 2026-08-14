import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as reportController from '../reports/controllers/report.controller.js';

export const reportRoutes = Router();

reportRoutes.use(authMiddleware);

reportRoutes.get('/', validateRequest({ query: schemas.pagination }), asyncHandler(reportController.listReports));
reportRoutes.post('/', validateRequest(Joi.object({
  type: Joi.string().valid('user_summary', 'revenue_summary', 'content_summary', 'exam_performance', 'subscriptions_summary', 'teacher_earnings').required(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  filters: Joi.object().optional(),
})), asyncHandler(reportController.generateReport));
reportRoutes.get('/:reportId', asyncHandler(reportController.getReport));
reportRoutes.delete('/:reportId', asyncHandler(reportController.deleteReport));