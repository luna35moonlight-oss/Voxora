import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  getHealth() {
    return this.health.getHealth();
  }

  @Get('ready')
  getReady() {
    return this.health.getReady();
  }
}
