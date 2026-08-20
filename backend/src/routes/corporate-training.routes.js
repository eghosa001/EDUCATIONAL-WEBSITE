import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
} from '../common/middleware/index.js';
import * as corporateTrainingController from '../corporate-training/controllers/corporateTraining.controller.js';

export const corporateTrainingRoutes = Router();

// Organizations
corporateTrainingRoutes.get('/organizations', authMiddleware, requireRole('super_admin', 'content_admin'), corporateTrainingController.listOrganizations);
corporateTrainingRoutes.get('/organizations/:id', optionalAuthMiddleware, corporateTrainingController.getOrganization);
corporateTrainingRoutes.post('/organizations', authMiddleware, requireRole('super_admin'), corporateTrainingController.createOrganization);
corporateTrainingRoutes.patch('/organizations/:id', authMiddleware, requireRole('super_admin'), corporateTrainingController.updateOrganization);
corporateTrainingRoutes.delete('/organizations/:id', authMiddleware, requireRole('super_admin'), corporateTrainingController.deleteOrganization);
corporateTrainingRoutes.get('/organizations/:id/stats', authMiddleware, requireRole('super_admin', 'content_admin'), corporateTrainingController.getOrganizationStats);

// Trainings
corporateTrainingRoutes.get('/trainings', optionalAuthMiddleware, corporateTrainingController.listTrainings);
corporateTrainingRoutes.get('/trainings/:id', optionalAuthMiddleware, corporateTrainingController.getTraining);
corporateTrainingRoutes.post('/trainings', authMiddleware, requireRole('super_admin', 'content_admin'), corporateTrainingController.createTraining);
corporateTrainingRoutes.patch('/trainings/:id', authMiddleware, requireRole('super_admin', 'content_admin'), corporateTrainingController.updateTraining);
corporateTrainingRoutes.delete('/trainings/:id', authMiddleware, requireRole('super_admin'), corporateTrainingController.deleteTraining);
corporateTrainingRoutes.get('/trainings/:id/stats', optionalAuthMiddleware, corporateTrainingController.getTrainingStats);

// Enrollments
corporateTrainingRoutes.post('/trainings/:id/enroll', authMiddleware, corporateTrainingController.enrollUser);
corporateTrainingRoutes.post('/trainings/:id/bulk-enroll', authMiddleware, requireRole('super_admin', 'content_admin'), corporateTrainingController.bulkEnrollUsers);
corporateTrainingRoutes.get('/trainings/:id/enrollments', authMiddleware, corporateTrainingController.listEnrollments);
corporateTrainingRoutes.delete('/enrollments/:id/withdraw', authMiddleware, corporateTrainingController.withdrawEnrollment);
