import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const cartModel = {
  async findById(id) {
    const result = await query(
      `SELECT c.*, p.title AS product_title, p.price AS product_price, p.slug AS product_slug
       FROM marketplace_cart c
       JOIN marketplace_products p ON c.product_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const result = await query(
      `SELECT c.*, p.title AS product_title, p.price AS product_price, p.slug AS product_slug,
              p.thumbnail_url, p.category
       FROM marketplace_cart c
       JOIN marketplace_products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    return result.rows || [];
  },

  async addItem(data) {
    const { userId, productId, quantity = 1 } = data;
    const existing = await query(
      'SELECT id, quantity FROM marketplace_cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existing.rows[0]) {
      const result = await query(
        'UPDATE marketplace_cart SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
        [quantity, existing.rows[0].id]
      );
      return result.rows[0];
    }

    const result = await query(
      `INSERT INTO marketplace_cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  },

  async updateQuantity(cartItemId, quantity) {
    if (quantity <= 0) return await this.removeItem(cartItemId);
    const result = await query(
      'UPDATE marketplace_cart SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, cartItemId]
    );
    return result.rows[0];
  },

  async removeItem(id) {
    const result = await query('DELETE FROM marketplace_cart WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async clearCart(userId) {
    await query('DELETE FROM marketplace_cart WHERE user_id = $1', [userId]);
  },

  async getCartSummary(userId) {
    const items = await this.findByUserId(userId);
    const totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
    const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.product_price || 0) * parseInt(item.quantity || 1)), 0);
    return { items, totalItems, totalPrice };
  },
};
