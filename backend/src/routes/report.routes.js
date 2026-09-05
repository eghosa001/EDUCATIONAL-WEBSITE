import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as reportController from '../reports/controllers/report.controller.js';

export const reportRoutes = Router();
reportRoutes.use(authMiddleware);

// Reports currently query platform-wide data, including financial and teacher
// earnings information. Keep the entire report API restricted to platform admins.
reportRoutes.use(requireRole('super_admin', 'content_admin'));

reportRoutes.get('/', validateRequest({ query: schemas.pagination }), asyncHandler(reportController.listReports));
reportRoutes.post('/', validateRequest(Joi.object({
  type: Joi.string().valid('user_summary', 'revenue_summary', 'content_summary', 'exam_performance', 'subscriptions_summary', 'teacher_earnings').required(),
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  filters: Joi.object().max(20).optional(),
})), asyncHandler(reportController.createReport));
reportRoutes.get('/:reportId', validateRequest({ params: Joi.object({ reportId: Joi.string().uuid().required() }) }), asyncHandler(reportController.getReport));
reportRoutes.delete('/:reportId', validateRequest({ params: Joi.object({ reportId: Joi.string().uuid().required() }) }), asyncHandler(reportController.deleteReport));
