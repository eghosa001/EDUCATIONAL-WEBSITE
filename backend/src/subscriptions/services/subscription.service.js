import { query, transaction } from '../../common/database/index.js';
import { SUBSCRIPTION_STATUS, PAYMENT_STATUS } from '../../common/constants/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { subscriptionModel, subscriptionPlanModel, invoiceModel, walletModel, walletTransactionModel, couponModel, couponUsageModel } from '../models/subscription.model.js';
import { generateReference } from '../../common/utils/transaction.js';

export const getActiveSubscription = async (userId) => {
  return subscriptionModel.findByUser(userId);
};

export const getSubscriptionById = async (id) => {
  const subscription = await subscriptionModel.findById(id);
  if (!subscription) {
    throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return subscription;
};

export const createSubscription = async (userId, planId, gateway, gatewaySubscriptionId = null) => {
  const plan = await subscriptionPlanModel.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (!plan.isActive) {
    throw new AppError('This subscription plan is not available', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const existingSubscription = await subscriptionModel.findByUser(userId);
  if (existingSubscription && existingSubscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    throw new AppError('You already have an active subscription', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

  return transaction(async () => {
    const subscription = await subscriptionModel.create({
      userId,
      planId,
      gatewaySubscriptionId,
      gateway: gateway || 'wallet',
      status: plan.price === 0 ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.TRIALING,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    if (plan.price === 0) {
      await subscriptionModel.update(subscription.id, { status: SUBSCRIPTION_STATUS.ACTIVE });
    }

    return subscription;
  });
};

export const cancelSubscription = async (subscriptionId, userId, reason = null) => {
  const subscription = await subscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (subscription.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && subscription.status !== SUBSCRIPTION_STATUS.TRIALING) {
    throw new AppError('Subscription is not active', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  return subscriptionModel.update(subscriptionId, {
    cancelAtPeriodEnd: true,
    cancellationReason: reason,
    status: SUBSCRIPTION_STATUS.CANCELLED,
    endedAt: new Date(),
  });
};

export const resumeSubscription = async (subscriptionId, userId) => {
  const subscription = await subscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (subscription.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  if (subscription.status !== SUBSCRIPTION_STATUS.CANCELLED) {
    throw new AppError('Subscription is not cancelled', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const plan = await subscriptionPlanModel.findById(subscription.plan_id);
  if (!plan || !plan.isActive) {
    throw new AppError('Plan is no longer available', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

  return subscriptionModel.update(subscriptionId, {
    cancelAtPeriodEnd: false,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });
};

export const processGatewayWebhook = async (gateway, data) => {
  switch (gateway) {
    case 'paystack':
      return processPaystackWebhook(data);
    case 'flutterwave':
      return processFlutterwaveWebhook(data);
    default:
      throw new AppError(`Unsupported gateway: ${gateway}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
};

const processPaystackWebhook = async (data) => {
  const { event, data: eventData } = data;

  if (event === 'charge.success') {
    const gatewaySubscriptionId = eventData?.subscription?.subscription_number || eventData?.reference;
    const subscription = await subscriptionModel.findByGatewaySubscriptionId(gatewaySubscriptionId);

    if (subscription) {
      const plan = await subscriptionPlanModel.findById(subscription.plan_id);
      if (plan) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

        await subscriptionModel.update(subscription.id, {
          status: SUBSCRIPTION_STATUS.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        });
      }
    }
  }

  return { success: true };
};

const processFlutterwaveWebhook = async (data) => {
  const { event, data: eventData } = data;

  if (event === 'complete') {
    const gatewaySubscriptionId = eventData?.subscription_number || eventData?.tx_ref;
    const subscription = await subscriptionModel.findByGatewaySubscriptionId(gatewaySubscriptionId);

    if (subscription) {
      const plan = await subscriptionPlanModel.findById(subscription.plan_id);
      if (plan) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

        await subscriptionModel.update(subscription.id, {
          status: SUBSCRIPTION_STATUS.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        });
      }
    }
  }

  return { success: true };
};

export const renewSubscription = async (subscriptionId, userId, paymentMethod = 'wallet') => {
  const subscription = await subscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (subscription.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const plan = await subscriptionPlanModel.findById(subscription.plan_id);
  if (!plan) {
    throw new AppError('Plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return transaction(async () => {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

    const newSubscription = await subscriptionModel.create({
      userId,
      planId: subscription.plan_id,
      gatewaySubscriptionId: null,
      gateway: paymentMethod,
      status: plan.price === 0 ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.TRIALING,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    if (plan.price > 0) {
      await subscriptionModel.update(subscription.id, {
        status: SUBSCRIPTION_STATUS.EXPIRED,
        endedAt: now,
      });
    }

    return newSubscription;
  });
};

export const downgradeSubscription = async (subscriptionId, userId, newPlanId) => {
  const subscription = await subscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (subscription.user_id !== userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const newPlan = await subscriptionPlanModel.findById(newPlanId);
  if (!newPlan || !newPlan.isActive) {
    throw new AppError('Invalid plan', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  return subscriptionModel.update(subscription.id, {
    planId: newPlanId,
    cancelAtPeriodEnd: true,
  });
};

export const validateSubscriptionAccess = async (userId, requiredPlanCode = null) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return { hasAccess: false, subscription: null, message: 'No active subscription' };
  }

  if (requiredPlanCode) {
    const plan = await subscriptionPlanModel.findByCode(requiredPlanCode);
    if (!plan) {
      return { hasAccess: false, subscription, message: 'Required plan not found' };
    }

    const planHierarchy = ['free', 'student_basic', 'student_premium', 'parent', 'teacher', 'school'];
    const userPlanIndex = planHierarchy.indexOf(plan.code);
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlanCode);

    if (userPlanIndex < requiredPlanIndex) {
      return {
        hasAccess: false,
        subscription,
        message: `Upgrade required. Current plan: ${plan.name}, Required: ${requiredPlanCode}`,
      };
    }
  }

  return { hasAccess: true, subscription };
};

export const applyCoupon = async (couponCode, planId) => {
  const coupon = await couponModel.findByCode(couponCode);
  if (!coupon) {
    throw new AppError('Invalid coupon code', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!coupon.is_active) {
    throw new AppError('This coupon is no longer active', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  if (now < new Date(coupon.valid_from)) {
    throw new AppError('This coupon is not yet valid', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  if (coupon.valid_until && now > new Date(coupon.valid_until)) {
    throw new AppError('This coupon has expired', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (coupon.usage_limit > 0 && coupon.times_used >= coupon.usage_limit) {
    throw new AppError('This coupon has reached its usage limit', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (coupon.applicable_plans.length > 0 && !coupon.applicable_plans.includes(planId)) {
    throw new AppError('This coupon is not applicable to the selected plan', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const plan = await subscriptionPlanModel.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (plan.price * coupon.discount_value) / 100;
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  discountAmount = Math.min(discountAmount, plan.price);

  return {
    coupon,
    discountAmount,
    finalAmount: plan.price - discountAmount,
  };
};

export const checkCouponUsage = async (userId, couponId) => {
  if (couponId.is_single_use) {
    const used = await couponUsageModel.hasUserUsedCoupon(userId, couponId.id);
    if (used) {
      throw new AppError('You have already used this coupon', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.CONFLICT);
    }
  }
};

export const deductWalletBalance = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (wallet.balance < amount) {
    throw new AppError('Insufficient wallet balance', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  }

  return transaction(async (client) => {
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore - amount;

    await client.query(
      'UPDATE wallets SET balance = $2 WHERE id = $1',
      [wallet.id, balanceAfter]
    );

    const transactionResult = await client.query(
      `INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference, description
      ) VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7)
      RETURNING *`,
      [wallet.id, userId, amount, balanceBefore, balanceAfter, reference || generateReference(), description]
    );

    return transactionResult.rows[0];
  });
};

export const creditWalletBalance = async (userId, amount, description, reference) => {
  const wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return transaction(async (client) => {
    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    await client.query(
      'UPDATE wallets SET balance = $2 WHERE id = $1',
      [wallet.id, balanceAfter]
    );

    const transactionResult = await client.query(
      `INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference, description
      ) VALUES ($1, $2, 'credit', $3, $4, $5, $6, $7)
      RETURNING *`,
      [wallet.id, userId, amount, balanceBefore, balanceAfter, reference || generateReference(), description]
    );

    return transactionResult.rows[0];
  });
};

export const createInvoice = async (userId, planId, amount, currency, couponId = null, discountAmount = 0) => {
  const invoiceNumber = await invoiceModel.generateInvoiceNumber();
  const plan = await subscriptionPlanModel.findById(planId);

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 7);

  return invoiceModel.create({
    invoiceNumber,
    userId,
    subscriptionId: null,
    paymentId: null,
    amount,
    currency: currency || 'NGN',
    taxAmount: 0,
    discountAmount,
    status: PAYMENT_STATUS.PENDING,
    dueDate,
  });
};

export const generateAllModels = () => ({
  subscriptionPlanModel,
  subscriptionModel,
  invoiceModel,
  walletModel,
  walletTransactionModel,
  paymentMethodModel,
  couponModel,
  couponUsageModel,
});
