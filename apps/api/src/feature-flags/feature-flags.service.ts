import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const defaults = [
      {
        key: 'platform.foundation',
        enabled: true,
        description: 'Core foundation availability',
      },
      {
        key: 'bondfire.enabled',
        enabled: false,
        description: 'Alpha Bondfire product surface (not Phase 1)',
      },
      {
        key: 'pets.enabled',
        enabled: false,
        description: 'Living pets (later phase)',
      },
    ];
    for (const flag of defaults) {
      await this.prisma.featureFlag.upsert({
        where: { key: flag.key },
        create: flag,
        update: { description: flag.description },
      });
    }
  }

  listPublic() {
    return this.prisma.featureFlag.findMany({
      where: { enabled: true },
      select: { key: true, enabled: true },
      orderBy: { key: 'asc' },
    });
  }

  listAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }
}
