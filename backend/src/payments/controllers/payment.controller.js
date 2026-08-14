import {
  initializePayment,
  verifyPayment,
  refundPayment,
  getPaymentById,
  listPayments,
  getPaymentStats,
} from '../services/payment.service.js';
import { paymentModel } from '../models/payment.model.js';
import { subscriptionModel, subscriptionPlanModel } from '../../subscriptions/models/subscription.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { schemas } from '../../common/validators/joi.js';
import { validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../../common/middleware/index.js';
import { paystackService } from '../services/paystack.service.js';
import { flutterwaveService } from '../services/flutterwave.service.js';
import { NOTIFICATION_TYPES } from '../../common/constants/index.js';
import { notificationService } from '../../notifications/services/notification.service.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const initializeNewPayment = async (req, res) => {
  const result = await initializePayment(req.user.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Payment initialized',
    data: result.data,
  });
};

export const verifyNewPayment = async (req, res) => {
  const { reference } = req.body;
  const result = await verifyPayment(reference);
  res.json(result);
};

export const getPayment = async (req, res) => {
  const payment = await getPaymentById(req.params.id, req.user.id);
  res.json({ success: true, data: { payment } });
};

export const listAllPayments = async (req, res) => {
  const { page, limit, status, startDate, endDate } = req.query;
  const result = await listPayments({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    startDate,
    endDate,
  });
  res.json({ success: true, data: result });
};

export const getPaymentStatsHandler = async (req, res) => {
  const { userId } = req.query;
  const stats = await getPaymentStats(userId || null);
  res.json({ success: true, data: { stats } });
};

export const refundPaymentHandler = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await paymentModel.findById(id);
  if (!payment) notFound('Payment');
  if (payment.user_id !== req.user.id && !req.user.roles.includes('super_admin')) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const result = await refundPayment(id, req.user.id, reason);
  res.json({ success: true, message: 'Payment refunded', data: result });
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Paystack Webhook] Received event:', JSON.stringify(payload?.event));

    if (!payload || !payload.event) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });
    }

    // Verify signature if webhook secret is configured
    const signature = req.headers['x-paystack-signature'];
    if (signature) {
      const crypto = await import('crypto');
      const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
      if (secret) {
        const hmac = crypto.createHmac('sha512', secret);
        const digest = hmac.update(JSON.stringify(payload)).digest('hex');
        if (digest !== signature) {
          console.warn('[Paystack Webhook] Invalid signature');
          return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Invalid signature' });
        }
      }
    }

    const event = payload.event;

    switch (event) {
      case 'charge.success': {
        const { reference, metadata } = payload.data;
        await processSuccessfulPayment({
          reference,
          gateway: 'paystack',
          gatewayReference: payload.data?.transaction,
          amount: payload.data?.amount / 100,
          metadata: metadata || {},
        });
        break;
      }

      case 'charge.failed': {
        const { reference, metadata } = payload.data;
        const payment = await paymentModel.findByReference(reference);
        if (payment && payment.status === 'pending') {
          await paymentModel.update(payment.id, {
            status: 'failed',
            failureReason: 'Payment failed at gateway',
            metadata: { ...payment.metadata, failureReason: 'gateway_decline' },
          });
        }
        break;
      }

      case 'refund.processed':
      case 'refund.requested': {
        console.log('[Paystack Webhook] Refund event received:', event);
        break;
      }

      default:
        console.log('[Paystack Webhook] Unhandled event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Flutterwave Webhook] Received event:', JSON.stringify(payload?.event?.type));

    if (!payload) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });
    }

    // Verify encryption hash if configured
    const secretHash = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    if (secretHash && payload.enCRYPTED_SECURITY_HASH !== secretHash) {
      console.warn('[Flutterwave Webhook] Invalid encryption hash');
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Invalid signature' });
    }

    const eventType = payload?.event?.type;

    switch (eventType) {
      case 'complete': {
        const { tx_ref, amount, currency, customer_email } = payload.data;
        await processSuccessfulPayment({
          reference: tx_ref,
          gateway: 'flutterwave',
          gatewayReference: payload.data?.id?.toString(),
          amount: parseFloat(amount),
          metadata: payload.data?.metadata || {},
        });
        break;
      }

      case 'failed': {
        const { tx_ref } = payload.data;
        const payment = await paymentModel.findByReference(tx_ref);
        if (payment && payment.status === 'pending') {
          await paymentModel.update(payment.id, {
            status: 'failed',
            failureReason: 'Payment failed at gateway',
          });
        }
        break;
      }

      case 'refund': {
        console.log('[Flutterwave Webhook] Refund event received');
        break;
      }

      default:
        console.log('[Flutterwave Webhook] Unhandled event:', eventType);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Flutterwave Webhook] Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

async function processSuccessfulPayment({ reference, gateway, gatewayReference, amount, metadata }) {
  const payment = await paymentModel.findByReference(reference);
  if (!payment) {
    console.warn(`[Payment Webhook] Payment not found for reference: ${reference}`);
    return;
  }

  // Idempotency: skip if already completed
  if (payment.status === 'completed') {
    console.log(`[Payment Webhook] Payment already completed for reference: ${reference}`);
    return;
  }

  // Idempotency: skip if already failed
  if (payment.status === 'failed') {
    return;
  }

  // Idempotency: skip if amount doesn't match significantly
  const paymentAmount = parseFloat(payment.amount);
  if (amount && Math.abs(paymentAmount - amount) > 0.01) {
    console.warn(`[Payment Webhook] Amount mismatch. Expected: ${paymentAmount}, Got: ${amount}`);
    await paymentModel.update(payment.id, {
      status: 'failed',
      failureReason: 'Amount mismatch',
    });
    return;
  }

  await paymentModel.update(payment.id, {
    status: 'completed',
    paidAt: new Date(),
    gatewayReference: gatewayReference || payment.gateway_reference,
  });

  console.log(`[Payment Webhook] Payment completed: ${reference}, purpose: ${payment.purpose}, purposeId: ${payment.purpose_id}`);

  // Activate subscription if applicable
  if (payment.purpose === 'subscription' && payment.purpose_id) {
    await activateSubscription(payment, metadata);
  }

  // Grant course access if applicable
  if (payment.purpose === 'course' && payment.purpose_id) {
    await grantCourseAccess(payment, metadata);
  }

  // Send notification
  try {
    await notificationService.create({
      userId: payment.user_id,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      body: `Your payment of ₦${paymentAmount.toLocaleString()} was successful.`,
      actionUrl: '/dashboard/subscriptions/billing',
      channel: 'in_app',
    });
  } catch (notifErr) {
    console.error('[Payment Webhook] Notification error:', notifErr);
  }
}

async function activateSubscription(payment, metadata) {
  const plan = await subscriptionPlanModel.findById(payment.purpose_id);
  if (!plan) {
    console.error(`[Payment Webhook] Plan not found: ${payment.purpose_id}`);
    return;
  }

  const existingSub = await subscriptionModel.findByUser(payment.user_id);
  if (existingSub && existingSub.status === 'active') {
    console.log(`[Payment Webhook] Active subscription exists for user: ${payment.user_id}, renewing`);
    // Renew existing subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + plan.durationDays);
    await subscriptionModel.update(existingSub.id, {
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: 'active',
      gatewaySubscriptionId: payment.gateway_reference,
      gateway: payment.gateway,
    });
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

  await subscriptionModel.create({
    userId: payment.user_id,
    planId: payment.purpose_id,
    gatewaySubscriptionId: payment.gateway_reference,
    gateway: payment.gateway,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });
}

async function grantCourseAccess(payment, metadata) {
  const enrollment = await studentCourseModel.findByStudentAndCourse(payment.user_id, payment.purpose_id);
  if (!enrollment) {
    await studentCourseModel.create({
      studentId: payment.user_id,
      courseId: payment.purpose_id,
    });
  }
}

export const fetchPaymentGateways = async (req, res) => {
  const gateways = [
    { id: '1', name: 'Paystack', code: 'paystack', isActive: !!process.env.PAYSTACK_SECRET_KEY },
    { id: '2', name: 'Flutterwave', code: 'flutterwave', isActive: !!process.env.FLUTTERWAVE_SECRET_KEY },
    { id: '3', name: 'Wallet', code: 'wallet', isActive: true },
  ];
  res.json({ success: true, data: { gateways } });
};
