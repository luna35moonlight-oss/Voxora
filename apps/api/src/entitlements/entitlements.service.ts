import { Injectable } from '@nestjs/common';
import { EntitlementSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';

/**
 * Server-authoritative Entitlement Service.
 * Feature flags answer "is Voxora offering this?"
 * Entitlements answer "may this user access it?"
 * Unknown/unconfigured never means unlimited access.
 */
@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async syncFromSubscriptionIntent(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { productVersion: true },
    });

    // Intent / pending store config does NOT grant paid capabilities as Active.
    // Record provisional grants only when status is ACTIVE (store verified) or
    // INTERNAL intent for development preview of selected product definition —
    // still marked source SUBSCRIPTION with metadata intentOnly=true and not
    // treated as paid Active by evaluate().
    const entitlementsJson = subscription.productVersion.entitlementsJson as Record<
      string,
      unknown
    >;

    await this.prisma.userEntitlement.updateMany({
      where: { userId, source: EntitlementSource.SUBSCRIPTION, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    for (const [capability, value] of Object.entries(entitlementsJson)) {
      if (capability === 'wellnessTrialArchitecture' || capability === 'wellnessTrialDays') {
        continue;
      }
      const limitValue = typeof value === 'number' ? value : null;
      const enabled = value === true || typeof value === 'number';
      if (!enabled) continue;

      await this.prisma.userEntitlement.create({
        data: {
          userId,
          capability,
          source: EntitlementSource.SUBSCRIPTION,
          limitValue,
          metadata: {
            subscriptionId,
            intentOnly: subscription.status !== 'ACTIVE',
            subscriptionStatus: subscription.status,
          },
        },
      });
    }
  }

  async evaluate(userId: string) {
    const now = new Date();
    const rows = await this.prisma.userEntitlement.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        startsAt: { lte: now },
      },
    });

    const flags = await this.flags.listForEvaluation();
    const flagMap = new Map(flags.map((f) => [f.key, f.enabled]));

    const capabilities: Record<
      string,
      { entitled: boolean; offered: boolean; limit: number | null; source: string | null }
    > = {};

    for (const row of rows) {
      const meta = (row.metadata ?? {}) as { intentOnly?: boolean };
      // Intent-only rows are visible as selected product mapping but not Active paid access.
      const entitled = meta.intentOnly !== true;
      const offered = this.isOffered(row.capability, flagMap);
      capabilities[row.capability] = {
        entitled: entitled && offered,
        offered,
        limit: row.limitValue,
        source: row.source,
      };
    }

    return {
      userId,
      authoritative: true,
      capabilities,
      note: 'Client-provided commercial state is never authoritative. Unknown capability = no access.',
    };
  }

  async hasCapability(userId: string, capability: string): Promise<boolean> {
    const snapshot = await this.evaluate(userId);
    return Boolean(snapshot.capabilities[capability]?.entitled);
  }

  private isOffered(capability: string, flagMap: Map<string, boolean>): boolean {
    // Phase 2: commercial foundation capabilities are considered offered at the
    // platform layer when platform.foundation is on. Domain features (Bondfire,
    // pets, wellness content) remain feature-flag gated separately.
    if (capability.startsWith('bondfire.')) {
      return flagMap.get('bondfire.enabled') === true;
    }
    if (capability.startsWith('pet.') || capability.startsWith('avatar.')) {
      // Avatar/pet production is Phase 3+; offering flag remains off.
      return flagMap.get('pets.enabled') === true || flagMap.get('avatars.enabled') === true;
    }
    if (capability.startsWith('wellness.')) {
      return flagMap.get('wellness.enabled') === true;
    }
    return flagMap.get('platform.foundation') !== false;
  }
}
