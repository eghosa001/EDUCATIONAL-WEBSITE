import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const marketplaceOrderModel = {
  async findById(id) {
    const result = await query(
      `SELECT o.*, p.title AS product_title, p.slug AS product_slug, p.file_url,
              u.first_name AS buyer_name, u.email AS buyer_email
       FROM marketplace_orders o
       JOIN marketplace_products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, buyerId, sellerId, status, productId } = params;
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (buyerId) { whereClauses.push(`o.buyer_id = $${paramIndex}`); values.push(buyerId); paramIndex++; }
    if (sellerId) { whereClauses.push(`o.seller_id = $${paramIndex}`); values.push(sellerId); paramIndex++; }
    if (status) { whereClauses.push(`o.status = $${paramIndex}`); values.push(status); paramIndex++; }
    if (productId) { whereClauses.push(`o.product_id = $${paramIndex}`); values.push(productId); paramIndex++; }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT o.*, p.title AS product_title, p.slug AS product_slug,
              u.first_name AS buyer_name, u.email AS buyer_email
       FROM marketplace_orders o
       JOIN marketplace_products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM marketplace_orders o ${whereSql}`,
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
    const { buyerId, sellerId, productId, amount, currency, paymentReference, status } = data;
    const result = await query(
      `INSERT INTO marketplace_orders (buyer_id, seller_id, product_id, amount, currency, payment_reference, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [buyerId, sellerId, productId, amount, currency, paymentReference, status]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await query(
      'UPDATE marketplace_orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async getBuyerOrders(buyerId, params = {}) {
    return this.list({ ...params, buyerId });
  },

  async getSellerOrders(sellerId, params = {}) {
    return this.list({ ...params, sellerId });
  },

  async getStats(sellerId) {
    const [totalResult, completedResult, revenueResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM marketplace_orders WHERE seller_id = $1', [sellerId]),
      query('SELECT COUNT(*) as total FROM marketplace_orders WHERE seller_id = $1 AND status = \'completed\'', [sellerId]),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM marketplace_orders WHERE seller_id = $1 AND status = \'completed\'', [sellerId]),
    ]);
    return {
      totalOrders: parseInt(totalResult.rows[0]?.total || 0),
      completedOrders: parseInt(completedResult.rows[0]?.total || 0),
      totalRevenue: parseFloat(revenueResult.rows[0]?.total || 0),
    };
  },
};
