import { Injectable } from '@nestjs/common';
import type {
  EmailDeliveryProvider,
  EmailDeliveryRequest,
  EmailDeliveryResult,
} from './email-delivery.provider';

@Injectable()
export class NotConfiguredEmailProvider implements EmailDeliveryProvider {
  readonly name = 'none';

  async send(_request: EmailDeliveryRequest): Promise<EmailDeliveryResult> {
    return { status: 'NOT_CONFIGURED' };
  }
}
