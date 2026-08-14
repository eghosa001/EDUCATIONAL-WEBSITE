import { paymentModel } from '../models/payment.model.js';
import { walletModel, walletTransactionModel } from '../../subscriptions/models/subscription.model.js';
import { subscriptionPlanModel, subscriptionModel } from '../../subscriptions/models/subscription.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { PAYMENT_STATUS, PAYMENT_GATEWAYS } from '../../common/constants/index.js';
import { generateReference } from '../models/payment.model.js';
import { transaction } from '../../common/database/index.js';
import { paystackService } from './paystack.service.js';
import { flutterwaveService } from './flutterwave.service.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const initializePayment = async (userId, data) => {
  const { amount, currency, gateway, planId, courseId, examId, redirectUrl, metadata } = data;

  if (amount <= 0) {
    throw new AppError('Invalid payment amount', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const reference = generateReference();
  let gatewayResponse = null;

  switch (gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK:
      gatewayResponse = await paystackService.initializePayment({
        amount,
        currency,
        email: userId,
        reference,
        metadata: { ...metadata, planId, courseId, examId },
      });
      break;

    case PAYMENT_GATEWAYS.FLUTTERWAVE:
      gatewayResponse = await flutterwaveService.initializePayment({
        amount,
        currency,
        customerEmail: userId,
        txRef: reference,
        redirectUrl: redirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
        metadata: { planId, courseId, examId },
      });
      break;

    case PAYMENT_GATEWAYS.WALLET:
      await deductWallet(userId, amount, reference, metadata?.description);
      gatewayResponse = { status: 'success', reference };
      break;

    default:
      throw new AppError(`Unsupported payment gateway: ${gateway}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const payment = await paymentModel.create({
    reference,
    userId,
    amount,
    currency: currency || 'NGN',
    gateway,
    gatewayReference: gatewayResponse?.transactionReference || gatewayResponse?.reference,
    status: gateway === PAYMENT_GATEWAYS.WALLET ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
    purpose: metadata?.purpose || 'general',
    purposeId: planId || courseId || examId,
    metadata: { ...metadata, redirectUrl, gatewayResponse },
  });

  if (gateway === PAYMENT_GATEWAYS.WALLET) {
    return { success: true, data: { payment, accessCode: null, authorizationUrl: null } };
  }

  return {
    success: true,
    data: {
      payment,
      accessCode: gatewayResponse?.access_code || gatewayResponse?.link,
      authorizationUrl: gatewayResponse?.authorization_url || gatewayResponse?.link,
      reference,
    },
  };
};

export const verifyPayment = async (reference) => {
  const payment = await paymentModel.findByReference(reference);
  if (!payment) {
    throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (payment.status === PAYMENT_STATUS.COMPLETED) {
    return { success: true, data: { payment, verified: true } };
  }

  let verificationResult = null;
  switch (payment.gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK:
      verificationResult = await paystackService.verifyPayment(reference);
      break;
    case PAYMENT_GATEWAYS.FLUTTERWAVE:
      verificationResult = await flutterwaveService.verifyPayment(reference);
      break;
  }

  if (!verificationResult || verificationResult.status !== 'successful') {
    return { success: false, data: { payment, verified: false } };
  }

  await transaction(async () => {
    await paymentModel.update(payment.id, {
      status: PAYMENT_STATUS.COMPLETED,
      gatewayReference: verificationResult.transactionReference || verificationResult.reference,
      paidAt: new Date(),
    });

    if (payment.purpose === 'subscription' && payment.purposeId) {
      const plan = await subscriptionPlanModel.findById(payment.purposeId);
      if (plan) {
        const existingSub = await subscriptionModel.findByUser(payment.user_id);
        if (!existingSub || existingSub.status !== 'active') {
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

          await subscriptionModel.create({
            userId: payment.user_id,
            planId: payment.purposeId,
            gatewaySubscriptionId: verificationResult.transactionReference,
            gateway: payment.gateway,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          });
        }
      }
    }
  });

  const updatedPayment = await paymentModel.findById(payment.id);
  return { success: true, data: { payment: updatedPayment, verified: true } };
};

export const deductWallet = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const balanceBefore = parseFloat(wallet.balance);
  if (balanceBefore < amount) {
    throw new AppError('Insufficient wallet balance', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  }

  const balanceAfter = balanceBefore - amount;

  await transaction(async () => {
    await walletModel.updateBalance(wallet.id, balanceAfter);

    const txnRef = reference || generateReference();
    await walletTransactionModel.create({
      walletId: wallet.id,
      userId,
      type: 'debit',
      amount,
      balanceBefore,
      balanceAfter,
      reference: txnRef,
      description,
    });
  });

  return { walletBalance: balanceAfter, transactionRef: reference };
};

export const refundPayment = async (paymentId, userId, reason) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.status !== PAYMENT_STATUS.COMPLETED) {
    throw new AppError('Only completed payments can be refunded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  if (payment.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  return transaction(async () => {
    const refundResult = await performRefund(payment);

    await paymentModel.update(paymentId, {
      status: PAYMENT_STATUS.REFUNDED,
      metadata: { ...payment.metadata, refundReason: reason, refundAmount: refundResult?.amount },
    });

    if (refundResult && payment.gateway !== PAYMENT_GATEWAYS.WALLET) {
      await creditWalletBalance(userId, refundResult.amount, `Refund: ${reason}`, payment.reference);
    }

    return refundResult;
  });
};

const performRefund = async (payment) => {
  switch (payment.gateway) {
    case PAYMENT_GATEWAYS.PAYSTACK:
      return paystackService.refundPayment(payment.gatewayReference, payment.amount);
    case PAYMENT_GATEWAYS.FLUTTERWAVE:
      return flutterwaveService.refundPayment(payment.gatewayReference, payment.amount);
    default:
      return null;
  }
};

const creditWalletBalance = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const balanceBefore = parseFloat(wallet.balance);
  const balanceAfter = balanceBefore + amount;

  await walletModel.updateBalance(wallet.id, balanceAfter);
  await walletTransactionModel.create({
    walletId: wallet.id,
    userId,
    type: 'credit',
    amount,
    balanceBefore,
    balanceAfter,
    reference: reference || generateReference(),
    description,
  });
};

export const getPaymentById = async (paymentId, userId) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) notFound('Payment');
  if (payment.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  return payment;
};

export const listPayments = async (filters = {}) => {
  return paymentModel.list(filters);
};

export const getPaymentStats = async (userId) => {
  return paymentModel.getStats(userId);
};
