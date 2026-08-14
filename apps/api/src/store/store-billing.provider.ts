export type StoreVerifyRequest = {
  userId: string;
  productCode: string;
  purchaseToken?: string;
  receiptData?: string;
};

export type StoreVerifyResult =
  | { status: 'NOT_CONFIGURED' }
  | { status: 'VERIFIED'; storeRef: string }
  | { status: 'REJECTED'; reason: string };

export interface StoreBillingProvider {
  readonly storefront: 'APPLE' | 'GOOGLE';
  verifyPurchase(request: StoreVerifyRequest): Promise<StoreVerifyResult>;
}

export const APPLE_STORE_PROVIDER = Symbol('APPLE_STORE_PROVIDER');
export const GOOGLE_STORE_PROVIDER = Symbol('GOOGLE_STORE_PROVIDER');
