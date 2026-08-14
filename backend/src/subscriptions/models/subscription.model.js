import { query, getClient } from '../../common/database/index.js';
import { SUBSCRIPTION_STATUS } from '../../common/constants/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { generateReference } from '../../common/utils/transaction.js';

export const subscriptionPlanModel = {
  async findById(id) {
    const result = await query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await query('SELECT * FROM subscription_plans WHERE code = $1', [code]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      name, code, description, price, currency, billingCycle,
      durationDays, trialDays, features, limits, isActive, displayOrder,
    } = data;
    const result = await query(
      `INSERT INTO subscription_plans (
        name, code, description, price, currency, billing_cycle,
        duration_days, trial_days, features, limits, is_active, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [name, code, description, price, currency, billingCycle, durationDays, trialDays,
       JSON.stringify(features), JSON.stringify(limits), isActive, displayOrder]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { name, description, price, billingCycle, durationDays, features, limits, isActive, displayOrder } = data;
    const result = await query(
      `UPDATE subscription_plans SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        billing_cycle = COALESCE($5, billing_cycle),
        duration_days = COALESCE($6, duration_days),
        features = COALESCE($7, features),
        limits = COALESCE($8, limits),
        is_active = COALESCE($9, is_active),
        display_order = COALESCE($10, display_order),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, name, description, price, billingCycle, durationDays,
       features ? JSON.stringify(features) : null,
       limits ? JSON.stringify(limits) : null, isActive, displayOrder]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, isActive } = {}) {
    const conditions = [];
    const values = [];

    if (isActive !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(isActive);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM subscription_plans ${whereClause} ORDER BY display_order ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM subscription_plans ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async getAllActive() {
    const result = await query(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    return result.rows;
  },
};

export const subscriptionModel = {
  async findById(id) {
    const result = await query(
      `SELECT s.*, sp.name as plan_name, sp.code as plan_code, sp.price, sp.billing_cycle, sp.features, sp.limits
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await query(
      `SELECT s.*, sp.name as plan_name, sp.code as plan_code, sp.price, sp.billing_cycle, sp.features, sp.limits
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = $2
       ORDER BY s.created_at DESC LIMIT 1`,
      [userId, SUBSCRIPTION_STATUS.ACTIVE]
    );
    return result.rows[0] || null;
  },

  async findByGatewaySubscriptionId(gatewaySubscriptionId) {
    const result = await query(
      'SELECT * FROM subscriptions WHERE gateway_subscription_id = $1',
      [gatewaySubscriptionId]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { userId, planId, gatewaySubscriptionId, gateway, status, currentPeriodStart, currentPeriodEnd } = data;
    const result = await query(
      `INSERT INTO subscriptions (
        user_id, plan_id, gateway_subscription_id, gateway, status,
        current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, planId, gatewaySubscriptionId, gateway, status, currentPeriodStart, currentPeriodEnd]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { status, cancelAtPeriodEnd, canceledAt, cancellationReason, endedAt } = data;
    const result = await query(
      `UPDATE subscriptions SET
        status = COALESCE($2, status),
        cancel_at_period_end = COALESCE($3, cancel_at_period_end),
        canceled_at = COALESCE($4, canceled_at),
        cancellation_reason = COALESCE($5, cancellation_reason),
        ended_at = COALESCE($6, ended_at),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, status, cancelAtPeriodEnd, canceledAt, cancellationReason, endedAt]
    );
    return result.rows[0] || null;
  },

  async deactivateExpiredSubscriptions() {
    const now = new Date();
    const result = await query(
      `UPDATE subscriptions SET status = $2, ended_at = NOW()
       WHERE status = $3 AND current_period_end < $1
       RETURNING id, user_id, plan_id`,
      [now, SUBSCRIPTION_STATUS.EXPIRED, SUBSCRIPTION_STATUS.ACTIVE]
    );
    return result.rows;
  },
};

export const invoiceModel = {
  async findById(id) {
    const result = await query(
      `SELECT i.*, u.email, u.first_name, u.last_name
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByInvoiceNumber(invoiceNumber) {
    const result = await query('SELECT * FROM invoices WHERE invoice_number = $1', [invoiceNumber]);
    return result.rows[0] || null;
  },

  async findByUser(userId, { page = 1, limit = 20, status } = {}) {
    const conditions = ['user_id = $1'];
    const values = [userId];

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT i.*, sp.name as plan_name, sp.code as plan_code
       FROM invoices i
       LEFT JOIN subscription_plans sp ON i.subscription_id = sp.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM invoices ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async create(data) {
    const {
      invoiceNumber, userId, subscriptionId, paymentId, amount, currency,
      taxAmount, discountAmount, status, dueDate,
    } = data;
    const result = await query(
      `INSERT INTO invoices (
        invoice_number, user_id, subscription_id, payment_id, amount, currency,
        tax_amount, discount_amount, status, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [invoiceNumber, userId, subscriptionId, paymentId, amount, currency,
       taxAmount, discountAmount, status, dueDate]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { status, paidAt, metadata } = data;
    const result = await query(
      `UPDATE invoices SET
        status = COALESCE($2, status),
        paid_at = COALESCE($3, paid_at),
        metadata = COALESCE($4, metadata),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, status, paidAt, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0] || null;
  },

  async generateInvoiceNumber() {
    const date = new Date();
    const prefix = 'INV';
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  },
};

export const walletModel = {
  async findByUserId(userId) {
    const result = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async createOrUpdate(userId) {
    const result = await query(
      `INSERT INTO wallets (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    if (result.rows.length > 0) return result.rows[0];

    const existing = await this.findByUserId(userId);
    return existing;
  },

  async updateBalance(walletId, newBalance) {
    const result = await query(
      `UPDATE wallets SET balance = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [walletId, newBalance]
    );
    return result.rows[0] || null;
  },
};

export const walletTransactionModel = {
  async create(data) {
    const { walletId, userId, type, amount, balanceBefore, balanceAfter, reference, description, metadata } = data;
    const result = await query(
      `INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [walletId, userId, type, amount, balanceBefore, balanceAfter, reference, description,
       metadata ? JSON.stringify(metadata) : '{}']
    );
    return result.rows[0];
  },

  async listByWallet(walletId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM wallet_transactions WHERE wallet_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM wallet_transactions WHERE wallet_id = $1',
      [walletId]
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: countResult.rows[0].total, totalPages: Math.ceil(countResult.rows[0].total / limit) },
    };
  },
};

export const paymentMethodModel = {
  async findById(id) {
    const result = await query('SELECT * FROM payment_methods WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [userId]
    );
    return result.rows;
  },

  async create(data) {
    const { userId, gateway, gatewayToken, type, lastFour, expiryMonth, expiryYear, isDefault, metadata } = data;

    if (isDefault) {
      await query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const result = await query(
      `INSERT INTO payment_methods (
        user_id, gateway, gateway_token, type, last_four, expiry_month, expiry_year, is_default, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, gateway, gatewayToken, type, lastFour, expiryMonth, expiryYear, isDefault,
       metadata ? JSON.stringify(metadata) : '{}']
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM payment_methods WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export const couponModel = {
  async findById(id) {
    const result = await query('SELECT * FROM coupons WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase()]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      code, name, description, discountType, discountValue, maxDiscountAmount,
      minPurchaseAmount, usageLimit, validFrom, validUntil, applicablePlans,
      isSingleUse, isActive, createdBy,
    } = data;
    const result = await query(
      `INSERT INTO coupons (
        code, name, description, discount_type, discount_value, max_discount_amount,
        min_purchase_amount, usage_limit, valid_from, valid_until, applicable_plans,
        is_single_use, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [code, name, description, discountType, discountValue, maxDiscountAmount,
       minPurchaseAmount, usageLimit, validFrom, validUntil,
       applicablePlans ? JSON.stringify(applicablePlans) : '[]',
       isSingleUse, isActive, createdBy]
    );
    return result.rows[0];
  },

  async list({ page = 1, limit = 20, isActive } = {}) {
    const conditions = [];
    const values = [];

    if (isActive !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(isActive);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM coupons ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM coupons ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async incrementUsage(couponId) {
    await query(
      'UPDATE coupons SET times_used = times_used + 1 WHERE id = $1',
      [couponId]
    );
  },
};

export const couponUsageModel = {
  async create(data) {
    const { couponId, userId, paymentId, discountApplied } = data;
    const result = await query(
      `INSERT INTO coupon_usages (coupon_id, user_id, payment_id, discount_applied)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [couponId, userId, paymentId, discountApplied]
    );
    return result.rows[0];
  },

  async hasUserUsedCoupon(userId, couponId) {
    const result = await query(
      'SELECT 1 FROM coupon_usages WHERE user_id = $1 AND coupon_id = $2 LIMIT 1',
      [userId, couponId]
    );
    return result.rows.length > 0;
  },
};

export default {
  subscriptionPlanModel,
  subscriptionModel,
  invoiceModel,
  walletModel,
  walletTransactionModel,
  paymentMethodModel,
  couponModel,
  couponUsageModel,
};
