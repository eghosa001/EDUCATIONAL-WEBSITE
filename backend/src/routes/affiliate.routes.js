import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
} from '../common/middleware/index.js';
import * as affiliateController from '../affiliate/controllers/affiliate.controller.js';

export const affiliateRoutes = Router();

// Affiliate management
affiliateRoutes.get('/', authMiddleware, requireRole('super_admin', 'content_admin'), affiliateController.listAffiliates);
affiliateRoutes.get('/stats', authMiddleware, affiliateController.getMyAffiliateStats);
affiliateRoutes.get('/referral-link', authMiddleware, affiliateController.getReferralLink);
affiliateRoutes.post('/click', optionalAuthMiddleware, affiliateController.recordClick);

// Conversions (internal use)
affiliateRoutes.post('/conversion', authMiddleware, requireRole('super_admin'), affiliateController.recordConversion);
affiliateRoutes.get('/payouts/pending', authMiddleware, affiliateController.getPendingPayouts);
affiliateRoutes.post('/payouts/process', authMiddleware, requireRole('super_admin'), affiliateController.processPayout);
