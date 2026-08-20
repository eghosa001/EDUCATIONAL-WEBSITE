import { Router } from 'express';
import { asyncHandler, authMiddleware, requireRole } from '../common/middleware/index.js';
import * as analyticsController from '../analytics/controllers/analytics.controller.js';

export const analyticsRoutes = Router();

// Public admin routes (require auth + role)
analyticsRoutes.get('/metrics',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  asyncHandler(analyticsController.getPlatformMetrics)
);

analyticsRoutes.get('/revenue',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  asyncHandler(analyticsController.getRevenueBreakdown)
);

analyticsRoutes.get('/courses',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  asyncHandler(analyticsController.getCoursesPerformance)
);

analyticsRoutes.get('/engagement',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  asyncHandler(analyticsController.getUserEngagement)
);

analyticsRoutes.get('/dashboard',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  asyncHandler(analyticsController.getAdminDashboard)
);

// Client-side event tracking (any authenticated user)
analyticsRoutes.post('/events',
  authMiddleware,
  asyncHandler(analyticsController.trackEventController)
);

analyticsRoutes.patch('/user-properties',
  authMiddleware,
  asyncHandler(analyticsController.updateUserPropertiesController)
);
