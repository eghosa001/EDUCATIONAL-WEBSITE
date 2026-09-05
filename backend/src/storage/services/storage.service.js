import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../../common/config/index.js';
import { AppError, FileUploadError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { supabase, supabaseAdmin } from '../../common/supabase/index.js';

const EXTENSION_MIME_MAP = Object.fromEntries(config.fileUpload.allowedExtensions.map((ext, i) => [ext, config.fileUpload.allowedMimeTypes[i]]));
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

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
  const safeFolder = String(folder || '').replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9._/-]/g, '_');
  return [safeFolder, `${randomUUID()}-${sanitizeFilename(fileName)}`].filter(Boolean).join('/');
};

const resolveFilePath = (key) => {
  const cleanKey = String(key || '').replace(/^\/+/, '');
  if (!cleanKey) throw new AppError('Invalid file key', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  const dir = getUploadDir();
  const filePath = path.resolve(dir, cleanKey);
  const prefix = `${path.resolve(dir)}${path.sep}`;
  if (!filePath.startsWith(prefix)) throw new FileUploadError('Invalid file key');
  return filePath;
};

const getMimeType = (fileName) => EXTENSION_MIME_MAP[path.extname(String(fileName || '')).toLowerCase()] || 'application/octet-stream';

const validateUploadType = (fileName, mimeType) => {
  if (!config.fileUpload.allowedMimeTypes.includes(mimeType)) throw new FileUploadError('File type not allowed');
  const ext = path.extname(String(fileName || '')).toLowerCase();
  if (!config.fileUpload.allowedExtensions.includes(ext)) throw new FileUploadError('File extension not allowed');
  if (EXTENSION_MIME_MAP[ext] !== mimeType) throw new FileUploadError('File extension does not match MIME type');
};

export const storageService = {
  async upload(buffer, { fileName, mimeType, folder }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new FileUploadError('Uploaded file data is empty');
    if (buffer.length > config.fileUpload.maxFileSize) throw new FileUploadError(`File exceeds maximum size of ${config.fileUpload.maxFileSize} bytes`);
    validateUploadType(fileName, mimeType);

    const key = generateKey(folder, fileName);
    if (config.storage.provider === 'supabase') {
      if (!supabaseAdmin) throw new FileUploadError('Supabase Storage is not configured');
      const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(key, buffer, { contentType: mimeType, upsert: false });
      if (error) throw new FileUploadError('Unable to store uploaded file');
      const { data: signed } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUrl(key, 3600);
      return { key, url: signed?.signedUrl || null, fileName: sanitizeFilename(fileName), mimeType, size: buffer.length, bucket: STORAGE_BUCKET };
    }

    const minioResult = await this.uploadToMinio(buffer, { key, fileName, mimeType });
    if (minioResult) return minioResult;
    return this.uploadToLocal(buffer, { key, fileName, mimeType });
  },

  uploadToLocal(buffer, { key, fileName, mimeType }) {
    const filePath = resolveFilePath(key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer, { flag: 'wx' });
    return { key, url: `/storage/files/${encodeURIComponent(key).replace(/%2F/g, '/')}`, fileName: sanitizeFilename(fileName), mimeType, size: buffer.length };
  },

  async uploadToMinio(buffer, { key, fileName, mimeType }) {
    if (config.storage.provider !== 'minio') return null;
    const { endPoint, port, useSSL, accessKey, secretKey, bucket } = config.storage.minio;
    if (!endPoint || !accessKey || !secretKey || !bucket) throw new FileUploadError('MinIO Storage is not configured');
    try {
      const module = await import('minio');
      const Client = module?.default?.Client || module?.Client;
      if (!Client) throw new Error('MinIO client unavailable');
      const client = new Client({ endPoint, port, useSSL, accessKey, secretKey });
      if (!(await client.bucketExists(bucket))) await client.makeBucket(bucket);
      await client.putObject(bucket, key, buffer, { 'Content-Type': mimeType });
      return { key, url: `/storage/files/${encodeURIComponent(key).replace(/%2F/g, '/')}`, fileName: sanitizeFilename(fileName), mimeType, size: buffer.length, bucket };
    } catch (error) {
      if (error instanceof FileUploadError) throw error;
      throw new FileUploadError('Unable to store uploaded file');
    }
  },

  resolve(key) {
    const filePath = resolveFilePath(key);
    let size = 0;
    try { size = fs.statSync(filePath).size; } catch { size = 0; }
    return { path: filePath, mimeType: getMimeType(key), size };
  },

  async delete(key) {
    const filePath = resolveFilePath(key);
    try { fs.unlinkSync(filePath); }
    catch (error) {
      if (error.code === 'ENOENT') throw new AppError('File not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      throw error;
    }
    return { key };
  },

  getSupabasePublicUrl(bucket, fileName) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data?.publicUrl || null;
  },

  async getSupabaseSignedUrl(bucket, fileName, expiresIn = 3600) {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(fileName, expiresIn);
    if (error) return null;
    return data?.signedUrl || null;
  },

  async listSupabaseBucket(bucket) {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.storage.from(bucket).list();
    if (error) return [];
    return data || [];
  },
};

export default storageService;
