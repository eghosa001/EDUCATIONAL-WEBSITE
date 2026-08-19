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
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: certificate, message: 'Certificate generated' });
};

export const downloadCertificate = async (req, res) => {
  const certificate = await certificateService.getCertificate(req.params.certificateId);
  // Return metadata — actual PDF would be streamed via storage service in production
  res.json({ success: true, data: { ...certificate, downloadUrl: `/certificates/${certificate.certificate_id}.pdf` } });
};

export const verifyCertificate = async (req, res) => {
  const certificate = await certificateService.verifyCertificate(req.params.certificateId);
  if (!certificate) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Certificate not found' });
  }
  res.json({ success: true, data: { verified: true, ...certificate } });
};