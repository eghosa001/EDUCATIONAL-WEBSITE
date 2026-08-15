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
