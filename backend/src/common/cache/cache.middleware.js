import { cacheKeys, CACHE_TTL } from './index.js';

export const cache = {
  async get(key) {
    try {
      const { getRedisClient } = await import('./index.js');
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttl = CACHE_TTL.MEDIUM) {
    try {
      const { getRedisClient } = await import('./index.js');
      const client = getRedisClient();
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      // Silently fail — caching should never break the app
    }
  },

  async del(key) {
    try {
      const { getRedisClient } = await import('./index.js');
      const client = getRedisClient();
      await client.del(key);
    } catch {}
  },

  async invalidate(pattern) {
    try {
      const { getRedisClient } = await import('./index.js');
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(...keys);
    } catch {}
  },

  async getOrSet(key, fetchFn, ttl = CACHE_TTL.MEDIUM) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  },
};

export default cache;
