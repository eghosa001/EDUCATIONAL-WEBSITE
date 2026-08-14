import { query, getClient, transaction } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const mapSchool = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  type: row.type,
  email: row.email,
  phone: row.phone,
  address: row.address,
  state: row.state,
  lga: row.lga,
  website: row.website,
  logoUrl: row.logo_url,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const schoolModel = {
  async list({ page = 1, limit = 20, search, isActive } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '1=1';

    if (search) {
      whereClause += ` AND (name ILIKE $${params.length + 1} OR code ILIKE $${params.length + 1} OR state ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${params.length + 1}`;
      params.push(isActive);
    }

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT s.*, 
                (SELECT COUNT(*) FROM school_students ss WHERE ss.school_id = s.id) as student_count,
                (SELECT COUNT(*) FROM school_teachers st WHERE st.school_id = s.id) as teacher_count
         FROM schools s WHERE ${whereClause}
         ORDER BY s.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*)::int FROM schools s WHERE ${whereClause}`,
        params
      ),
    ]);

    return {
      data: (rows || []).map(mapSchool),
      pagination: { page, limit, total: countResult.rows[0].count, pages: Math.ceil(countResult.rows[0].count / limit) },
    };
  },

  async findById(id) {
    const result = await query(
      `SELECT s.*, 
              (SELECT COUNT(*)::int FROM school_students ss WHERE ss.school_id = s.id) as student_count,
              (SELECT COUNT(*)::int FROM school_teachers st WHERE st.school_id = s.id) as teacher_count
       FROM schools s WHERE s.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError('School not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return mapSchool(result.rows[0]);
  },

  async create(data) {
    const { name, code, type, email, phone, address, state, lga, website, logoUrl } = data;
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const existing = await client.query('SELECT id FROM schools WHERE code = $1 OR email = $2', [code, email]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new AppError('School code or email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
      }

      const result = await client.query(
        `INSERT INTO schools (name, code, type, email, phone, address, state, lga, website, logo_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
         RETURNING *`,
        [name, code, type, email, phone, address, state, lga, website, logoUrl]
      );

      await client.query('COMMIT');
      return mapSchool(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof AppError) throw error;
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const fields = Object.keys(data).filter(k => !['id', 'created_at', 'updated_at'].includes(k));
    if (fields.length === 0) return this.findById(id);

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => data[f])];

    const result = await query(
      `UPDATE schools SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new AppError('School not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return mapSchool(result.rows[0]);
  },

  async delete(id) {
    const result = await query('DELETE FROM schools WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) throw new AppError('School not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return { id };
  },

  async addStudent(schoolId, studentId, classId) {
    await query(
      'INSERT INTO school_students (school_id, user_id, class_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [schoolId, studentId, classId]
    );
  },

  async removeStudent(schoolId, studentId) {
    await query('DELETE FROM school_students WHERE school_id = $1 AND user_id = $2', [schoolId, studentId]);
  },
};

export default schoolModel;
