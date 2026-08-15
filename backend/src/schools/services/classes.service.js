import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (msg) => {
  throw new AppError(msg, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const classesService = {
  async list(schoolId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      query(
        `SELECT sc.*, c.name AS class_name, c.code AS class_code, t.first_name || ' ' || t.last_name AS teacher_name
         FROM school_classes sc
         LEFT JOIN classes c ON sc.class_id = c.id
         LEFT JOIN users t ON sc.teacher_id = t.id
         WHERE sc.school_id = $1
         ORDER BY sc.created_at DESC
         LIMIT $2 OFFSET $3`,
        [schoolId, limit, offset]
      ),
      query(
        'SELECT COUNT(*)::int AS total FROM school_classes WHERE school_id = $1',
        [schoolId]
      ),
    ]);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limit),
      },
    };
  },

  async create(schoolId, data) {
    const { classId, teacherId, capacity, termId, academicYear } = data;
    const result = await query(
      `INSERT INTO school_classes (school_id, class_id, teacher_id, capacity, term_id, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [schoolId, classId, teacherId || null, capacity || null, termId || null, academicYear]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const checks = ['teacher_id', 'capacity', 'term_id', 'academic_year', 'status'];
    for (const key of checks) {
      const val = data[key];
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await query(
      `UPDATE school_classes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM school_classes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  async getStudentsByClass(schoolId, classId) {
    const result = await query(
      `SELECT us.*, u.first_name, u.last_name, u.email
       FROM school_students us
       JOIN users u ON us.student_id = u.id
       WHERE us.school_id = $1 AND us.class_id = $2 AND us.status = 'active'
       ORDER BY u.last_name, u.first_name`,
      [schoolId, classId]
    );
    return result.rows;
  },
};

export default classesService;
