import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class LoginRateLimitService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  private attemptsKey(identifier: string): string {
    return `login:attempts:${identifier}`;
  }

  private lockKey(identifier: string): string {
    return `login:lock:${identifier}`;
  }

  async isLocked(identifier: string): Promise<boolean> {
    const locked = await this.redis.get(this.lockKey(identifier));
    return locked !== null;
  }

  async getRemainingLockTime(identifier: string): Promise<number> {
    const ttl = await this.redis.ttl(this.lockKey(identifier));
    return Math.ceil(ttl / 60);
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = this.attemptsKey(identifier);
    const attempts = await this.redis.incr(key);

    // Set TTL on first attempt
    if (attempts === 1) {
      await this.redis.expire(key, LOCK_DURATION_SECONDS);
    }

    // Lock after MAX_ATTEMPTS
    if (attempts >= MAX_ATTEMPTS) {
      await this.redis.set(
        this.lockKey(identifier),
        '1',
        'EX',
        LOCK_DURATION_SECONDS,
      );
      await this.redis.del(key);
    }
  }

  async resetAttempts(identifier: string): Promise<void> {
    await this.redis.del(this.attemptsKey(identifier));
    await this.redis.del(this.lockKey(identifier));
  }
}
