import fs from 'node:fs';
import { storageService } from '../services/storage.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, FileUploadError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const decodeBase64 = (dataBase64) => {
  if (typeof dataBase64 !== 'string' || dataBase64.length === 0) {
    throw new FileUploadError('dataBase64 is required for JSON uploads');
  }
  const base64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new FileUploadError('dataBase64 is not valid base64');
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    throw new FileUploadError('Uploaded file is empty');
  }
  return buffer;
};

export const uploadFile = asyncHandler(async (req, res) => {
  const { fileName, mimeType, dataBase64, folder } = req.body || {};
  const buffer = req.file?.buffer || decodeBase64(dataBase64);
  const name = fileName || req.file?.originalname || 'file';
  const mime = mimeType || req.file?.mimetype;

  const file = await storageService.upload(buffer, { fileName: name, mimeType: mime, folder });

  res.status(HTTP_STATUS.CREATED).json({ success: true, data: { file } });
});

export const deleteFile = asyncHandler(async (req, res) => {
  await storageService.delete(req.params.key);
  res.json({ success: true, message: 'File deleted' });
});

export const getFile = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const file = storageService.resolve(key);
  if (!fs.existsSync(file.path)) {
    throw new AppError('File not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  fs.createReadStream(file.path).pipe(res);
});
