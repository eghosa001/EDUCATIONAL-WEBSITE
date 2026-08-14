import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
  validateRequest,
} from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as paymentController from '../payments/controllers/payment.controller.js';

export const paymentRoutes = Router();

paymentRoutes.get('/gateways',
  optionalAuthMiddleware,
  paymentController.fetchPaymentGateways
);

paymentRoutes.post('/',
  authMiddleware,
  validateRequest(schemas.payment.initialize),
  paymentController.initializeNewPayment
);

paymentRoutes.post('/verify',
  authMiddleware,
  paymentController.verifyNewPayment
);

paymentRoutes.get('/:id',
  authMiddleware,
  paymentController.getPayment
);

paymentRoutes.get('/',
  authMiddleware,
  requireRole('super_admin', 'content_admin'),
  paymentController.listAllPayments
);

paymentRoutes.get('/stats',
  authMiddleware,
  paymentController.getPaymentStatsHandler
);

paymentRoutes.post('/:id/refund',
  authMiddleware,
  paymentController.refundPaymentHandler
);

paymentRoutes.post('/webhook/paystack',
  paymentController.handlePaystackWebhook
);

paymentRoutes.post('/webhook/flutterwave',
  paymentController.handleFlutterwaveWebhook
);
