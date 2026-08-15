import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const timetableService = {
  async list(schoolId, filters = {}) {
    const { classId, dayOfWeek, termId, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['t.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (classId) {
      conditions.push(`t.class_id = $${idx++}`);
      values.push(classId);
    }
    if (dayOfWeek) {
      conditions.push(`t.day_of_week = $${idx++}`);
      values.push(dayOfWeek);
    }
    if (termId) {
      conditions.push(`t.term_id = $${idx++}`);
      values.push(termId);
    }

    const where = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      query(
        `SELECT t.*, 
                c.name AS class_name, c.code AS class_code,
                s.name AS subject_name, s.code AS subject_code,
                u.first_name, u.last_name
         FROM timetables t
         LEFT JOIN classes c ON t.class_id = c.id
         LEFT JOIN subjects s ON t.subject_id = s.id
         LEFT JOIN users u ON t.teacher_id = u.id
         WHERE ${where}
         ORDER BY 
           CASE t.day_of_week 
             WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 
             WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 
           END,
           t.start_time
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM timetables t WHERE ${where}`, values),
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

  async create(data) {
    const result = await query(
      `INSERT INTO timetables (school_id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, academic_year, term_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.schoolId, data.classId, data.subjectId || null, data.teacherId || null,
        data.dayOfWeek, data.startTime, data.endTime, data.room || null,
        data.academicYear, data.termId || null,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const checks = ['class_id', 'subject_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time', 'room', 'academic_year', 'term_id', 'is_active'];
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
      `UPDATE timetables SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM timetables WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },
};

export default timetableService;
