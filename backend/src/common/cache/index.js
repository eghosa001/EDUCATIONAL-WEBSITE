import Redis from 'ioredis';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.REDIS_DB || '0', 10);
    redisClient = new Redis({ host, port, password, db, lazyConnect: true });
    redisClient.on('error', (err) => console.error('[Redis] Connection error:', err.message));
    redisClient.on('connect', () => console.log('[Redis] Connected'));
  }
  return redisClient;
};

export const cacheKeys = {
  courses: (filters) => {
    const suffix = filters ? Object.entries(filters).sort().map(([k, v]) => `${k}=${v}`).join('&') : 'all';
    return `courses:${suffix}`;
  },
  course: (id) => `course:${id}`,
  subjects: 'subjects:all',
  levels: 'levels:all',
  classes: 'classes:all',
  exams: (filters) => {
    const suffix = filters ? Object.entries(filters).sort().map(([k, v]) => `${k}=${v}`).join('&') : 'all';
    return `exams:${suffix}`;
  },
  flashcards: (params) => {
    const suffix = params ? Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&') : 'all';
    return `flashcards:${suffix}`;
  },
  notifications: (userId) => `notifications:${userId}`,
  user: (id) => `user:${id}`,
  analytics: (key) => `analytics:${key}`,
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
};
