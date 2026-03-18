import { Injectable } from '@nestjs/common';
import { MemoryStoreService } from '../common/services/memory-store.service';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class LoginRateLimitService {
  constructor(private store: MemoryStoreService) {}

  private attemptsKey(identifier: string): string {
    return `login:attempts:${identifier}`;
  }

  private lockKey(identifier: string): string {
    return `login:lock:${identifier}`;
  }

  async isLocked(identifier: string): Promise<boolean> {
    const locked = await this.store.get(this.lockKey(identifier));
    return locked !== null;
  }

  async getRemainingLockTime(identifier: string): Promise<number> {
    const ttl = await this.store.ttl(this.lockKey(identifier));
    return Math.ceil(ttl / 60);
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = this.attemptsKey(identifier);
    const attempts = await this.store.incr(key);

    if (attempts === 1) {
      await this.store.expire(key, LOCK_DURATION_SECONDS);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await this.store.set(
        this.lockKey(identifier),
        '1',
        LOCK_DURATION_SECONDS,
      );
      await this.store.del(key);
    }
  }

  async resetAttempts(identifier: string): Promise<void> {
    await this.store.del(this.attemptsKey(identifier));
    await this.store.del(this.lockKey(identifier));
  }
}
