import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../../common/config/index.js';
import { AppError, FileUploadError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const EXTENSION_MIME_MAP = Object.fromEntries(
  config.fileUpload.allowedExtensions.map((ext, i) => [ext, config.fileUpload.allowedMimeTypes[i]])
);

const getUploadDir = () => {
  const dir = path.resolve(process.cwd(), config.storage.local.uploadDir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const sanitizeFilename = (fileName) => {
  const base = String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  return base || 'file';
};

const generateKey = (folder, fileName) => {
  const safeFolder = String(folder || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '_');
  return [safeFolder, `${randomUUID()}-${sanitizeFilename(fileName)}`].filter(Boolean).join('/');
};

const resolveFilePath = (key) => {
  const cleanKey = String(key || '').replace(/^\/+/, '');
  if (!cleanKey) {
    throw new AppError('Invalid file key', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  const dir = getUploadDir();
  const filePath = path.resolve(dir, cleanKey);
  const prefix = `${path.resolve(dir)}${path.sep}`;
  if (!filePath.startsWith(prefix)) {
    throw new FileUploadError('Invalid file key');
  }
  return filePath;
};

const getMimeType = (fileName) => {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  return EXTENSION_MIME_MAP[ext] || 'application/octet-stream';
};

export const storageService = {
  async upload(buffer, { fileName, mimeType, folder }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new FileUploadError('Uploaded file data is empty');
    }
    if (buffer.length > config.fileUpload.maxFileSize) {
      throw new FileUploadError(`File exceeds maximum size of ${config.fileUpload.maxFileSize} bytes`);
    }
    if (!config.fileUpload.allowedMimeTypes.includes(mimeType)) {
      throw new FileUploadError('File type not allowed');
    }

    const minioResult = await this.uploadToMinio(buffer, { fileName, mimeType, folder });
    if (minioResult) {
      return minioResult;
    }

    return this.uploadToLocal(buffer, { fileName, mimeType, folder });
  },

  uploadToLocal(buffer, { fileName, mimeType, folder }) {
    const key = generateKey(folder, fileName);
    const filePath = resolveFilePath(key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return {
      key,
      url: `/storage/files/${key}`,
      fileName,
      mimeType,
      size: buffer.length,
    };
  },

  async uploadToMinio(buffer, { fileName, mimeType, folder }) {
    if (config.storage.provider !== 'minio') {
      return null;
    }
    try {
      const module = await import('minio');
      const Client = module?.default?.Client || module?.Client;
      if (!Client) {
        return null;
      }
      const client = new Client({
        endPoint: config.storage.minio.endPoint,
        port: config.storage.minio.port,
        useSSL: config.storage.minio.useSSL,
        accessKey: config.storage.minio.accessKey,
        secretKey: config.storage.minio.secretKey,
      });
      const key = generateKey(folder, fileName);
      const bucket = config.storage.minio.bucket;
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        await client.makeBucket(bucket);
      }
      await client.putObject(bucket, key, buffer, { 'Content-Type': mimeType });
      return {
        key,
        url: `/storage/files/${key}`,
        fileName,
        mimeType,
        size: buffer.length,
      };
    } catch {
      return null;
    }
  },

  resolve(key) {
    const filePath = resolveFilePath(key);
    let size = 0;
    try {
      size = fs.statSync(filePath).size;
    } catch {
      size = 0;
    }
    return { path: filePath, mimeType: getMimeType(key), size };
  },

  async delete(key) {
    const filePath = resolveFilePath(key);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('File not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
      throw error;
    }
    return { key };
  },
};

export default storageService;
