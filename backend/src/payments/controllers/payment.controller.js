import { initializePayment, verifyPayment, refundPayment, listPayments, getPaymentStats } from '../services/payment.service.js';
import { paymentModel } from '../models/payment.model.js';
import { subscriptionModel, subscriptionPlanModel } from '../../subscriptions/models/subscription.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { NOTIFICATION_TYPES } from '../../common/constants/index.js';
import { notificationService } from '../../notifications/services/notification.service.js';
import { query } from '../../common/database/index.js';
import crypto from 'crypto';

const notFound = (resource) => { throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND); };
const isFinancialAdmin = (user) => user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

export const initializeNewPayment = async (req, res) => { const result = await initializePayment(req.user.id, req.body); res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Payment initialized', data: result.data }); };
export const verifyNewPayment = async (req, res) => { res.json(await verifyPayment(req.body.reference, req.user.id)); };
export const getPayment = async (req, res) => {
  const payment = await paymentModel.findById(req.params.id);
  if (!payment) notFound('Payment');
  if (payment.user_id !== req.user.id && !isFinancialAdmin(req.user)) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: { payment } });
};
export const listAllPayments = async (req, res) => { const { page, limit, status, startDate, endDate } = req.query; res.json({ success: true, data: await listPayments({ page: parseInt(page), limit: parseInt(limit), status, startDate, endDate }) }); };
export const getPaymentStatsHandler = async (req, res) => { res.json({ success: true, data: { stats: await getPaymentStats(req.query.userId || null) } }); };
export const refundPaymentHandler = async (req, res) => {
  const payment = await paymentModel.findById(req.params.id);
  if (!payment) notFound('Payment');
  if (!req.user.roles?.includes('super_admin')) throw new AppError('Super administrator access required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  res.json({ success: true, message: 'Payment refunded', data: await refundPayment(req.params.id, payment.user_id, req.body.reason) });
};

const timingSafeHexEqual = (actual, expected) => { if (!actual || !expected || !/^[a-f0-9]+$/i.test(actual) || actual.length !== expected.length) return false; return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex')); };
const timingSafeStringEqual = (actual, expected) => { const a = Buffer.from(String(actual || '')); const b = Buffer.from(String(expected || '')); return a.length === b.length && crypto.timingSafeEqual(a, b); };

export const handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const signature = req.headers['x-paystack-signature'];
    if (!secret || typeof signature !== 'string' || !req.rawBody) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });
    const expected = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    if (!timingSafeHexEqual(signature, expected)) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });
    const payload = req.body;
    if (!payload || !payload.event || !payload.data) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });
    if (payload.event === 'charge.success') await processSuccessfulPayment({ reference: payload.data.reference, gateway: 'paystack', gatewayReference: payload.data.id?.toString() || payload.data.transaction?.toString(), amount: Number(payload.data.amount) / 100, currency: payload.data.currency });
    else if (payload.event === 'charge.failed') { const payment = await paymentModel.findByReference(payload.data.reference); if (payment?.status === 'pending') await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Payment failed at gateway' }); }
    return res.json({ success: true });
  } catch (error) { console.error('[Paystack Webhook] Error:', error); return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal server error' }); }
};

export const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    if (!secretHash || !req.rawBody) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });

    const modernSignature = req.headers['flutterwave-signature'];
    const legacySignature = req.headers['verif-hash'];
    let authenticated = false;
    if (typeof modernSignature === 'string') {
      const expected = crypto.createHmac('sha256', secretHash).update(req.rawBody).digest('base64');
      authenticated = timingSafeStringEqual(modernSignature, expected);
    } else if (typeof legacySignature === 'string') {
      authenticated = timingSafeStringEqual(legacySignature, secretHash);
    }
    if (!authenticated) return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: 'Webhook authentication failed' });

    const payload = req.body;
    if (!payload?.data) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid payload' });
    const eventType = String(payload.type || payload.event?.type || payload.event || '').toLowerCase();
    const status = String(payload.data.status || '').toLowerCase();
    const reference = payload.data.reference || payload.data.tx_ref;
    if (eventType === 'charge.completed' && ['succeeded', 'successful', 'success', 'completed'].includes(status)) {
      await processSuccessfulPayment({ reference, gateway: 'flutterwave', gatewayReference: payload.data.id?.toString(), amount: Number(payload.data.amount), currency: payload.data.currency });
    } else if (eventType === 'charge.failed' || status === 'failed') {
      const payment = reference ? await paymentModel.findByReference(reference) : null;
      if (payment?.status === 'pending') await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Payment failed at gateway' });
    }
    return res.json({ success: true });
  } catch (error) { console.error('[Flutterwave Webhook] Error:', error); return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal server error' }); }
};

async function processSuccessfulPayment({ reference, gateway, gatewayReference, amount, currency }) {
  if (!reference || !gateway || !Number.isFinite(amount) || amount <= 0) return;
  const payment = await paymentModel.findByReference(reference);
  if (!payment || payment.gateway !== gateway || payment.status !== 'pending') return;
  const paymentAmount = Number(payment.amount);
  const expectedCurrency = String(payment.currency || 'NGN').toUpperCase();
  const receivedCurrency = String(currency || expectedCurrency).toUpperCase();
  if (Math.abs(paymentAmount - amount) > 0.01 || expectedCurrency !== receivedCurrency) { await paymentModel.update(payment.id, { status: 'failed', failureReason: 'Gateway amount or currency mismatch' }); return; }
  const completed = await paymentModel.markCompleted(payment.id, { gatewayReference, paidAt: new Date() });
  if (!completed) return;
  if (completed.purpose === 'subscription' && completed.purpose_id) await activateSubscription(completed);
  if (completed.purpose === 'course' && completed.purpose_id) await grantCourseAccess(completed);
  try { await notificationService.create({ userId: completed.user_id, type: NOTIFICATION_TYPES.PAYMENT_SUCCESS, title: 'Payment Successful', body: `Your payment of ₦${paymentAmount.toLocaleString()} was successful.`, actionUrl: '/dashboard/subscriptions/billing', channel: 'in_app' }); } catch (notifErr) { console.error('[Payment Webhook] Notification error:', notifErr); }
}

async function activateSubscription(payment) {
  const plan = await subscriptionPlanModel.findById(payment.purpose_id); if (!plan) return;
  const existingSub = await subscriptionModel.findByUser(payment.user_id);
  const now = new Date(); const periodEnd = new Date(now); periodEnd.setDate(periodEnd.getDate() + Number(plan.durationDays || plan.duration_days || 0));
  if (existingSub && ['active', 'trialing'].includes(existingSub.status)) {
    await query(
      `UPDATE subscriptions
          SET plan_id = $2,
              gateway_subscription_id = $3,
              gateway = $4,
              status = 'active',
              current_period_start = $5,
              current_period_end = $6,
              cancel_at_period_end = FALSE,
              canceled_at = NULL,
              ended_at = NULL,
              updated_at = NOW()
        WHERE id = $1`,
      [existingSub.id, payment.purpose_id, payment.gateway_reference, payment.gateway, now, periodEnd]
    );
    return;
  }
  await subscriptionModel.create({ userId: payment.user_id, planId: payment.purpose_id, gatewaySubscriptionId: payment.gateway_reference, gateway: payment.gateway, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd });
}
async function grantCourseAccess(payment) { const enrollment = await studentCourseModel.findByStudentAndCourse(payment.user_id, payment.purpose_id); if (!enrollment) await studentCourseModel.create({ studentId: payment.user_id, courseId: payment.purpose_id }); }
export const fetchPaymentGateways = async (_req, res) => { res.json({ success: true, data: { gateways: [{ id: '1', name: 'Paystack', code: 'paystack', isActive: !!process.env.PAYSTACK_SECRET_KEY }, { id: '2', name: 'Flutterwave', code: 'flutterwave', isActive: !!process.env.FLUTTERWAVE_SECRET_KEY }, { id: '3', name: 'Wallet', code: 'wallet', isActive: true }] } }); };
