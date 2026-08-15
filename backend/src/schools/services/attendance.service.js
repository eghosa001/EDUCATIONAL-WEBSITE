import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const attendanceService = {
  async list(schoolId, filters = {}) {
    const { classId, startDate, endDate, studentId, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['a.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (classId) {
      conditions.push(`a.class_id = $${idx++}`);
      values.push(classId);
    }
    if (studentId) {
      conditions.push(`a.student_id = $${idx++}`);
      values.push(studentId);
    }
    if (startDate) {
      conditions.push(`a.date >= $${idx++}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`a.date <= $${idx++}`);
      values.push(endDate);
    }

    const where = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      query(
        `SELECT a.*, 
                u.first_name, u.last_name, u.email,
                c.name AS class_name, c.code AS class_code
         FROM attendance a
         JOIN users u ON a.student_id = u.id
         LEFT JOIN classes c ON a.class_id = c.id
         WHERE ${where}
         ORDER BY a.date DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM attendance a WHERE ${where}`, values),
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

  async getStats(schoolId, classId, startDate, endDate) {
    const conditions = ['a.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (classId) {
      conditions.push(`a.class_id = $${idx++}`);
      values.push(classId);
    }
    if (startDate) {
      conditions.push(`a.date >= $${idx++}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`a.date <= $${idx++}`);
      values.push(endDate);
    }

    const where = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present')::int AS present_count,
        COUNT(*) FILTER (WHERE status = 'absent')::int AS absent_count,
        COUNT(*) FILTER (WHERE status = 'late')::int AS late_count,
        COUNT(*) FILTER (WHERE status = 'excused')::int AS excused_count,
        COUNT(*)::int AS total
       FROM attendance a WHERE ${where}`,
      values
    );

    return result.rows[0] || {};
  },

  async markAttendance(data) {
    const { schoolId, studentId, classId, date, status, notes } = data;

    const result = await query(
      `INSERT INTO attendance (school_id, student_id, class_id, date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (school_id, student_id, date)
       DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [schoolId, studentId, classId || null, date, status, notes || null]
    );
    return result.rows[0];
  },

  async bulkMarkAttendance(schoolId, records) {
    const results = [];
    for (const record of records) {
      try {
        const result = await this.markAttendance({
          schoolId,
          studentId: record.studentId,
          classId: record.classId,
          date: record.date,
          status: record.status,
          notes: record.notes,
        });
        results.push(result);
      } catch (err) {
        results.push({ studentId: record.studentId, error: err.message });
      }
    }
    return results;
  },
};

export default attendanceService;
