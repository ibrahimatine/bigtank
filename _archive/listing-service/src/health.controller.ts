import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    @Inject('REDIS') private redis: Redis,
  ) {}

  @Get()
  async checkHealth() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      await this.redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      service: 'listing-service',
      checks,
    };
  }
}
