import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
} from '../common/middleware/index.js';
import * as advertisingController from '../advertising/controllers/advertising.controller.js';

export const advertisingRoutes = Router();

// Campaigns
advertisingRoutes.get('/campaigns', authMiddleware, requireRole('super_admin', 'content_admin'), advertisingController.listCampaigns);
advertisingRoutes.get('/campaigns/:id', optionalAuthMiddleware, advertisingController.getCampaign);
advertisingRoutes.post('/campaigns', authMiddleware, requireRole('super_admin', 'content_admin'), advertisingController.createCampaign);
advertisingRoutes.patch('/campaigns/:id', authMiddleware, requireRole('super_admin', 'content_admin'), advertisingController.updateCampaign);
advertisingRoutes.delete('/campaigns/:id', authMiddleware, requireRole('super_admin'), advertisingController.deleteCampaign);
advertisingRoutes.get('/campaigns/:id/stats', authMiddleware, advertisingController.getCampaignStats);

// Placements
advertisingRoutes.get('/placements', optionalAuthMiddleware, advertisingController.listPlacements);
advertisingRoutes.post('/placements', authMiddleware, requireRole('super_admin'), advertisingController.createPlacement);
advertisingRoutes.patch('/placements/:id', authMiddleware, requireRole('super_admin'), advertisingController.updatePlacement);
advertisingRoutes.delete('/placements/:id', authMiddleware, requireRole('super_admin'), advertisingController.deletePlacement);

// Public ad serving
advertisingRoutes.get('/ads/:placementId', optionalAuthMiddleware, advertisingController.getActiveAdForPlacement);
advertisingRoutes.post('/track/impression', authMiddleware, advertisingController.recordImpression);
advertisingRoutes.post('/track/click', authMiddleware, advertisingController.recordClick);
