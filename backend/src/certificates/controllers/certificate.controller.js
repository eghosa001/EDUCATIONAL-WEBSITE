import { certificateService } from '../services/certificate.service.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

export const getMyCertificates = async (req, res) => {
  const certificates = await certificateService.getUserCertificates(req.user.id);
  res.json({ success: true, data: certificates });
};

export const getCertificate = async (req, res) => {
  const certificate = await certificateService.getCertificate(req.params.certificateId);
  res.json({ success: true, data: certificate });
};

export const generateCertificate = async (req, res) => {
  const { courseId } = req.params;
  const certificate = await certificateService.generate(courseId, req.user.id);
  const { pdfBuffer: _pdfBuffer, ...metadata } = certificate;
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: metadata,
    message: 'Certificate generated',
  });
};

export const downloadCertificate = async (req, res) => {
  const certificate = await certificateService.getCertificate(req.params.certificateId);
  const pdf = certificateService.generatePDF(certificate, certificate);
  const safeId = String(certificate.certificate_id || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="THE-GUIDE-${safeId}.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(Buffer.from(pdf));
};

export const verifyCertificate = async (req, res) => {
  const certificate = await certificateService.verifyCertificate(req.params.certificateId);
  if (!certificate) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Certificate not found' });
  }
  res.json({ success: true, data: { verified: true, ...certificate } });
};
