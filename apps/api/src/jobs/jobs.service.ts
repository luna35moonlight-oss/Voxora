import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import type { ApiEnv } from '@voxora/config';

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly redis: Redis;
  private readonly defaultQueue: Queue;

  constructor(config: ConfigService<ApiEnv, true>) {
    const redisUrl = config.get('REDIS_URL', { infer: true });
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    this.defaultQueue = new Queue('voxora-default', { connection: this.redis.duplicate() });
  }

  async onModuleDestroy() {
    await this.defaultQueue.close();
    this.redis.disconnect();
  }

  async ping(): Promise<boolean> {
    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (err) {
      this.logger.warn(`Redis ping failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return false;
    }
  }

  async enqueueSmoke(payload: Record<string, unknown>) {
    return this.defaultQueue.add('smoke', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
