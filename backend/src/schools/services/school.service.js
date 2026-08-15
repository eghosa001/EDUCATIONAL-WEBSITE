import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (msg) => {
  throw new AppError(msg, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const schoolService = {
  async list(filters = {}) {
    const { page = 1, limit = 20, search } = filters;
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR code ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [result, countResult] = await Promise.all([
      query(
        `SELECT s.*,
                (SELECT COUNT(*) FROM school_students ss WHERE ss.school_id = s.id) AS student_count,
                (SELECT COUNT(*) FROM school_teachers st WHERE st.school_id = s.id) AS teacher_count
         FROM schools s ${where}
         ORDER BY s.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM schools s ${where}`,
        values
      ),
    ]);
    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0]?.total || 0), totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limit) },
    };
  },

  async getById(id) {
    const result = await query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM school_students ss WHERE ss.school_id = s.id) AS student_count,
              (SELECT COUNT(*) FROM school_teachers st WHERE st.school_id = s.id) AS teacher_count
       FROM schools s WHERE s.id = $1`,
      [id]
    );
    if (!result.rows[0]) notFound('School');
    return result.rows[0];
  },

  async create(data) {
    const result = await query(
      `INSERT INTO schools (name, code, email, phone, address, state, lga, type, logo_url, admin_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING *`,
      [
        data.name, data.code, data.email || null, data.phone || null,
        data.address || null, data.state || null, data.lga || null,
        data.type || null, data.logoUrl || null, data.adminId || null,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const checks = ['name', 'code', 'email', 'phone', 'address', 'state', 'lga', 'type', 'logoUrl', 'status'];
    for (const key of checks) {
      const dbKey = key === 'logoUrl' ? 'logo_url' : key;
      if (data[key] !== undefined) {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await query(
      `UPDATE schools SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM schools WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async joinSchool(schoolCode, userId) {
    const school = await query('SELECT id FROM schools WHERE code = $1', [schoolCode]);
    if (!school.rows[0]) throw new AppError('School not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    // Check if already a member
    const existing = await query(
      'SELECT id FROM school_students WHERE school_id = $1 AND student_id = $2',
      [school.rows[0].id, userId]
    );
    if (existing.rows[0]) throw new AppError('Already a member of this school', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);

    return query(
      `INSERT INTO school_students (school_id, student_id, status) VALUES ($1, $2, 'active') RETURNING *`,
      [school.rows[0].id, userId]
    );
  },
};

export default schoolService;
