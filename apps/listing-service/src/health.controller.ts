import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'listing-service',
      timestamp: new Date().toISOString(),
    };
  }
}
