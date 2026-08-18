import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

export const redisAvailable = !!REDIS_URL;

export const redis = redisAvailable
  ? new Redis(REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    })
  : null;

export const redisSub = redisAvailable
  ? new Redis(REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    })
  : null;

if (redis) {
  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });
}

if (redisSub) {
  redisSub.on('error', (err) => {
    console.error('[Redis] Subscriber connection error:', err.message);
  });
}

export const CHANNELS = {
  room: (roomId: string) => `ws:room:${roomId}`,
  userNotif: (email: string) => `ws:notif:${email}`,
  allNotif: 'ws:notif:all',
} as const;

export const KEYS = {
  roomMembers: (roomId: string) => `ws:members:${roomId}`,
} as const;
