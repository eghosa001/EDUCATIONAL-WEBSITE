import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as teacherController from '../teachers/controllers/teacher.controller.js';

export const teacherRoutes = Router();

const createLiveClassSchema = Joi.object({
  title: Joi.string().min(3).max(300).required(),
  courseId: Joi.string().uuid().required(),
  scheduledAt: Joi.date().iso().required(),
  durationMinutes: Joi.number().integer().min(1).max(480).default(60),
  description: Joi.string().optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  avatarUrl: Joi.string().uri().max(500).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  qualification: Joi.string().max(300).optional(),
  specialization: Joi.string().max(300).optional(),
  bio: Joi.string().optional(),
  payoutAccount: Joi.string().max(255).optional(),
});

teacherRoutes.use(authMiddleware);

teacherRoutes.get('/me', asyncHandler(teacherController.getMyProfile));
teacherRoutes.patch('/me', validateRequest(updateProfileSchema), asyncHandler(teacherController.updateMyProfile));

teacherRoutes.get('/courses', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listMyCourses));
teacherRoutes.get('/courses/:courseId/stats', asyncHandler(teacherController.getCourseStats));

teacherRoutes.get('/students', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listMyStudents));
teacherRoutes.get('/students/:studentUserId/progress', asyncHandler(teacherController.getStudentProgress));

teacherRoutes.get('/exams', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listMyExams));
teacherRoutes.get('/exams/:examId/stats', asyncHandler(teacherController.getExamStats));

teacherRoutes.get('/assignments', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listMyAssignments));
teacherRoutes.get('/assignments/:assignmentId/submissions', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listAssignmentSubmissions));

teacherRoutes.get('/live-classes', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listLiveClasses));
teacherRoutes.post('/live-classes', validateRequest(createLiveClassSchema), asyncHandler(teacherController.createLiveClass));
teacherRoutes.post('/live-classes/:liveClassId/start', asyncHandler(teacherController.startLiveClass));
teacherRoutes.post('/live-classes/:liveClassId/end', asyncHandler(teacherController.endLiveClass));

teacherRoutes.get('/earnings', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listEarnings));
teacherRoutes.get('/earnings/summary', asyncHandler(teacherController.getEarningsSummary));

teacherRoutes.get('/analytics', asyncHandler(teacherController.getAnalytics));

teacherRoutes.get('/notifications', validateRequest({ query: schemas.pagination }), asyncHandler(teacherController.listNotifications));
teacherRoutes.post('/notifications/:notificationId/read', asyncHandler(teacherController.markNotificationRead));