import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import {
  NotConfiguredAppleStoreProvider,
  NotConfiguredGoogleStoreProvider,
} from './not-configured-store.provider';
import { APPLE_STORE_PROVIDER, GOOGLE_STORE_PROVIDER } from './store-billing.provider';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [EntitlementsModule],
  controllers: [StoreController],
  providers: [
    StoreService,
    NotConfiguredAppleStoreProvider,
    NotConfiguredGoogleStoreProvider,
    { provide: APPLE_STORE_PROVIDER, useExisting: NotConfiguredAppleStoreProvider },
    { provide: GOOGLE_STORE_PROVIDER, useExisting: NotConfiguredGoogleStoreProvider },
  ],
  exports: [StoreService],
})
export class StoreModule {}
