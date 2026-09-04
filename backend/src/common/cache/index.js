import { createClient } from 'redis';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    const url = process.env.REDIS_URL
      || `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}/${process.env.REDIS_DB || '0'}`;

    redisClient = createClient({ url, socket: { reconnectStrategy: () => 1000 } });
    redisClient.on('error', (err) => console.error('[Redis] Connection error:', err.message));
    redisClient.on('connect', () => console.log('[Redis] Connected'));
    redisClient.connect().catch((err) => console.error('[Redis] Failed to connect:', err.message));
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
