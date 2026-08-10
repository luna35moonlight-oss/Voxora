import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Storefront, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type ProductSeed = {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  amountMinor: number;
  currency: string;
  entitlements: Record<string, number | boolean>;
  wellnessTrialArchitecture?: boolean;
};

/**
 * Owner commercial intention (display/catalogue only — never entitlement branching on price):
 * Level 1 R15, Level 2 R25, Level 3 R99, Level 4 R125.
 * Level 4 Bondfire quota intentionally omitted (OWNER DECISION REQUIRED).
 */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    code: 'level_1',
    name: 'Voxora Level 1',
    description: 'Basic avatars, one Basic pet entitlement path, Bondfire quota 4',
    sortOrder: 1,
    amountMinor: 1500,
    currency: 'ZAR',
    entitlements: {
      'avatar.basic': true,
      'pet.basic': true,
      'bondfire.access': true,
      'bondfire.messageQuota': 4,
    },
  },
  {
    code: 'level_2',
    name: 'Voxora Level 2',
    description: 'Elite-eligible avatars/pets, Bondfire quota 100',
    sortOrder: 2,
    amountMinor: 2500,
    currency: 'ZAR',
    entitlements: {
      'avatar.basic': true,
      'avatar.elite': true,
      'pet.basic': true,
      'pet.elite': true,
      'bondfire.access': true,
      'bondfire.messageQuota': 100,
    },
  },
  {
    code: 'level_3',
    name: 'Voxora Level 3',
    description: 'Legendary-eligible avatars, Bondfire quota 200, Wellness trial architecture',
    sortOrder: 3,
    amountMinor: 9900,
    currency: 'ZAR',
    entitlements: {
      'avatar.basic': true,
      'avatar.elite': true,
      'avatar.legendary': true,
      'pet.basic': true,
      'pet.elite': true,
      'bondfire.access': true,
      'bondfire.messageQuota': 200,
    },
    wellnessTrialArchitecture: true,
  },
  {
    code: 'level_4',
    name: 'Voxora Level 4',
    description:
      'Primary functionality subject to packages/add-ons/premium/legal/provider rules. Bondfire quota not invented.',
    sortOrder: 4,
    amountMinor: 12500,
    currency: 'ZAR',
    entitlements: {
      'avatar.basic': true,
      'avatar.elite': true,
      'avatar.legendary': true,
      'pet.basic': true,
      'pet.elite': true,
      'pet.legendary': true,
      'bondfire.access': true,
      // bondfire.messageQuota intentionally absent for Level 4 — OQ-BF-006
      'voice.access': true,
      'games.access': true,
      'workspace.access': true,
    },
  },
];

@Injectable()
export class CatalogueService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureSeed();
  }

  async ensureSeed() {
    for (const seed of PRODUCT_SEEDS) {
      const product = await this.prisma.product.upsert({
        where: { code: seed.code },
        create: {
          code: seed.code,
          name: seed.name,
          description: seed.description,
          sortOrder: seed.sortOrder,
          active: true,
        },
        update: {
          name: seed.name,
          description: seed.description,
          sortOrder: seed.sortOrder,
          active: true,
        },
      });

      const existing = await this.prisma.productVersion.findUnique({
        where: { productId_version: { productId: product.id, version: 1 } },
      });
      const version =
        existing ??
        (await this.prisma.productVersion.create({
          data: {
            productId: product.id,
            version: 1,
            currency: seed.currency,
            amountMinor: seed.amountMinor,
            billingPeriod: 'month',
            entitlementsJson: {
              ...seed.entitlements,
              ...(seed.wellnessTrialArchitecture
                ? { wellnessTrialArchitecture: true, wellnessTrialDays: 7 }
                : {}),
            },
            active: true,
          },
        }));

      for (const storefront of [Storefront.APPLE, Storefront.GOOGLE, Storefront.INTERNAL]) {
        await this.prisma.storeProductMapping.upsert({
          where: {
            productVersionId_storefront: {
              productVersionId: version.id,
              storefront,
            },
          },
          create: {
            productVersionId: version.id,
            storefront,
            storeProductId: null,
            configured: storefront === Storefront.INTERNAL,
          },
          update: {},
        });
      }
    }

    const capabilities = [
      'avatar.basic',
      'avatar.elite',
      'avatar.legendary',
      'pet.basic',
      'pet.elite',
      'pet.legendary',
      'pet.training',
      'pet.battle',
      'games.access',
      'bondfire.access',
      'bondfire.messageQuota',
      'wellness.access',
      'voice.access',
      'mail.read',
      'mail.write',
      'calendar.read',
      'calendar.write',
      'contacts.read',
      'files.access',
      'workspace.access',
    ];
    for (const capability of capabilities) {
      await this.prisma.entitlementDefinition.upsert({
        where: { capability },
        create: { capability, description: capability },
        update: {},
      });
    }
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: 'desc' },
          take: 1,
          include: { storeMappings: true },
        },
      },
    });

    return products.map((p) => {
      const version = p.versions[0];
      return {
        code: p.code,
        name: p.name,
        description: p.description,
        pricing: version
          ? {
              version: version.version,
              currency: version.currency,
              amountMinor: version.amountMinor,
              billingPeriod: version.billingPeriod,
            }
          : null,
        storeMappings: (version?.storeMappings ?? []).map((m) => ({
          storefront: m.storefront,
          configured: m.configured,
          storeProductId: m.storeProductId,
          readiness: m.configured ? 'CONFIGURED' : 'NOT_CONFIGURED',
        })),
        // Preview of higher offerings is allowed; lock state is entitlement-driven.
        previewOnlyCapabilities: Object.keys(
          (version?.entitlementsJson as Record<string, unknown>) ?? {},
        ),
      };
    });
  }

  async selectProductIntent(
    userId: string,
    productCode: string,
    storefront: 'APPLE' | 'GOOGLE' | 'INTERNAL',
  ) {
    const product = await this.prisma.product.findUnique({
      where: { code: productCode },
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: 'desc' },
          take: 1,
          include: { storeMappings: true },
        },
      },
    });
    if (!product || !product.versions[0]) {
      throw new NotFoundException('Product not found');
    }
    const version = product.versions[0];
    const mapping = version.storeMappings.find((m) => m.storefront === storefront);

    let status: SubscriptionStatus = SubscriptionStatus.INTENT_SELECTED;
    if (storefront === 'APPLE' || storefront === 'GOOGLE') {
      status = mapping?.configured
        ? SubscriptionStatus.PENDING_VERIFICATION
        : SubscriptionStatus.PENDING_STORE_CONFIGURATION;
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        productId: product.id,
        productVersionId: version.id,
        status,
        storefront,
        events: {
          create: {
            eventType: 'intent_selected',
            payload: { productCode, storefront, status },
          },
        },
      },
    });

    const entitlementsJson = version.entitlementsJson as Record<string, unknown>;
    if (entitlementsJson.wellnessTrialArchitecture === true) {
      await this.prisma.trialGrant.create({
        data: {
          userId,
          productVersionId: version.id,
          trialKey: 'wellness_one_week',
          status: 'ARCHITECTURE_ONLY',
          durationDays: 7,
          metadata: {
            note: 'Wellness trial architecture only. Do not start a real Wellness trial. Timer/reset rules deferred.',
            ownerDecisionRequired: true,
          },
        },
      });
    }

    await this.audit.record({
      actorId: userId,
      action: 'subscription.intent_selected',
      subject: subscription.id,
      payload: { productCode, storefront, status },
    });

    return {
      subscriptionId: subscription.id,
      productCode: product.code,
      status: subscription.status,
      storefront,
      pricing: {
        currency: version.currency,
        amountMinor: version.amountMinor,
        billingPeriod: version.billingPeriod,
        version: version.version,
      },
      storeReadiness: mapping?.configured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      paid: false,
      active: false,
    };
  }
}
