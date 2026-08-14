import type { OnboardingStage } from '@prisma/client';

export const ONBOARDING_FLOW: OnboardingStage[] = [
  'ACCOUNT_CREATED',
  'EMAIL_VERIFICATION',
  'USERNAME',
  'PRIVACY',
  'REGION_LOCALE',
  'CONTACT_NUMBER',
  'PHONE_VERIFICATION',
  'PROVIDER_INTERESTS',
  'AGE_GATE',
  'LEGAL_CONSENTS',
  'SUBSCRIPTION_SELECTION',
  'AVATAR_PET_HANDOFF',
];

export const AGE_GATE_RULE_VERSION = 'age-gate-v1';

export const REQUIRED_CONSENTS = ['terms_of_service', 'privacy_policy'] as const;

export const INTEREST_PROVIDER_KEYS = [
  'gmail',
  'outlook',
  'whatsapp',
  'instagram',
  'messenger',
  'tiktok',
  'discord',
] as const;
