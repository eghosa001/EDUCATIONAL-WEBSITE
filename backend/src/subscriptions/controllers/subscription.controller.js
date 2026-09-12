import {
  getActiveSubscription,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  renewSubscription,
  validateSubscriptionAccess,
  applyCoupon,
  createInvoice,
} from '../services/subscription.service.js';
import { subscriptionPlanModel, subscriptionModel, invoiceModel, walletModel } from '../models/subscription.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const isAdmin = (user) => user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

export const listPlans = async (req, res) => {
  const { page, limit, isActive } = req.query;
  const { data, pagination } = await subscriptionPlanModel.list({
    page: parseInt(page),
    limit: parseInt(limit),
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });
  res.json({ success: true, data: { plans: data }, pagination });
};

export const getAllActivePlans = async (_req, res) => {
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
  if (existingCode) throw new AppError('Plan code already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);

  const plan = await subscriptionPlanModel.create({
    name, code, description, price, currency: currency || 'NGN',
    billingCycle, durationDays, trialDays, features: features || [], limits: limits || {},
    isActive: isActive !== undefined ? isActive : true, displayOrder: displayOrder || 0,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Subscription plan created', data: { plan } });
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
  if (subscription.user_id !== req.user.id && !isAdmin(req.user)) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: { subscription } });
};

export const createNewSubscription = async (req, res) => {
  const { planId, couponCode } = req.body;
  const plan = await subscriptionPlanModel.findById(planId);
  if (!plan) notFound('Plan');
  if (!plan.is_active && !plan.isActive) {
    throw new AppError('This subscription plan is not available', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const price = Number(plan.price || 0);
  if (price > 0) {
    throw new AppError(
      'Paid subscriptions must be started through the secure payment checkout.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.PAYMENT_ERROR
    );
  }
  if (couponCode) {
    // Coupons cannot reduce an already-free plan further and are not consumed here.
    await applyCoupon(couponCode, planId);
  }

  const subscription = await createSubscription(req.user.id, planId, 'free');
  const invoice = await createInvoice(req.user.id, planId, 0, plan.currency || 'NGN', null, 0);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Free subscription activated',
    data: { subscription, plan, invoice, amount: 0, discount: 0 },
  });
};

export const cancelMySubscription = async (req, res) => {
  const { reason } = req.body;
  const subscription = await subscriptionModel.findByUser(req.user.id);
  if (!subscription) throw new AppError('No active subscription found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  const canceled = await cancelSubscription(subscription.id, req.user.id, reason);
  res.json({ success: true, message: 'Subscription cancelled', data: { subscription: canceled } });
};

export const resumeMySubscription = async (req, res) => {
  const subscription = await subscriptionModel.findByUser(req.user.id);
  if (!subscription) throw new AppError('No subscription found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  const resumed = await resumeSubscription(subscription.id, req.user.id);
  res.json({ success: true, message: 'Subscription resumed', data: { subscription: resumed } });
};

export const renewSubscriptionHandler = async (req, res) => {
  const { subscriptionId } = req.params;
  const subscription = await subscriptionModel.findById(subscriptionId);
  if (!subscription) notFound('Subscription');
  if (subscription.user_id !== req.user.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  const plan = await subscriptionPlanModel.findById(subscription.plan_id);
  if (!plan) notFound('Plan');
  if (Number(plan.price || 0) > 0) {
    throw new AppError(
      'Paid renewals must be started through the secure payment checkout.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.PAYMENT_ERROR
    );
  }
  const renewed = await renewSubscription(subscriptionId, req.user.id, 'free');
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

export const getInvoices = async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await invoiceModel.findByUser(req.user.id, {
    page: parseInt(page), limit: parseInt(limit), status,
  });
  res.json({ success: true, data: result });
};

export const getInvoiceById = async (req, res) => {
  const invoice = await invoiceModel.findById(req.params.id);
  if (!invoice) notFound('Invoice');
  if (invoice.user_id !== req.user.id && !isAdmin(req.user)) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: { invoice } });
};

export const getWallet = async (req, res) => {
  let wallet = await walletModel.findByUserId(req.user.id);
  if (!wallet) wallet = await walletModel.createOrUpdate(req.user.id);
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
