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
        description: 'Alpha Bondfire product surface (not Phase 2 production)',
      },
      {
        key: 'pets.enabled',
        enabled: false,
        description: 'Living pets (later phase)',
      },
      {
        key: 'avatars.enabled',
        enabled: false,
        description: 'Living avatars / Scene Engine (Phase 3+)',
      },
      {
        key: 'wellness.enabled',
        enabled: false,
        description: 'Wellness product surface (not Phase 2)',
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

  /** Includes disabled flags so entitlement evaluation can distinguish off vs unknown. */
  listForEvaluation() {
    return this.prisma.featureFlag.findMany({
      select: { key: true, enabled: true },
      orderBy: { key: 'asc' },
    });
  }

  listAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }
}
