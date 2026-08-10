import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'voxora-api' as const,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }

  async getReady() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const redisOk = await this.jobs.ping();
      if (!redisOk) {
        throw new Error('redis unavailable');
      }
      return {
        status: 'ready' as const,
        database: 'up',
        redis: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Dependency check failed');
    }
  }
}
