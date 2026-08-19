import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { generateReference } from '../../payments/models/payment.model.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    const certificate = certResult.rows[0];
    const pdfBuffer = this.generatePDF(certificate, row);

    return { ...certificate, pdfBuffer };
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

  async verifyCertificate(certificateId) {
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, cour.title AS course_title
       FROM certificates c
       JOIN users u ON u.id = c.student_id
       JOIN courses cour ON cour.id = c.course_id
       WHERE c.certificate_id = $1`,
      [certificateId]
    );
    return result.rows[0] || null;
  },

  generatePDF(certificate, userDetails) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFillColor(248, 250, 252);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'F');

    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('This is to certify that', pageWidth / 2, 42, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(29, 78, 216);
    doc.text(certificate.student_name || 'Student', pageWidth / 2, 55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139);
    doc.text('has successfully completed the course', pageWidth / 2, 68, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(certificate.course_title || 'Course', pageWidth / 2, 80, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    const completedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Completed on: ${completedDate}`, pageWidth / 2, 92, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Certificate No: ${certificate.certificate_id}`, pageWidth / 2, pageHeight - 25, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(40, pageHeight - 20, 80, pageHeight - 20);
    doc.line(pageWidth - 80, pageHeight - 20, pageWidth - 40, pageHeight - 20);
    doc.text('Signature', 60, pageHeight - 17, { align: 'center' });
    doc.text('Date', pageWidth - 60, pageHeight - 17, { align: 'center' });

    return doc.output('arraybuffer');
  },
};

export default certificateService;
