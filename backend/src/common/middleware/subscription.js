import { validateSubscriptionAccess } from '../../subscriptions/services/subscription.service.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../errors/index.js';

const requireSubscription = (requiredPlanCode = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
      }

      const { hasAccess, subscription, message } = await validateSubscriptionAccess(req.user.id, requiredPlanCode);

      if (!hasAccess) {
        throw new AppError(message || 'Subscription required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR, {
          requiresSubscription: true,
          requiredPlan: requiredPlanCode,
          currentPlan: subscription?.plan_code || 'free',
        });
      }

      req.subscription = subscription;
      next();
    } catch (err) {
      next(err);
    }
  };
};

const requireFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
      }

      const { getActiveSubscription } = await import('../../subscriptions/services/subscription.service.js');
      const { subscriptionPlanModel } = await import('../../subscriptions/models/subscription.model.js');

      const subscription = await getActiveSubscription(req.user.id);
      if (!subscription) {
        throw new AppError('Active subscription required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR, {
          requiresSubscription: true,
          feature,
        });
      }

      const plan = await subscriptionPlanModel.findById(subscription.plan_id);
      if (!plan) {
        throw new AppError('Plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }

      const limits = plan.limits || {};
      const featureLimits = {
        aiQuestionsPerMonth: 'ai',
        examsPerMonth: 'exams',
        downloadsPerMonth: 'downloads',
        liveClassesPerMonth: 'live_classes',
        coursesPerMonth: 'courses',
      };

      const limitKey = featureLimits[feature];
      if (limitKey && limits[limitKey] !== undefined && limits[limitKey] !== -1) {
        req.featureLimit = limits[limitKey];
      }

      req.subscription = subscription;
      req.subscriptionPlan = plan;
      next();
    } catch (err) {
      next(err);
    }
  };
};

const subscriptionMiddleware = {
  requireSubscription,
  requireFeatureAccess,
};

export default subscriptionMiddleware;