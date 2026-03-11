import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class ListingRateLimitService {
  private readonly MAX_LISTINGS_PER_HOUR = 5;
  private readonly WINDOW_SECONDS = 3600;

  constructor(@Inject('REDIS') private redis: Redis) {}

  private key(userId: string): string {
    return `listing:create:${userId}`;
  }

  async checkLimit(userId: string): Promise<void> {
    const count = await this.redis.incr(this.key(userId));

    if (count === 1) {
      await this.redis.expire(this.key(userId), this.WINDOW_SECONDS);
    }

    if (count > this.MAX_LISTINGS_PER_HOUR) {
      throw new HttpException(
        "Vous avez atteint la limite de creation d'annonces. Reessayez plus tard.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
