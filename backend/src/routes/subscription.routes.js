import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
  validateRequest,
} from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as subscriptionController from '../subscriptions/controllers/subscription.controller.js';

export const subscriptionRoutes = Router();

subscriptionRoutes.get('/plans',
  optionalAuthMiddleware,
  subscriptionController.getAllActivePlans
);

subscriptionRoutes.get('/plans/:id',
  optionalAuthMiddleware,
  subscriptionController.getPlanById
);

subscriptionRoutes.post('/plans',
  authMiddleware,
  requireRole('super_admin', 'content_admin'),
  validateRequest(schemas.subscription.createPlan),
  subscriptionController.createPlan
);

subscriptionRoutes.patch('/plans/:id',
  authMiddleware,
  requireRole('super_admin', 'content_admin'),
  subscriptionController.updatePlan
);

subscriptionRoutes.delete('/plans/:id',
  authMiddleware,
  requireRole('super_admin', 'content_admin'),
  subscriptionController.deletePlan
);

// Declare all named routes before /:id so Express cannot treat names such as
// "access" or "invoices" as subscription IDs.
subscriptionRoutes.get('/my',
  authMiddleware,
  subscriptionController.getMySubscription
);

subscriptionRoutes.get('/access',
  authMiddleware,
  subscriptionController.validateAccess
);

subscriptionRoutes.post('/coupon/validate',
  authMiddleware,
  subscriptionController.applyCouponHandler
);

subscriptionRoutes.get('/invoices',
  authMiddleware,
  subscriptionController.getInvoices
);

subscriptionRoutes.get('/invoices/:id',
  authMiddleware,
  subscriptionController.getInvoiceById
);

subscriptionRoutes.get('/wallet',
  authMiddleware,
  subscriptionController.getWallet
);

subscriptionRoutes.get('/wallet/transactions',
  authMiddleware,
  subscriptionController.listWalletTransactions
);

subscriptionRoutes.post('/',
  authMiddleware,
  subscriptionController.createNewSubscription
);

subscriptionRoutes.post('/:subscriptionId/cancel',
  authMiddleware,
  subscriptionController.cancelMySubscription
);

subscriptionRoutes.post('/:subscriptionId/resume',
  authMiddleware,
  subscriptionController.resumeMySubscription
);

subscriptionRoutes.post('/:subscriptionId/renew',
  authMiddleware,
  subscriptionController.renewSubscriptionHandler
);

subscriptionRoutes.get('/:id',
  authMiddleware,
  subscriptionController.getSubscriptionHandler
);

// Gateway callbacks are intentionally handled only by payment.routes.js, where
// Paystack/Flutterwave signatures and payment amount/currency are verified.
