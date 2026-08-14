import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '@voxora/config';
import { EMAIL_DELIVERY_PROVIDER } from './email/email-delivery.provider';
import { NotConfiguredEmailProvider } from './email/not-configured-email.provider';
import { DevCaptureEmailProvider } from './email/dev-capture-email.provider';
import { PHONE_VERIFICATION_PROVIDER } from './phone/phone-verification.provider';
import { NotConfiguredPhoneProvider } from './phone/not-configured-phone.provider';
import { DevCapturePhoneProvider } from './phone/dev-capture-phone.provider';

@Global()
@Module({
  providers: [
    NotConfiguredEmailProvider,
    DevCaptureEmailProvider,
    NotConfiguredPhoneProvider,
    DevCapturePhoneProvider,
    {
      provide: EMAIL_DELIVERY_PROVIDER,
      inject: [ConfigService, NotConfiguredEmailProvider, DevCaptureEmailProvider],
      useFactory: (
        config: ConfigService<ApiEnv, true>,
        none: NotConfiguredEmailProvider,
        dev: DevCaptureEmailProvider,
      ) => {
        const mode = config.get('EMAIL_PROVIDER', { infer: true });
        return mode === 'dev' ? dev : none;
      },
    },
    {
      provide: PHONE_VERIFICATION_PROVIDER,
      inject: [ConfigService, NotConfiguredPhoneProvider, DevCapturePhoneProvider],
      useFactory: (
        config: ConfigService<ApiEnv, true>,
        none: NotConfiguredPhoneProvider,
        dev: DevCapturePhoneProvider,
      ) => {
        const mode = config.get('PHONE_PROVIDER', { infer: true });
        return mode === 'dev' ? dev : none;
      },
    },
  ],
  exports: [EMAIL_DELIVERY_PROVIDER, PHONE_VERIFICATION_PROVIDER],
})
export class ProvidersModule {}
