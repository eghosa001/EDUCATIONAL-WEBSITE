import { paymentModel, generateReference } from '../models/payment.model.js';
import { walletModel, walletTransactionModel, subscriptionPlanModel, subscriptionModel } from '../../subscriptions/models/subscription.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { PAYMENT_STATUS, PAYMENT_GATEWAYS } from '../../common/constants/index.js';
import { transaction, query } from '../../common/database/index.js';
import { paystackService } from './paystack.service.js';
import { flutterwaveService } from './flutterwave.service.js';

const notFound = (resource) => { throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND); };
const positiveInt = (value, fallback, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

export const initializePayment = async (userId, data) => {
  const { currency = 'NGN', gateway, planId, courseId, examId, redirectUrl, metadata = {} } = data;
  if (!gateway) throw new AppError('Payment gateway is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);

  let amount = Number(data.amount);
  let purpose = metadata.purpose || 'general';
  let purposeId = planId || courseId || examId || null;

  if (planId) {
    const plan = await subscriptionPlanModel.findById(planId);
    if (!plan || !plan.is_active) throw new AppError('Subscription plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    amount = Number(plan.price);
    purpose = 'subscription';
  } else if (courseId) {
    const course = await courseModel.findById(courseId);
    if (!course) throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    amount = Number(course.price || 0);
    purpose = 'course';
  } else if (examId) {
    if (!Number.isFinite(amount) || amount < 0) throw new AppError('Invalid payment amount', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    purpose = 'exam';
  }

  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Invalid payment amount', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);

  const userResult = await query('SELECT email FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1', [userId]);
  const email = userResult.rows[0]?.email;
  if (!email) throw new AppError('User account not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

  const reference = generateReference();
  let gatewayResponse = null;
  switch (gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK:
      gatewayResponse = await paystackService.initializePayment({ amount, currency, email, reference, metadata: { ...metadata, planId, courseId, examId, purpose, purposeId } });
      break;
    case PAYMENT_GATEWAYS.FLUTTERWAVE:
      gatewayResponse = await flutterwaveService.initializePayment({ amount, currency, customerEmail: email, txRef: reference, redirectUrl: redirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000', metadata: { ...metadata, planId, courseId, examId, purpose, purposeId } });
      break;
    case PAYMENT_GATEWAYS.WALLET:
      await deductWallet(userId, amount, metadata?.description || `${purpose} payment`, reference);
      gatewayResponse = { status: 'success', reference };
      break;
    default:
      throw new AppError(`Unsupported payment gateway: ${gateway}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const payment = await paymentModel.create({
    reference, userId, amount, currency, gateway,
    gatewayReference: gatewayResponse?.transactionReference || gatewayResponse?.reference,
    status: gateway === PAYMENT_GATEWAYS.WALLET ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
    purpose, purposeId, metadata: { ...metadata, redirectUrl, gatewayResponse },
  });

  if (gateway === PAYMENT_GATEWAYS.WALLET) await grantEntitlement(payment);

  if (gateway === PAYMENT_GATEWAYS.WALLET) return { success: true, data: { payment, accessCode: null, authorizationUrl: null } };
  return { success: true, data: { payment, accessCode: gatewayResponse?.access_code || gatewayResponse?.link, authorizationUrl: gatewayResponse?.authorization_url || gatewayResponse?.link, reference } };
};

export const verifyPayment = async (reference, userId) => {
  const payment = await paymentModel.findByReference(reference);
  if (!payment || payment.user_id !== userId) throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  if (payment.status === PAYMENT_STATUS.COMPLETED) return { success: true, data: { payment, verified: true } };

  let verificationResult = null;
  switch (payment.gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK: verificationResult = await paystackService.verifyPayment(reference); break;
    case PAYMENT_GATEWAYS.FLUTTERWAVE: verificationResult = await flutterwaveService.verifyPayment(reference); break;
    default: return { success: false, data: { payment, verified: false } };
  }
  if (!verificationResult || verificationResult.status !== 'successful') return { success: false, data: { payment, verified: false } };

  const verifiedAmount = Number(verificationResult.amount);
  const expectedAmount = Number(payment.amount);
  const verifiedCurrency = String(verificationResult.gatewayResponse?.currency || verificationResult.currency || payment.currency || 'NGN').toUpperCase();
  const expectedCurrency = String(payment.currency || 'NGN').toUpperCase();
  if (!Number.isFinite(verifiedAmount) || Math.abs(verifiedAmount - expectedAmount) > 0.01 || verifiedCurrency !== expectedCurrency || (verificationResult.reference && verificationResult.reference !== reference)) {
    throw new AppError('Payment verification mismatch', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  }

  const completed = await transaction(async () => {
    const marked = await paymentModel.markCompleted(payment.id, {
      gatewayReference: verificationResult.transactionReference || verificationResult.reference,
      paidAt: new Date(),
    });
    if (!marked) return null;
    await grantEntitlement(marked);
    return marked;
  });

  if (!completed) {
    const latest = await paymentModel.findByReference(reference);
    return { success: latest?.status === PAYMENT_STATUS.COMPLETED, data: { payment: latest, verified: latest?.status === PAYMENT_STATUS.COMPLETED } };
  }
  return { success: true, data: { payment: completed, verified: true } };
};

const grantEntitlement = async (payment) => {
  if (payment.purpose === 'subscription' && payment.purpose_id) {
    const plan = await subscriptionPlanModel.findById(payment.purpose_id);
    if (!plan) throw new AppError('Subscription plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    const existingSub = await subscriptionModel.findByUser(payment.user_id);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + Number(plan.durationDays || plan.duration_days || 0));
    if (existingSub && ['active', 'trialing'].includes(existingSub.status)) {
      await subscriptionModel.update(existingSub.id, { currentPeriodStart: now, currentPeriodEnd: periodEnd, status: 'active', cancelAtPeriodEnd: false, gatewaySubscriptionId: payment.gateway_reference, gateway: payment.gateway });
    } else {
      await subscriptionModel.create({ userId: payment.user_id, planId: payment.purpose_id, gatewaySubscriptionId: payment.gateway_reference, gateway: payment.gateway, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd });
    }
  } else if (payment.purpose === 'course' && payment.purpose_id) {
    const enrollment = await (await import('../../progress/models/studentCourse.model.js')).studentCourseModel.findByStudentAndCourse(payment.user_id, payment.purpose_id);
    if (!enrollment) await (await import('../../progress/models/studentCourse.model.js')).studentCourseModel.create({ studentId: payment.user_id, courseId: payment.purpose_id });
  }
};

const hasOtherCompletedEntitlementPayment = async (payment) => {
  if (!payment.purpose_id || !['subscription', 'course'].includes(payment.purpose)) return false;
  const result = await query(
    `SELECT 1 FROM payments
      WHERE user_id = $1
        AND purpose = $2
        AND purpose_id = $3
        AND status = $4
        AND id <> $5
      LIMIT 1`,
    [payment.user_id, payment.purpose, payment.purpose_id, PAYMENT_STATUS.COMPLETED, payment.id]
  );
  return result.rows.length > 0;
};

const revokeEntitlementAfterRefund = async (payment) => {
  if (await hasOtherCompletedEntitlementPayment(payment)) return;
  if (payment.purpose === 'subscription' && payment.purpose_id) {
    await query(
      `UPDATE subscriptions
          SET status = 'cancelled', cancel_at_period_end = FALSE, canceled_at = NOW(), ended_at = NOW(), updated_at = NOW()
        WHERE user_id = $1 AND plan_id = $2 AND status IN ('active', 'trialing')`,
      [payment.user_id, payment.purpose_id]
    );
  } else if (payment.purpose === 'course' && payment.purpose_id) {
    await query('DELETE FROM student_courses WHERE student_id = $1 AND course_id = $2', [payment.user_id, payment.purpose_id]);
  }
};

export const deductWallet = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  const balanceBefore = Number(wallet.balance);
  if (!Number.isFinite(amount) || amount <= 0 || balanceBefore < amount) throw new AppError('Insufficient wallet balance', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  const balanceAfter = balanceBefore - amount;
  await transaction(async () => {
    await walletModel.updateBalance(wallet.id, balanceAfter);
    await walletTransactionModel.create({ walletId: wallet.id, userId, type: 'debit', amount, balanceBefore, balanceAfter, reference: reference || generateReference(), description });
  });
  return { walletBalance: balanceAfter, transactionRef: reference };
};

export const refundPayment = async (paymentId, customerUserId, reason) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.status !== PAYMENT_STATUS.COMPLETED) throw new AppError('Only completed payments can be refunded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  if (payment.user_id !== customerUserId) throw new AppError('Payment customer mismatch', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);

  let refundResult;
  if (payment.gateway === PAYMENT_GATEWAYS.WALLET) {
    await creditWalletBalance(payment.user_id, Number(payment.amount), `Refund: ${reason || 'Administrative refund'}`, `${payment.reference}-REFUND`);
    refundResult = { amount: Number(payment.amount), gateway: PAYMENT_GATEWAYS.WALLET };
  } else {
    refundResult = await performRefund(payment);
    if (!refundResult) throw new AppError('Payment gateway does not support refunds', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  }

  const refundAmount = Number(refundResult?.amount ?? payment.amount);
  await paymentModel.update(paymentId, {
    status: PAYMENT_STATUS.REFUNDED,
    metadata: { ...payment.metadata, refundReason: reason || null, refundAmount },
  });
  await revokeEntitlementAfterRefund(payment);
  return refundResult;
};

const performRefund = async (payment) => {
  switch (payment.gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK: return paystackService.refundPayment(payment.gatewayReference, payment.amount);
    case PAYMENT_GATEWAYS.FLUTTERWAVE: return flutterwaveService.refundPayment(payment.gatewayReference, payment.amount);
    default: return null;
  }
};

const creditWalletBalance = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new AppError('Invalid wallet credit amount', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + numericAmount;
  await walletModel.updateBalance(wallet.id, balanceAfter);
  await walletTransactionModel.create({ walletId: wallet.id, userId, type: 'credit', amount: numericAmount, balanceBefore, balanceAfter, reference: reference || generateReference(), description });
};

export const getPaymentById = async (paymentId, userId) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.user_id !== userId) throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  return payment;
};

export const listPayments = async ({ page = 1, limit = 20, userId, status, startDate, endDate } = {}) => paymentModel.list({
  page: positiveInt(page, 1),
  limit: positiveInt(limit, 20),
  userId,
  status,
  startDate,
  endDate,
});

export const getPaymentStats = async (userId = null) => paymentModel.getStats(userId || null);
