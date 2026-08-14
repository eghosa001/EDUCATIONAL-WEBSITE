import { query } from '../../common/database/index.js';
import { PAYMENT_STATUS } from '../../common/constants/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const generateReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `EDU-${timestamp}-${random}`;
};

export const paymentModel = {
  async findById(id) {
    const result = await query(
      `SELECT p.*, u.email, u.first_name, u.last_name
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByReference(reference) {
    const result = await query('SELECT * FROM payments WHERE reference = $1', [reference]);
    return result.rows[0] || null;
  },

  async findByGatewayReference(gatewayReference) {
    const result = await query(
      'SELECT * FROM payments WHERE gateway_reference = $1',
      [gatewayReference]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      reference, userId, amount, currency, gateway, gatewayReference,
      status, purpose, purposeId, metadata,
    } = data;
    const result = await query(
      `INSERT INTO payments (
        reference, user_id, amount, currency, gateway, gateway_reference,
        status, purpose, purpose_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [reference, userId, amount, currency, gateway, gatewayReference,
       status, purpose, purposeId, JSON.stringify(metadata || {})]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { status, gatewayReference, paidAt, failureReason, metadata } = data;
    const result = await query(
      `UPDATE payments SET
        status = COALESCE($2, status),
        gateway_reference = COALESCE($3, gateway_reference),
        paid_at = COALESCE($4, paid_at),
        failure_reason = COALESCE($5, failure_reason),
        metadata = COALESCE($6, metadata),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, status, gatewayReference, paidAt, failureReason,
       metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, userId, status, startDate, endDate } = {}) {
    const conditions = [];
    const values = [];

    if (userId) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(userId);
    }
    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (startDate) {
      conditions.push(`created_at >= $${values.length + 1}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`created_at <= $${values.length + 1}`);
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT p.*, u.email, u.first_name, u.last_name
       FROM payments p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM payments ${whereClause}`,
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

  async getStats(userId) {
    const conditions = userId ? 'WHERE user_id = $1' : '';
    const values = userId ? [userId] : [];

    const totalResult = await query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(amount), 0) AS total_amount
       FROM payments ${conditions}`,
      values
    );

    const completedResult = await query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(amount), 0) AS total_amount
       FROM payments ${conditions} AND status = $${values.length + 1}`,
      [...values, PAYMENT_STATUS.COMPLETED]
    );

    return {
      total: totalResult.rows[0],
      completed: completedResult.rows[0],
    };
  },
};

export default {
  paymentModel,
  generateReference,
};
