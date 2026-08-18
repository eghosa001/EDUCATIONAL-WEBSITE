import { documentService } from '../services/document.service.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listDocuments = async (req, res) => {
  const { page, limit, bucket, category, examBoard, examYear, subject, educationLevel, isFree, search } = req.query;

  const result = await documentService.listDocuments({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    bucket, category, examBoard, examYear,
    subject, educationLevel, isFree, search,
  });

  res.json({ success: true, data: result.data, pagination: result.pagination });
};

export const getDocument = async (req, res) => {
  const doc = await documentService.getDocument(req.params.id);
  if (!doc) notFound('Document');
  res.json({ success: true, data: { document: doc } });
};

export const getDocumentDownload = async (req, res) => {
  const doc = await documentService.getDocumentUrl(req.params.id);
  if (!doc) notFound('Document');
  res.json({ success: true, data: { document: doc } });
};

export const getDocumentBuckets = async (req, res) => {
  const buckets = await documentService.getBuckets();
  res.json({ success: true, data: { buckets } });
};

export const getDocumentSubjects = async (req, res) => {
  const subjects = await documentService.getSubjects(req.query.bucket);
  res.json({ success: true, data: { subjects } });
};

export const getDocumentYears = async (req, res) => {
  const years = await documentService.getYears(req.query.bucket);
  res.json({ success: true, data: { years } });
};

export const searchDocuments = async (req, res) => {
  const { q, bucket, category, subject } = req.query;
  if (!q) {
    throw new AppError('Search query required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  const result = await documentService.searchDocuments(q, { bucket, category, subject });
  res.json({ success: true, data: result.data, pagination: result.pagination });
};
