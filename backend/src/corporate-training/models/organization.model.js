import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const organizationModel = {
  async findById(id) {
    const result = await query('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM organizations WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, search, status } = params;
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR contact_email ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM organizations ${whereSql} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) as total FROM organizations ${whereSql}`, values);

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
    const { name, slug, description, logoUrl, website, contactEmail, contactPhone, address, status } = data;
    const result = await query(
      `INSERT INTO organizations (name, slug, description, logo_url, website, contact_email, contact_phone, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, slug, description, logoUrl, website, contactEmail, contactPhone, address, status]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['name', 'slug', 'description', 'logo_url', 'website', 'contact_email', 'contact_phone', 'address', 'status'];
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
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM organizations WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async getOrganizationStats(organizationId) {
    const [trainingsResult, membersResult, spendResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM corporate_trainings WHERE organization_id = $1', [organizationId]),
      query('SELECT COUNT(DISTINCT user_id) as total FROM corporate_training_enrollments WHERE organization_id = $1', [organizationId]),
      query("SELECT COALESCE(SUM(ct.price * cte.count), 0) as total FROM corporate_trainings ct JOIN LATERAL (SELECT COUNT(*) as count FROM corporate_training_enrollments cte WHERE cte.training_id = ct.id AND cte.status = 'active') cte ON true WHERE ct.organization_id = $1", [organizationId]),
    ]);

    return {
      totalTrainings: parseInt(trainingsResult.rows[0]?.total || 0),
      totalMembers: parseInt(membersResult.rows[0]?.total || 0),
      estimatedSpend: parseFloat(spendResult.rows[0]?.total || 0),
    };
  },
};
