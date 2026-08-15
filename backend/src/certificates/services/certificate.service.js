import { query, transaction } from '../../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../../common/errors/index.js';
import { generateReference } from '../../payments/models/payment.model.js';

const notFound = (msg) => {
  throw new AppError(msg, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const certificateService = {
  async generate(courseId, studentId) {
    const result = await query(
      `SELECT sc.*, c.title, c.slug, c.thumbnail_url, c.teacher_id,
              u.first_name, u.last_name, u.email
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       JOIN users u ON u.id = sc.student_id
       WHERE sc.course_id = $1 AND sc.student_id = $2 AND sc.completed_at IS NOT NULL`,
      [courseId, studentId]
    );

    if (!result.rows[0]) {
      throw new AppError('Course not completed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const row = result.rows[0];
    const certificateId = generateReference().replace(/-/g, '').slice(0, 16).toUpperCase();
    const issuedAt = new Date().toISOString();

    const certResult = await query(
      `INSERT INTO certificates (student_id, course_id, certificate_id, issued_at, student_name, course_title)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, course_id) DO UPDATE SET certificate_id = EXCLUDED.certificate_id, issued_at = EXCLUDED.issued_at
       RETURNING *`,
      [studentId, courseId, certificateId, issuedAt, `${row.first_name} ${row.last_name}`, row.title]
    );

    await query(
      `UPDATE student_courses SET certificate_url = $1, certificate_issued_at = $2 WHERE student_id = $3 AND course_id = $4`,
      [`/certificates/${certificateId}`, issuedAt, studentId, courseId]
    );

    return certResult.rows[0];
  },

  async getCertificate(certificateId) {
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, u.email,
              cour.title AS course_title, cour.slug AS course_slug
       FROM certificates c
       JOIN users u ON u.id = c.student_id
       JOIN courses cour ON cour.id = c.course_id
       WHERE c.certificate_id = $1`,
      [certificateId]
    );
    if (!result.rows[0]) notFound('Certificate');
    return result.rows[0];
  },

  async getUserCertificates(userId) {
    const result = await query(
      `SELECT c.*, cour.title AS course_title, cour.slug AS course_slug,
              cour.thumbnail_url, cour.total_duration_hours
       FROM certificates c
       JOIN courses cour ON cour.id = c.course_id
       WHERE c.student_id = $1
       ORDER BY c.issued_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

export default certificateService;
