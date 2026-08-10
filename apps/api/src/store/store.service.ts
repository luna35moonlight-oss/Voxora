import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import {
  APPLE_STORE_PROVIDER,
  GOOGLE_STORE_PROVIDER,
  type StoreBillingProvider,
} from './store-billing.provider';

/**
 * Store purchase → provider verify → subscription state → Entitlement Service.
 * Mobile device is never final subscription authority.
 * Do not mark Paid/Active merely because purchase UI was opened.
 */
@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly entitlements: EntitlementsService,
    @Inject(APPLE_STORE_PROVIDER) private readonly apple: StoreBillingProvider,
    @Inject(GOOGLE_STORE_PROVIDER) private readonly google: StoreBillingProvider,
  ) {}

  async verify(
    userId: string,
    input: {
      storefront: 'APPLE' | 'GOOGLE';
      productCode: string;
      purchaseToken?: string;
      receiptData?: string;
    },
  ) {
    const provider = input.storefront === 'APPLE' ? this.apple : this.google;
    const result = await provider.verifyPurchase({
      userId,
      productCode: input.productCode,
      purchaseToken: input.purchaseToken,
      receiptData: input.receiptData,
    });

    const purchase = await this.prisma.purchaseReference.create({
      data: {
        userId,
        storefront: input.storefront,
        storeRef: result.status === 'VERIFIED' ? result.storeRef : null,
        status: result.status,
        rawVerified: result.status === 'VERIFIED',
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'store.verify_attempt',
      subject: purchase.id,
      payload: {
        storefront: input.storefront,
        productCode: input.productCode,
        status: result.status,
      },
    });

    if (result.status === 'NOT_CONFIGURED') {
      return {
        status: 'NOT_CONFIGURED' as const,
        paid: false,
        active: false,
        message: `${input.storefront} billing credentials are not configured`,
      };
    }

    if (result.status !== 'VERIFIED') {
      return {
        status: 'REJECTED' as const,
        paid: false,
        active: false,
        reason: result.reason,
      };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, product: { code: input.productCode } },
      orderBy: { createdAt: 'desc' },
    });
    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE', startedAt: new Date() },
      });
      await this.prisma.purchaseReference.update({
        where: { id: purchase.id },
        data: { subscriptionId: subscription.id },
      });
      await this.prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          eventType: 'store_verified_active',
          payload: { storefront: input.storefront, storeRef: result.storeRef },
        },
      });
      await this.entitlements.syncFromSubscriptionIntent(userId, subscription.id);
    }

    return {
      status: 'VERIFIED' as const,
      paid: true,
      active: true,
      storeRef: result.storeRef,
    };
  }

  readiness() {
    return {
      apple: { configured: false, status: 'NOT_CONFIGURED' as const },
      google: { configured: false, status: 'NOT_CONFIGURED' as const },
      note: 'Do not invent real Apple/Google product identifiers until configured.',
    };
  }
}
