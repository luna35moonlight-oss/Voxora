export type EmailDeliveryRequest = {
  to: string;
  subject: string;
  bodyText: string;
  purpose: string;
  userId: string;
  /** Opaque verification token — providers must not log this. */
  verificationToken: string;
};

export type EmailDeliveryResult =
  | { status: 'NOT_CONFIGURED' }
  | { status: 'ACCEPTED'; providerRef: string }
  | { status: 'DEV_CAPTURED'; providerRef: string }
  | { status: 'FAILED'; reason: string };

export interface EmailDeliveryProvider {
  readonly name: string;
  send(request: EmailDeliveryRequest): Promise<EmailDeliveryResult>;
}

export const EMAIL_DELIVERY_PROVIDER = Symbol('EMAIL_DELIVERY_PROVIDER');
