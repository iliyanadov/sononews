import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL to detect TLS requirement (Upstash uses rediss://)
const getUrlConfig = () => {
  try {
    const url = new URL(redisUrl);
    const isTls = url.protocol === 'rediss:';

    return {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
      password: url.password || undefined,
      tls: isTls ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    // Fallback for simple localhost URL
    return {
      maxRetriesPerRequest: null,
    };
  }
};

export const redis = new Redis(redisUrl, getUrlConfig());

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});
