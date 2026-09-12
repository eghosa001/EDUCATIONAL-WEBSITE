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
  creditWalletBalance,
} from '../services/subscription.service.js';
import { subscriptionPlanModel, subscriptionModel, invoiceModel, walletModel } from '../models/subscription.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { query } from '../../common/database/index.js';
import { generateReference } from '../../common/utils/transaction.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const validationError = (message) => {
  throw new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
};

const isAdmin = (user) => user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
const positiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const normalizePlanPayload = (body, { partial = false } = {}) => {
  const source = body || {};
  const out = {};
  const required = (key, value) => {
    if (!partial && (value === undefined || value === null || value === '')) validationError(`${key} is required`);
  };

  required('name', source.name);
  required('code', source.code);
  required('price', source.price);
  required('billingCycle', source.billingCycle);
  required('durationDays', source.durationDays);

  if (source.name !== undefined) {
    if (typeof source.name !== 'string' || source.name.trim().length < 2 || source.name.trim().length > 100) validationError('name must be between 2 and 100 characters');
    out.name = source.name.trim();
  }
  if (source.code !== undefined) {
    if (typeof source.code !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,49}$/i.test(source.code)) validationError('code must be 2-50 letters, numbers, underscores, or hyphens');
    out.code = source.code.toLowerCase();
  }
  if (source.description !== undefined) {
    if (source.description !== null && typeof source.description !== 'string') validationError('description must be text');
    out.description = source.description || null;
  }
  if (source.price !== undefined) {
    const value = Number(source.price);
    if (!Number.isFinite(value) || value < 0) validationError('price must be a non-negative number');
    out.price = Math.round(value * 100) / 100;
  }
  if (source.currency !== undefined) {
    if (typeof source.currency !== 'string' || !/^[A-Za-z]{3}$/.test(source.currency)) validationError('currency must be a 3-letter code');
    out.currency = source.currency.toUpperCase();
  }
  if (source.billingCycle !== undefined) {
    if (!['monthly', 'yearly', 'one_time'].includes(source.billingCycle)) validationError('billingCycle must be monthly, yearly, or one_time');
    out.billingCycle = source.billingCycle;
  }
  if (source.durationDays !== undefined) {
    const value = Number(source.durationDays);
    if (!Number.isInteger(value) || value < 1 || value > 3650) validationError('durationDays must be an integer between 1 and 3650');
    out.durationDays = value;
  }
  if (source.trialDays !== undefined) {
    const value = Number(source.trialDays);
    if (!Number.isInteger(value) || value < 0 || value > 365) validationError('trialDays must be an integer between 0 and 365');
    out.trialDays = value;
  }
  if (source.features !== undefined) {
    if (!Array.isArray(source.features) || source.features.some((item) => typeof item !== 'string')) validationError('features must be an array of strings');
    out.features = source.features;
  }
  if (source.limits !== undefined) {
    if (!source.limits || typeof source.limits !== 'object' || Array.isArray(source.limits)) validationError('limits must be an object');
    out.limits = source.limits;
  }
  if (source.isActive !== undefined) {
    if (typeof source.isActive !== 'boolean') validationError('isActive must be boolean');
    out.isActive = source.isActive;
  }
  if (source.isPopular !== undefined) {
    if (typeof source.isPopular !== 'boolean') validationError('isPopular must be boolean');
    out.isPopular = source.isPopular;
  }
  if (source.displayOrder !== undefined) {
    const value = Number(source.displayOrder);
    if (!Number.isInteger(value) || value < 0 || value > 10000) validationError('displayOrder must be an integer between 0 and 10000');
    out.displayOrder = value;
  }
  return out;
};

export const listPlans = async (req, res) => {
  const { page, limit, isActive } = req.query;
  const { data, pagination } = await subscriptionPlanModel.list({
    page: positiveInt(page, 1),
    limit: positiveInt(limit, 20),
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
  const payload = normalizePlanPayload(req.body);
  const existingCode = await subscriptionPlanModel.findByCode(payload.code);
  if (existingCode) throw new AppError('Plan code already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);

  const result = await query(
    `INSERT INTO subscription_plans (
       name, code, description, price, currency, billing_cycle, duration_days,
       trial_days, features, limits, is_active, is_popular, display_order
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      payload.name,
      payload.code,
      payload.description || null,
      payload.price,
      payload.currency || 'NGN',
      payload.billingCycle,
      payload.durationDays,
      payload.trialDays ?? 0,
      JSON.stringify(payload.features || []),
      JSON.stringify(payload.limits || {}),
      payload.isActive ?? true,
      payload.isPopular ?? false,
      payload.displayOrder ?? 0,
    ]
  );
  const plan = result.rows[0];
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Subscription plan created', data: { plan } });
};

export const updatePlan = async (req, res) => {
  const payload = normalizePlanPayload(req.body, { partial: true });
  if (Object.keys(payload).length === 0) validationError('No valid plan fields were provided');

  if (payload.code) {
    const existingCode = await subscriptionPlanModel.findByCode(payload.code);
    if (existingCode && existingCode.id !== req.params.id) {
      throw new AppError('Plan code already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    }
  }

  const columns = {
    name: 'name', code: 'code', description: 'description', price: 'price', currency: 'currency',
    billingCycle: 'billing_cycle', durationDays: 'duration_days', trialDays: 'trial_days',
    features: 'features', limits: 'limits', isActive: 'is_active', isPopular: 'is_popular', displayOrder: 'display_order',
  };
  const entries = Object.entries(payload);
  const values = [req.params.id];
  const assignments = entries.map(([key, value]) => {
    const dbValue = ['features', 'limits'].includes(key) ? JSON.stringify(value) : value;
    values.push(dbValue);
    return `${columns[key]} = $${values.length}`;
  });
  const result = await query(
    `UPDATE subscription_plans SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  );
  const plan = result.rows[0] || null;
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

export const listAllSubscriptions = async (req, res) => {
  const page = positiveInt(req.query.page, 1);
  const limit = positiveInt(req.query.limit, 20);
  const offset = (page - 1) * limit;
  const values = [];
  const conditions = [];
  if (req.query.status) {
    values.push(req.query.status);
    conditions.push(`s.status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);
  const rows = await query(
    `SELECT s.*, sp.name AS plan_name, sp.code AS plan_code, sp.price,
            u.email, u.first_name, u.last_name
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
       LEFT JOIN users u ON u.id = s.user_id
       ${where}
      ORDER BY s.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const countValues = values.slice(0, -2);
  const count = await query(`SELECT COUNT(*)::int AS total FROM subscriptions s ${where}`, countValues);
  const total = count.rows[0]?.total || 0;
  res.json({ success: true, data: rows.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    throw new AppError('Paid subscriptions must be started through the secure payment checkout.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
  }
  if (couponCode) await applyCoupon(couponCode, planId);

  const subscription = await createSubscription(req.user.id, planId, 'free');
  const invoice = await createInvoice(req.user.id, planId, 0, plan.currency || 'NGN', null, 0);
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Free subscription activated', data: { subscription, plan, invoice, amount: 0, discount: 0 } });
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
    throw new AppError('Paid renewals must be started through the secure payment checkout.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
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

const buildInvoiceQuery = ({ userId, status, page, limit }) => {
  const values = [];
  const conditions = [];
  if (userId) {
    values.push(userId);
    conditions.push(`i.user_id = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`i.status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  values.push(limit, offset);
  return { values, where };
};

export const getInvoices = async (req, res) => {
  const page = positiveInt(req.query.page, 1);
  const limit = positiveInt(req.query.limit, 20);
  const userId = isAdmin(req.user) ? null : req.user.id;
  const { values, where } = buildInvoiceQuery({ userId, status: req.query.status, page, limit });
  const rows = await query(
    `SELECT i.*, s.plan_id, sp.name AS plan_name, sp.code AS plan_code,
            u.email, u.first_name, u.last_name
       FROM invoices i
       LEFT JOIN subscriptions s ON s.id = i.subscription_id
       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
       LEFT JOIN users u ON u.id = i.user_id
       ${where}
      ORDER BY i.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const count = await query(`SELECT COUNT(*)::int AS total FROM invoices i ${where}`, values.slice(0, -2));
  const total = count.rows[0]?.total || 0;
  const pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
  if (isAdmin(req.user)) return res.json({ success: true, data: rows.rows, pagination });
  return res.json({ success: true, data: { data: rows.rows, pagination } });
};

export const getInvoiceById = async (req, res) => {
  const invoice = await invoiceModel.findById(req.params.id);
  if (!invoice) notFound('Invoice');
  if (invoice.user_id !== req.user.id && !isAdmin(req.user)) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: { invoice } });
};

const targetUserIdForAdminQuery = (req) => {
  const requested = req.query.userId || req.body?.userId;
  if (!requested || requested === req.user.id) return req.user.id;
  if (!isAdmin(req.user)) {
    throw new AppError('Administrator access required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  return requested;
};

export const getWallet = async (req, res) => {
  const targetUserId = targetUserIdForAdminQuery(req);
  let wallet = await walletModel.findByUserId(targetUserId);
  if (!wallet) wallet = await walletModel.createOrUpdate(targetUserId);
  res.json({ success: true, data: { wallet } });
};

export const listWalletTransactions = async (req, res) => {
  const targetUserId = targetUserIdForAdminQuery(req);
  const page = positiveInt(req.query.page, 1);
  const limit = positiveInt(req.query.limit, 20);
  const wallet = await walletModel.findByUserId(targetUserId);
  if (!wallet) {
    return res.json({ success: true, data: { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
  }
  const result = await (await import('../models/subscription.model.js')).walletTransactionModel.listByWallet(wallet.id, { page, limit });
  res.json({ success: true, data: result });
};

export const fundWalletForUser = async (req, res) => {
  const { userId, amount } = req.body;
  const numericAmount = Number(amount);
  if (!userId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('A valid userId and positive amount are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  let wallet = await walletModel.findByUserId(userId);
  if (!wallet) wallet = await walletModel.createOrUpdate(userId);
  if (!wallet) notFound('Wallet');
  const transaction = await creditWalletBalance(userId, numericAmount, `Administrative wallet credit by ${req.user.id}`, generateReference());
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Wallet credited', data: transaction });
};
