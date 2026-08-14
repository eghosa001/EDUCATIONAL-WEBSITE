import { query } from '../../common/database/index.js';

export const auditLogService = {
  async logAction({ userId, action, resourceType, resourceId, changes, req }) {
    const result = await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        changes || null,
        req?.ip || null,
        req?.get?.('user-agent') || null,
        req?.body?.metadata || {},
      ]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, action, resourceType, userId } = {}) {
    const conditions = [];
    const values = [];

    if (action) {
      conditions.push(`action = $${values.length + 1}`);
      values.push(action);
    }
    if (resourceType) {
      conditions.push(`resource_type = $${values.length + 1}`);
      values.push(resourceType);
    }
    if (userId) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`,
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

  async getByResource(resourceType, resourceId) {
    const result = await query(
      `SELECT * FROM audit_logs WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at DESC`,
      [resourceType, resourceId]
    );
    return result.rows;
  },
};

export default auditLogService;
