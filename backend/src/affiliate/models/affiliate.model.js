import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const affiliateModel = {
  async findById(id) {
    const result = await query('SELECT * FROM affiliates WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const result = await query('SELECT * FROM affiliates WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async findByRefCode(refCode) {
    const result = await query('SELECT * FROM affiliates WHERE ref_code = $1', [refCode]);
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, search, status, minEarnings, sortBy = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;
    const allowedSorts = ['earnings', 'sales_count', 'clicks', 'created_at'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(a.ref_code ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      whereClauses.push(`a.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    if (minEarnings !== undefined) {
      whereClauses.push(`a.earnings >= $${paramIndex}`);
      values.push(minEarnings);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT a.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       ${whereSql}
       ORDER BY a.${safeSort} ${safeOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM affiliates a ${whereSql}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },

  async create(data) {
    const { userId, refCode, commissionRate, payoutThreshold, status } = data;
    const result = await query(
      `INSERT INTO affiliates (user_id, ref_code, commission_rate, payout_threshold, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, refCode, commissionRate, payoutThreshold, status]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['commission_rate', 'payout_threshold', 'status', 'payout_account'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const result = await query(
      `UPDATE affiliates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // Referral tracking
  async recordClick(data) {
    const { refCode, clickSource, userAgent, ip } = data;
    const affiliate = await this.findByRefCode(refCode);
    if (!affiliate) return null;

    const result = await query(
      `INSERT INTO affiliate_clicks (affiliate_id, ref_code, click_source, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [affiliate.id, refCode, clickSource, userAgent, ip]
    );
    return result.rows[0];
  },

  async recordConversion(data) {
    const { refCode, orderId, orderAmount, commissionAmount } = data;
    const affiliate = await this.findByRefCode(refCode);
    if (!affiliate) return null;

    const result = await query(
      `INSERT INTO affiliate_conversions (affiliate_id, ref_code, order_id, order_amount, commission_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [affiliate.id, refCode, orderId, orderAmount, commissionAmount]
    );

    // Update affiliate stats
    await query(
      `UPDATE affiliates SET
         clicks = clicks + 1,
         conversions = conversions + 1,
         earnings = earnings + $1
       WHERE id = $2`,
      [commissionAmount, affiliate.id]
    );

    return result.rows[0];
  },

  async getAffiliateStats(userId) {
    const affiliate = await this.findByUserId(userId);
    if (!affiliate) return null;

    const [clicksResult, conversionsResult, earningsResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM affiliate_clicks WHERE affiliate_id = $1', [affiliate.id]),
      query('SELECT COUNT(*) as total FROM affiliate_conversions WHERE affiliate_id = $1', [affiliate.id]),
      query('SELECT COALESCE(SUM(commission_amount), 0) as total FROM affiliate_conversions WHERE affiliate_id = $1', [affiliate.id]),
    ]);

    return {
      ...affiliate,
      totalClicks: parseInt(clicksResult.rows[0]?.total || 0),
      totalConversions: parseInt(conversionsResult.rows[0]?.total || 0),
      totalEarnings: parseFloat(earningsResult.rows[0]?.total || 0),
    };
  },

  async getPendingPayouts(userId, params = {}) {
    const affiliate = await this.findByUserId(userId);
    if (!affiliate) return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT ac.*, u.first_name, u.last_name, u.email
       FROM affiliate_conversions ac
       JOIN users u ON ac.affiliate_id = u.id
       WHERE ac.affiliate_id = $1 AND ac.payout_status = 'pending'
       ORDER BY ac.created_at DESC
       LIMIT $2 OFFSET $3`,
      [affiliate.id, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM affiliate_conversions WHERE affiliate_id = $1 AND payout_status = 'pending'`,
      [affiliate.id]
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },
};
