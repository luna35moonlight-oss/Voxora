import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EmailDeliveryProvider,
  EmailDeliveryRequest,
  EmailDeliveryResult,
} from './email-delivery.provider';

/**
 * Development/test transport only.
 * Captures delivery artifacts in DB without claiming a production vendor send.
 * Never enabled as a production email vendor.
 */
@Injectable()
export class DevCaptureEmailProvider implements EmailDeliveryProvider {
  readonly name = 'dev';

  constructor(private readonly prisma: PrismaService) {}

  async send(request: EmailDeliveryRequest): Promise<EmailDeliveryResult> {
    const artifact = await this.prisma.devDeliveryArtifact.create({
      data: {
        channel: 'email',
        purpose: request.purpose,
        userId: request.userId,
        payload: {
          to: request.to,
          subject: request.subject,
          // Token stored only in isolated dev outbox for automated tests.
          verificationToken: request.verificationToken,
          bodyText: request.bodyText,
        },
      },
    });
    return { status: 'DEV_CAPTURED', providerRef: artifact.id };
  }
}
