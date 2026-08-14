import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as gamificationController from '../gamification/controllers/gamification.controller.js';

export const gamificationRoutes = Router();

gamificationRoutes.use(authMiddleware);

gamificationRoutes.get('/points/me', asyncHandler(gamificationController.getMyPoints));
gamificationRoutes.post('/points/award', validateRequest(Joi.object({
  action: Joi.string().required(),
  points: Joi.number().integer().min(1).optional(),
  description: Joi.string().optional(),
})), asyncHandler(gamificationController.awardPoints));

gamificationRoutes.get('/leaderboard', validateRequest({ query: schemas.pagination }), asyncHandler(gamificationController.getLeaderboard));

gamificationRoutes.get('/badges', asyncHandler(gamificationController.getBadges));
gamificationRoutes.get('/badges/me', validateRequest({ query: schemas.pagination }), asyncHandler(gamificationController.getMyBadges));

gamificationRoutes.get('/achievements', asyncHandler(gamificationController.getAchievements));
gamificationRoutes.get('/achievements/me', validateRequest({ query: schemas.pagination }), asyncHandler(gamificationController.getMyAchievements));

gamificationRoutes.get('/streaks/me', asyncHandler(gamificationController.getMyStreak));

gamificationRoutes.get('/rewards', asyncHandler(gamificationController.getRewards));
gamificationRoutes.get('/rewards/me', validateRequest({ query: schemas.pagination }), asyncHandler(gamificationController.getMyRewards));
gamificationRoutes.post('/rewards/:rewardId/redeem', asyncHandler(gamificationController.redeemReward));

gamificationRoutes.get('/points/history', validateRequest({ query: schemas.pagination }), asyncHandler(gamificationController.getPointsHistory));