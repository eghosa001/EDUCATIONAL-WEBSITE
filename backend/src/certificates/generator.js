import { query, getClient } from '../common/database/index.js';
import { AppError } from '../common/errors/index.js';
import { HTTP_STATUS } from '../common/constants/index.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { config } from '../common/config/index.js';

export const certificateService = {
  async generateCertificate(userId, courseId, completionDate = new Date()) {
    const user = await this.getUserDetails(userId);
    const course = await this.getCourseDetails(courseId);

    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
    if (!course) throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND, 'COURSE_NOT_FOUND');

    const certificate = await this.createCertificate({
      userId,
      courseId,
      completionDate,
      certificateNumber: this.generateCertificateNumber(userId, courseId),
    });

    const pdfBuffer = await this.generatePDF(certificate, user, course, completionDate);

    await this.saveCertificate(certificate.id, pdfBuffer);

    return {
      ...certificate,
      pdfUrl: `/api/certificates/${certificate.id}/download`,
      pdfBuffer,
    };
  },

  async getUserDetails(userId) {
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async getCourseDetails(courseId) {
    const result = await query(
      `SELECT c.id, c.title, c.description, c.thumbnail, c.instructor_id,
              u.first_name as instructor_name, u.last_name as instructor_last_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1`,
      [courseId]
    );
    return result.rows[0] || null;
  },

  async createCertificate(data) {
    const result = await query(
      `INSERT INTO certificates (user_id, course_id, certificate_number, completion_date, issued_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [data.userId, data.courseId, data.certificateNumber, data.completionDate]
    );
    return result.rows[0];
  },

  async saveCertificate(certificateId, pdfBuffer) {
    await query(
      `UPDATE certificates SET pdf_path = $2 WHERE id = $1`,
      [certificateId, `certificates/${certificateId}.pdf`]
    );
  },

  async getCertificate(certificateId) {
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, cu.title as course_title
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses cu ON c.course_id = cu.id
       WHERE c.id = $1`,
      [certificateId]
    );
    return result.rows[0] || null;
  },

  async getUserCertificates(userId) {
    const result = await query(
      `SELECT c.*, cu.title as course_title, cu.thumbnail
       FROM certificates c
       JOIN courses cu ON c.course_id = cu.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async verifyCertificate(certificateNumber) {
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, cu.title as course_title
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses cu ON c.course_id = cu.id
       WHERE c.certificate_number = $1`,
      [certificateNumber]
    );
    return result.rows[0] || null;
  },

  generateCertificateNumber(userId, courseId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const userIdShort = userId.substring(0, 4).toUpperCase();
    const courseIdShort = courseId.substring(0, 4).toUpperCase();
    return `EDU-${timestamp}-${userIdShort}-${courseIdShort}`;
  },

  async generatePDF(certificate, user, course, completionDate) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

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
    doc.text(user.first_name + ' ' + user.last_name, pageWidth / 2, 55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139);
    doc.text('has successfully completed the course', pageWidth / 2, 68, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(course.title, pageWidth / 2, 80, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Instructor: ${course.instructor_name || 'Unknown'}`, pageWidth / 2, 92, { align: 'center' });

    doc.text(`Completed on: ${completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Certificate No: ${certificate.certificate_number}`, pageWidth / 2, pageHeight - 25, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(40, pageHeight - 20, 80, pageHeight - 20);
    doc.line(pageWidth - 80, pageHeight - 20, pageWidth - 40, pageHeight - 20);

    doc.text('Signature', 60, pageHeight - 17, { align: 'center' });
    doc.text('Date', pageWidth - 60, pageHeight - 17, { align: 'center' });

    return doc.output('arraybuffer');
  },
};

export default certificateService;
