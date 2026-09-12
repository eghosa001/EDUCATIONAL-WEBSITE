import { Router } from 'express';
import { authMiddleware, requireRole, optionalAuthMiddleware, validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as paymentController from '../payments/controllers/payment.controller.js';

export const paymentRoutes = Router();

paymentRoutes.get('/gateways', optionalAuthMiddleware, paymentController.fetchPaymentGateways);
paymentRoutes.post('/', authMiddleware, validateRequest(schemas.payment.initialize), paymentController.initializeNewPayment);
paymentRoutes.post('/verify', authMiddleware, paymentController.verifyNewPayment);

// Global financial data is restricted to administrators; content administration
// does not imply access to users' payment history.
paymentRoutes.get('/stats', authMiddleware, requireRole('admin', 'super_admin'), paymentController.getPaymentStatsHandler);
paymentRoutes.get('/', authMiddleware, requireRole('admin', 'super_admin'), paymentController.listAllPayments);
paymentRoutes.get('/:id', authMiddleware, paymentController.getPayment);

// Refunds move money and therefore cannot be initiated by ordinary administrators.
paymentRoutes.post('/:id/refund', authMiddleware, requireRole('super_admin'), paymentController.refundPaymentHandler);

// Gateway webhooks authenticate themselves using their provider signatures.
paymentRoutes.post('/webhook/paystack', paymentController.handlePaystackWebhook);
paymentRoutes.post('/webhook/flutterwave', paymentController.handleFlutterwaveWebhook);
