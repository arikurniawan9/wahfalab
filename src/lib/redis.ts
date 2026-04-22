import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Prevent multiple connections in Next.js development mode
export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection retries exhausted. Disabling Redis.');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 1000);
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('error', (err) => {
  // Suppress errors if Redis is not running in local development
  // to prevent the app from crashing.
  if (process.env.NODE_ENV !== 'production') {
    // Only log once initially, then keep quiet to not flood console
    if (!globalForRedis.redis.status || globalForRedis.redis.status === 'wait') {
      // quiet
    }
  } else {
    console.error('[Redis] Error:', err);
  }
});
