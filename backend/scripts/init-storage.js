import { config } from '../src/common/config/index.js';

const initStorage = async () => {
  if (config.storage.provider !== 'minio') {
    console.log('Skipping MinIO bucket init (using local storage)');
    return;
  }
  try {
    const module = await import('minio');
    const Client = module?.default?.Client || module?.Client;
    if (!Client) {
      console.log('MinIO client not available, skipping bucket init');
      return;
    }
    const client = new Client({
      endPoint: config.storage.minio.endPoint,
      port: config.storage.minio.port,
      useSSL: config.storage.minio.useSSL,
      accessKey: config.storage.minio.accessKey,
      secretKey: config.storage.minio.secretKey,
    });
    const bucket = config.storage.minio.bucket;
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket);
      console.log(`Created MinIO bucket: ${bucket}`);
    } else {
      console.log(`MinIO bucket already exists: ${bucket}`);
    }
  } catch (error) {
    console.error('Failed to initialize MinIO bucket:', error.message);
  }
};

initStorage();
