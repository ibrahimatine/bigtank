import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  @Get()
  async getHealth() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      service: 'admin-service',
      checks,
    };
  }
}
