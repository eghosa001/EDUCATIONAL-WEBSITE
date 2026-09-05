import { initializePayment, verifyPayment, refundPayment, getPaymentById, listPayments, getPaymentStats } from '../services/payment.service.js';
import { paymentModel } from '../models/payment.model.js';
import { subscriptionModel, subscriptionPlanModel } from '../../subscriptions/models/subscription.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { requireRole } from '../../common/middleware/index.js';
import { NOTIFICATION_TYPES } from '../../common/constants/index.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import crypto from 'crypto';

const notFound = (resource) => { throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND); };

export const initializeNewPayment = async (req, res) => {
  const result = await initializePayment(req.user.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Payment initialized', data: result.data });
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
  const result = await listPayments({ page: parseInt(page), limit: parseInt(limit), status, startDate, endDate });
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
  if (payment.user_id !== req.user.id && !req.user.roles.includes('super_admin')) throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  const result = await refundPayment(id, req.user.id, reason);
  res.json({ success: true, message: 'Payment refunded', data: result });
};

const timingSafeHexEqual = (actual, expected) => {
  if (!actual || !expected || !/^[a-f0-9]+$/i.test(actual) || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const signature = req.headers['x-paystack-signature'];
    if (!secret || typeof signature !== 'string' || !req.rawBody) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });
    const expected = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    if (!timingSafeHexEqual(signature, expected)) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });

    const payload = req.body;
    if (!payload || !payload.event || !payload.data) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });

    switch (payload.event) {
      case 'charge.success':
        await processSuccessfulPayment({
          reference: payload.data.reference,
          gateway: 'paystack',
          gatewayReference: payload.data.transaction?.toString(),
          amount: Number(payload.data.amount) / 100,
          currency: payload.data.currency,
          metadata: payload.data.metadata || {},
        });
        break;
      case 'charge.failed': {
        const payment = await paymentModel.findByReference(payload.data.reference);
        if (payment?.status === 'pending') await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Payment failed at gateway', metadata: { ...payment.metadata, failureReason: 'gateway_decline' } });
        break;
      }
      default:
        break;
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal server error' });
  }
};

export const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    const signature = req.headers['verif-hash'];
    if (!secretHash || typeof signature !== 'string') return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(secretHash))) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });

    const payload = req.body;
    if (!payload?.data) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });

    switch (payload?.event?.type) {
      case 'complete':
        await processSuccessfulPayment({
          reference: payload.data.tx_ref,
          gateway: 'flutterwave',
          gatewayReference: payload.data.id?.toString(),
          amount: Number(payload.data.amount),
          currency: payload.data.currency,
          metadata: payload.data.metadata || {},
        });
        break;
      case 'failed': {
        const payment = await paymentModel.findByReference(payload.data.tx_ref);
        if (payment?.status === 'pending') await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Payment failed at gateway' });
        break;
      }
      default:
        break;
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('[Flutterwave Webhook] Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal server error' });
  }
};

async function processSuccessfulPayment({ reference, gateway, gatewayReference, amount, currency, metadata }) {
  if (!reference || !gateway || !Number.isFinite(amount) || amount <= 0) return;
  const payment = await paymentModel.findByReference(reference);
  if (!payment || payment.gateway !== gateway) return;
  if (payment.status === 'completed') return;
  if (payment.status !== 'pending') return;

  const paymentAmount = Number(payment.amount);
  const expectedCurrency = String(payment.currency || 'NGN').toUpperCase();
  const receivedCurrency = String(currency || expectedCurrency).toUpperCase();
  if (Math.abs(paymentAmount - amount) > 0.01 || expectedCurrency !== receivedCurrency) {
    await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Gateway amount or currency mismatch' });
    return;
  }

  const completed = await paymentModel.markCompleted(payment.id, { gatewayReference, paidAt: new Date() });
  if (!completed) return; // Another webhook already completed this payment.

  if (completed.purpose === 'subscription' && completed.purpose_id) await activateSubscription(completed);
  if (completed.purpose === 'course' && completed.purpose_id) await grantCourseAccess(completed);

  try {
    await notificationService.create({
      userId: completed.user_id,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      body: `Your payment of ₦${paymentAmount.toLocaleString()} was successful.`,
      actionUrl: '/dashboard/subscriptions/billing',
      channel: 'in_app',
    });
  } catch (notifErr) { console.error('[Payment Webhook] Notification error:', notifErr); }
}

async function activateSubscription(payment) {
  const plan = await subscriptionPlanModel.findById(payment.purpose_id);
  if (!plan) return;
  const existingSub = await subscriptionModel.findByUser(payment.user_id);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + Number(plan.durationDays || plan.duration_days || 0));

  if (existingSub && ['active', 'trialing'].includes(existingSub.status)) {
    await subscriptionModel.update(existingSub.id, {
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: 'active',
      cancelAtPeriodEnd: false,
      gatewaySubscriptionId: payment.gateway_reference,
      gateway: payment.gateway,
    });
    return;
  }

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

async function grantCourseAccess(payment) {
  const enrollment = await studentCourseModel.findByStudentAndCourse(payment.user_id, payment.purpose_id);
  if (!enrollment) await studentCourseModel.create({ studentId: payment.user_id, courseId: payment.purpose_id });
}

export const fetchPaymentGateways = async (req, res) => {
  const gateways = [
    { id: '1', name: 'Paystack', code: 'paystack', isActive: !!process.env.PAYSTACK_SECRET_KEY },
    { id: '2', name: 'Flutterwave', code: 'flutterwave', isActive: !!process.env.FLUTTERWAVE_SECRET_KEY },
    { id: '3', name: 'Wallet', code: 'wallet', isActive: true },
  ];
  res.json({ success: true, data: { gateways } });
};
