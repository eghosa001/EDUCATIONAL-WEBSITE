import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const marketplaceModel = {
  async findById(id) {
    const result = await query(
      `SELECT p.*, s.first_name AS seller_name, s.email AS seller_email, s.avatar_url AS seller_avatar
       FROM marketplace_products p
       JOIN users s ON p.seller_id = s.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM marketplace_products WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, search, category, minPrice, maxPrice, sellerId, status, sortBy = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;
    const allowedSorts = ['price', 'created_at', 'title', 'rating', 'sales_count'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      whereClauses.push(`p.category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }
    if (minPrice !== undefined) {
      whereClauses.push(`p.price >= $${paramIndex}`);
      values.push(minPrice);
      paramIndex++;
    }
    if (maxPrice !== undefined) {
      whereClauses.push(`p.price <= $${paramIndex}`);
      values.push(maxPrice);
      paramIndex++;
    }
    if (sellerId) {
      whereClauses.push(`p.seller_id = $${paramIndex}`);
      values.push(sellerId);
      paramIndex++;
    }
    if (status) {
      whereClauses.push(`p.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT p.*, s.first_name AS seller_name, s.email AS seller_email, s.avatar_url AS seller_avatar
       FROM marketplace_products p
       JOIN users s ON p.seller_id = s.id
       ${whereSql}
       ORDER BY p.${safeSort} ${safeOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM marketplace_products p ${whereSql}`,
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
    const {
      sellerId, title, slug, description, category, price, currency,
      fileType, fileSizeBytes, fileUrl, thumbnailUrl, tags, status,
    } = data;
    const result = await query(
      `INSERT INTO marketplace_products (
        seller_id, title, slug, description, category, price, currency,
        file_type, file_size_bytes, file_url, thumbnail_url, tags, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [sellerId, title, slug, description, category, price, currency, fileType, fileSizeBytes, fileUrl, thumbnailUrl, tags, status]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['title', 'slug', 'description', 'category', 'price', 'currency',
      'file_type', 'file_size_bytes', 'file_url', 'thumbnail_url', 'tags', 'status'];
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
      `UPDATE marketplace_products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM marketplace_products WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async incrementSalesCount(productId) {
    await query('UPDATE marketplace_products SET sales_count = sales_count + 1 WHERE id = $1', [productId]);
  },

  async getStats(productId) {
    const [productResult, salesResult, revenueResult] = await Promise.all([
      this.findById(productId),
      query('SELECT COUNT(*) as total FROM marketplace_orders WHERE product_id = $1', [productId]),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM marketplace_orders WHERE product_id = $1 AND status = \'completed\'', [productId]),
    ]);

    return {
      ...productResult,
      salesCount: parseInt(salesResult.rows[0]?.total || 0),
      totalRevenue: parseFloat(revenueResult.rows[0]?.total || 0),
    };
  },
};
