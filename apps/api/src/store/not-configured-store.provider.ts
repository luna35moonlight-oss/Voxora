import { Injectable } from '@nestjs/common';
import type {
  StoreBillingProvider,
  StoreVerifyRequest,
  StoreVerifyResult,
} from './store-billing.provider';

@Injectable()
export class NotConfiguredAppleStoreProvider implements StoreBillingProvider {
  readonly storefront = 'APPLE' as const;

  async verifyPurchase(_request: StoreVerifyRequest): Promise<StoreVerifyResult> {
    return { status: 'NOT_CONFIGURED' };
  }
}

@Injectable()
export class NotConfiguredGoogleStoreProvider implements StoreBillingProvider {
  readonly storefront = 'GOOGLE' as const;

  async verifyPurchase(_request: StoreVerifyRequest): Promise<StoreVerifyResult> {
    return { status: 'NOT_CONFIGURED' };
  }
}
