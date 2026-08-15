import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const resultsService = {
  async list(schoolId, filters = {}) {
    const { studentId, classId, subjectId, termId, academicYear, published = null, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['r.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (studentId) {
      conditions.push(`r.student_id = $${idx++}`);
      values.push(studentId);
    }
    if (classId) {
      conditions.push(`r.class_id = $${idx++}`);
      values.push(classId);
    }
    if (subjectId) {
      conditions.push(`r.subject_id = $${idx++}`);
      values.push(subjectId);
    }
    if (termId) {
      conditions.push(`r.term_id = $${idx++}`);
      values.push(termId);
    }
    if (academicYear) {
      conditions.push(`r.academic_year = $${idx++}`);
      values.push(academicYear);
    }
    if (published !== null) {
      conditions.push(`r.published = $${idx++}`);
      values.push(published);
    }

    const where = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      query(
        `SELECT r.*, 
                u.first_name, u.last_name, u.email,
                c.name AS class_name, c.code AS class_code,
                s.name AS subject_name, s.code AS subject_code,
                t.first_name || ' ' || t.last_name AS teacher_name
         FROM school_results r
         JOIN users u ON r.student_id = u.id
         LEFT JOIN classes c ON r.class_id = c.id
         LEFT JOIN subjects s ON r.subject_id = s.id
         LEFT JOIN users t ON r.teacher_id = t.id
         WHERE ${where}
         ORDER BY r.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM school_results r WHERE ${where}`, values),
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

  async getSummary(schoolId, filters = {}) {
    const conditions = ['r.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (filters.classId) {
      conditions.push(`r.class_id = $${idx++}`);
      values.push(filters.classId);
    }
    if (filters.termId) {
      conditions.push(`r.term_id = $${idx++}`);
      values.push(filters.termId);
    }
    if (filters.academicYear) {
      conditions.push(`r.academic_year = $${idx++}`);
      values.push(filters.academicYear);
    }

    const where = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        COUNT(*)::int AS total_results,
        AVG(CASE WHEN r.published THEN r.total_score END) AS avg_score,
        COUNT(CASE WHEN r.published AND r.total_score >= 50 THEN 1 END) AS passed_count,
        COUNT(CASE WHEN r.published AND r.total_score < 50 THEN 1 END) AS failed_count
       FROM school_results r WHERE ${where}`,
      values
    );

    return result.rows[0] || {};
  },

  async create(data) {
    const { schoolId, studentId, classId, subjectId, termId, academicYear, examId, courseworkScore, examScore, teacherId } = data;
    const totalScore = (parseFloat(courseworkScore) || 0) + (parseFloat(examScore) || 0);

    const result = await query(
      `INSERT INTO school_results 
        (school_id, student_id, class_id, subject_id, exam_id, term_id, academic_year, 
         coursework_score, exam_score, grade, remark, teacher_id, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        schoolId, studentId, classId || null, subjectId || null, examId || null,
        termId || null, academicYear, courseworkScore || 0, examScore || 0,
        null, null, teacherId || null, false,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const checks = ['coursework_score', 'exam_score', 'grade', 'remark', 'teacher_id', 'published', 'published_at'];
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
      `UPDATE school_results SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM school_results WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },
};

export default resultsService;
