import {
  getActiveSubscription,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  renewSubscription,
  downgradeSubscription,
  validateSubscriptionAccess,
  applyCoupon,
  checkCouponUsage,
  deductWalletBalance,
  creditWalletBalance,
  createInvoice,
  processGatewayWebhook,
} from '../services/subscription.service.js';
import { subscriptionPlanModel, subscriptionModel, invoiceModel, walletModel, couponModel } from '../models/subscription.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { SUBSCRIPTION_STATUS } from '../../common/constants/index.js';
import { generateReference } from '../../common/utils/transaction.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listPlans = async (req, res) => {
  const { page, limit, isActive } = req.query;
  const { data, pagination } = await subscriptionPlanModel.list({
    page: parseInt(page),
    limit: parseInt(limit),
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });

  res.json({ success: true, data: { plans: data }, pagination });
};

export const getAllActivePlans = async (req, res) => {
  const plans = await subscriptionPlanModel.getAllActive();
  res.json({ success: true, data: { plans } });
};

export const getPlanById = async (req, res) => {
  const plan = await subscriptionPlanModel.findById(req.params.id);
  if (!plan) notFound('Subscription plan');

  res.json({ success: true, data: { plan } });
};

export const createPlan = async (req, res) => {
  const { name, code, description, price, currency, billingCycle, durationDays, trialDays, features, limits, isActive, displayOrder } = req.body;

  const existingCode = await subscriptionPlanModel.findByCode(code);
  if (existingCode) {
    throw new AppError('Plan code already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const plan = await subscriptionPlanModel.create({
    name, code, description, price, currency: currency || 'NGN',
    billingCycle, durationDays, trialDays, features: features || [],
    limits: limits || {}, isActive: isActive !== undefined ? isActive : true,
    displayOrder: displayOrder || 0,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subscription plan created',
    data: { plan },
  });
};

export const updatePlan = async (req, res) => {
  const plan = await subscriptionPlanModel.update(req.params.id, req.body);
  if (!plan) notFound('Subscription plan');

  res.json({ success: true, message: 'Subscription plan updated', data: { plan } });
};

export const deletePlan = async (req, res) => {
  const result = await subscriptionPlanModel.update(req.params.id, { isActive: false });
  if (!result) notFound('Subscription plan');

  res.json({ success: true, message: 'Subscription plan deactivated' });
};

export const getMySubscription = async (req, res) => {
  const subscription = await getActiveSubscription(req.user.id);
  res.json({ success: true, data: { subscription } });
};

export const getSubscriptionHandler = async (req, res) => {
  const subscription = await getSubscriptionById(req.params.id);
  res.json({ success: true, data: { subscription } });
};

export const createNewSubscription = async (req, res) => {
  const { planId, gateway, couponCode } = req.body;

  let finalAmount = 0;
  let discountAmount = 0;
  let couponData = null;

  if (couponCode) {
    const plan = await subscriptionPlanModel.findById(planId);
    if (!plan) notFound('Plan');
    couponData = await applyCoupon(couponCode, planId);
    await checkCouponUsage(req.user.id, couponData.coupon);
    discountAmount = couponData.discountAmount;
    finalAmount = couponData.finalAmount;
  } else {
    const plan = await subscriptionPlanModel.findById(planId);
    if (!plan) notFound('Plan');
    finalAmount = plan.price;
  }

  const gatewayType = gateway || 'wallet';
  const subscription = await createSubscription(req.user.id, planId, gatewayType);

  if (gatewayType === 'wallet') {
    await deductWalletBalance(req.user.id, finalAmount, `Subscription renewal`, null);
  }

  const plan = await subscriptionPlanModel.findById(subscription.plan_id);
  const couponRecord = couponData?.coupon ? await couponModel.findById(couponData.coupon.id) : null;
  const invoice = await createInvoice(req.user.id, planId, finalAmount, 'NGN', couponRecord, discountAmount);

  if (finalAmount === 0 && gatewayType === 'wallet') {
    await subscriptionModel.update(subscription.id, { status: SUBSCRIPTION_STATUS.ACTIVE });
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subscription initiated',
    data: {
      subscription,
      plan,
      invoice,
      amount: finalAmount,
      discount: discountAmount,
    },
  });
};

export const cancelMySubscription = async (req, res) => {
  const { subscriptionId } = req.params;
  const { reason } = req.body;

  const subscription = await subscriptionModel.findByUser(req.user.id);
  if (!subscription) {
    throw new AppError('No active subscription found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const canceled = await cancelSubscription(subscription.id, req.user.id, reason);
  res.json({ success: true, message: 'Subscription cancelled', data: { subscription: canceled } });
};

export const resumeMySubscription = async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await subscriptionModel.findByUser(req.user.id);
  if (!subscription) {
    throw new AppError('No subscription found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const resumed = await resumeSubscription(subscription.id, req.user.id);
  res.json({ success: true, message: 'Subscription resumed', data: { subscription: resumed } });
};

export const renewSubscriptionHandler = async (req, res) => {
  const { subscriptionId } = req.params;
  const { paymentMethod } = req.body;

  const renewed = await renewSubscription(subscriptionId, req.user.id, paymentMethod || 'wallet');
  res.json({ success: true, message: 'Subscription renewed', data: { subscription: renewed } });
};

export const validateAccess = async (req, res) => {
  const { requiredPlan } = req.query;
  const result = await validateSubscriptionAccess(req.user.id, requiredPlan || null);
  res.json({ success: true, data: result });
};

export const applyCouponHandler = async (req, res) => {
  const { couponCode, planId } = req.body;

  try {
    const result = await applyCoupon(couponCode, planId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid coupon', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
};

export const handleWebhook = async (req, res) => {
  const { gateway } = req.params;
  const webhookData = req.body;

  try {
    const result = await processGatewayWebhook(gateway, webhookData);
    res.json(result);
  } catch (error) {
    console.error(`Webhook error for ${gateway}:`, error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await invoiceModel.findByUser(req.user.id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });
  res.json({ success: true, data: result });
};

export const getInvoiceById = async (req, res) => {
  const invoice = await invoiceModel.findById(req.params.id);
  if (!invoice) notFound('Invoice');
  if (invoice.user_id !== req.user.id && !req.user.roles.includes('super_admin')) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: { invoice } });
};

export const getWallet = async (req, res) => {
  let wallet = await walletModel.findByUserId(req.user.id);
  if (!wallet) {
    wallet = await walletModel.createOrUpdate(req.user.id);
  }
  res.json({ success: true, data: { wallet } });
};

export const listWalletTransactions = async (req, res) => {
  const { page, limit } = req.query;
  const wallet = await walletModel.findByUserId(req.user.id);
  if (!wallet) {
    return res.json({ success: true, data: { transactions: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
  }

  const result = await (await import('../models/subscription.model.js')).walletTransactionModel.listByWallet(
    wallet.id,
    { page: parseInt(page), limit: parseInt(limit) }
  );
  res.json({ success: true, data: result });
};
