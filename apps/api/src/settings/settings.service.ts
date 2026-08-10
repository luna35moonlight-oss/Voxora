import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { OnboardingService } from '../onboarding/onboarding.service';

/**
 * Phase 2 settings surface — never exposes secrets, tokens, or raw security material.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly entitlements: EntitlementsService,
    private readonly onboarding: OnboardingService,
  ) {}

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const roles = await this.rbac.getUserRoles(userId);
    const onboarding = await this.onboarding.getState(userId);
    const entitlements = await this.entitlements.evaluate(userId);
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId, withdrawnAt: null, replacedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true, productVersion: true },
    });

    return {
      account: {
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        roles,
        status: user.status,
      },
      username: profile?.username ?? null,
      privacy: {
        emailVisibility: profile?.emailVisibility ?? 'PRIVATE',
        phoneVisibility: profile?.phoneVisibility ?? 'PRIVATE',
      },
      region: {
        countryCode: profile?.countryCode ?? null,
        regionCode: profile?.regionCode ?? null,
        locale: profile?.locale ?? null,
        timeZone: profile?.timeZone ?? null,
        displayCurrency: profile?.displayCurrency ?? null,
      },
      phone: {
        phoneE164: profile?.phoneE164 ?? null,
        verified: Boolean(profile?.phoneVerifiedAt),
      },
      security: {
        mfaEnabled: user.mfaEnabled,
        // No secrets/tokens.
      },
      consents: consents.map((c) => ({
        consentType: c.consentType,
        policyVersion: c.policyVersion,
        status: c.status,
        platform: c.platform,
        createdAt: c.createdAt.toISOString(),
      })),
      subscription: subscription
        ? {
            productCode: subscription.product.code,
            status: subscription.status,
            storefront: subscription.storefront,
            paid: subscription.status === 'ACTIVE',
            active: subscription.status === 'ACTIVE',
            pricing: {
              currency: subscription.productVersion.currency,
              amountMinor: subscription.productVersion.amountMinor,
            },
          }
        : null,
      onboarding: {
        currentStage: onboarding.currentStage,
        status: onboarding.status,
      },
      entitlements: entitlements.capabilities,
    };
  }
}
