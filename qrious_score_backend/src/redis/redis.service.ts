import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      db: 0,
    });

    this.redis.on('connect', () => {});

    this.redis.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      if (ttlSeconds) {
        const result = await this.redis.set(key, value, 'EX', ttlSeconds);
      } else {
        const result = await this.redis.set(key, value);
      }
    } catch (err) {
      console.error('Redis set ERROR:', err);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async increment(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
