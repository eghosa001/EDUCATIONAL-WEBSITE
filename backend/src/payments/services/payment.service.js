import { paymentModel, generateReference } from '../models/payment.model.js';
import { walletModel, walletTransactionModel, subscriptionPlanModel, subscriptionModel } from '../../subscriptions/models/subscription.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { PAYMENT_STATUS, PAYMENT_GATEWAYS } from '../../common/constants/index.js';
import { transaction, query } from '../../common/database/index.js';
import { paystackService } from './paystack.service.js';
import { flutterwaveService } from './flutterwave.service.js';

const notFound = (resource) => { throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND); };

export const initializePayment = async (userId, data) => {
  const { currency = 'NGN', gateway, planId, courseId, examId, redirectUrl, metadata = {} } = data;
  if (!gateway) throw new AppError('Payment gateway is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);

  let amount = Number(data.amount);
  let purpose = metadata.purpose || 'general';
  let purposeId = planId || courseId || examId || null;

  // Never trust a client-supplied amount for an entitlement-bearing payment.
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

  // Wallet payments are already settled. Grant only the entitlement attached to
  // this exact payment, rather than relying on a client-controlled callback.
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

export const refundPayment = async (paymentId, userId, reason) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.status !== PAYMENT_STATUS.COMPLETED) throw new AppError('Only completed payments can be refunded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  if (payment.user_id !== userId) throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  return transaction(async () => {
    const refundResult = await performRefund(payment);
    await paymentModel.update(paymentId, { status: PAYMENT_STATUS.REFUNDED, metadata: { ...payment.metadata, refundReason: reason, refundAmount: refundResult?.amount } });
    if (refundResult && payment.gateway !== PAYMENT_GATEWAYS.WALLET) await creditWalletBalance(userId, refundResult.amount, `Refund: ${reason}`, payment.reference);
    return refundResult;
  });
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
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + amount;
  await walletModel.updateBalance(wallet.id, balanceAfter);
  await walletTransactionModel.create({ walletId: wallet.id, userId, type: 'credit', amount, balanceBefore, balanceAfter, reference: reference || generateReference(), description });
};

export const getPaymentById = async (paymentId, userId) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.user_id !== userId) throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  return payment;
};
