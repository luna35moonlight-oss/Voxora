import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  ConsentStatus,
  InterestState,
  OnboardingStage,
  OnboardingStatus,
  Visibility,
} from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VerificationService } from '../verification/verification.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { normalizeUsername, validateUsernameFormat } from '../usernames/username.util';
import {
  AGE_GATE_RULE_VERSION,
  INTEREST_PROVIDER_KEYS,
  ONBOARDING_FLOW,
  REQUIRED_CONSENTS,
} from './onboarding.constants';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly verification: VerificationService,
    private readonly catalogue: CatalogueService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async ensureStarted(userId: string) {
    const existing = await this.prisma.onboardingState.findUnique({ where: { userId } });
    if (existing) return existing;

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        emailVisibility: Visibility.PRIVATE,
        phoneVisibility: Visibility.PRIVATE,
      },
      update: {},
    });

    return this.prisma.onboardingState.create({
      data: {
        userId,
        currentStage: 'EMAIL_VERIFICATION',
        status: OnboardingStatus.IN_PROGRESS,
        completedStages: ['ACCOUNT_CREATED'],
      },
    });
  }

  async getState(userId: string) {
    const state = await this.ensureStarted(userId);
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId, withdrawnAt: null, replacedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const interests = await this.prisma.providerInterest.findMany({ where: { userId } });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true, productVersion: true },
    });

    return {
      currentStage: state.currentStage,
      status: state.status,
      completedStages: state.completedStages as OnboardingStage[],
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(profile?.phoneVerifiedAt),
      username: profile?.username ?? null,
      privacy: {
        emailVisibility: profile?.emailVisibility ?? Visibility.PRIVATE,
        phoneVisibility: profile?.phoneVisibility ?? Visibility.PRIVATE,
      },
      region: profile
        ? {
            countryCode: profile.countryCode,
            regionCode: profile.regionCode,
            locale: profile.locale,
            timeZone: profile.timeZone,
            displayCurrency: profile.displayCurrency,
          }
        : null,
      phoneE164: profile?.phoneE164 ?? null,
      ageGate: profile?.ageGateConfirmedAt
        ? {
            confirmedAt: profile.ageGateConfirmedAt.toISOString(),
            ruleVersion: profile.ageGateRuleVersion,
          }
        : null,
      consents: consents.map((c) => ({
        consentType: c.consentType,
        policyVersion: c.policyVersion,
        status: c.status,
        platform: c.platform,
        createdAt: c.createdAt.toISOString(),
      })),
      interests: interests.map((i) => ({
        providerKey: i.providerKey,
        state: i.state,
        connectionState: 'NOT_CONNECTED' as const,
      })),
      subscription: subscription
        ? {
            productCode: subscription.product.code,
            status: subscription.status,
            storefront: subscription.storefront,
            currency: subscription.productVersion.currency,
            amountMinor: subscription.productVersion.amountMinor,
          }
        : null,
      nextAllowedActions: this.nextActions(state.currentStage, state.status),
      handoff: {
        stage: 'AVATAR_PET_HANDOFF',
        note: 'Avatar and pet production systems belong to a future phase. No owned avatars or pets are created here.',
      },
    };
  }

  async requestEmailVerification(userId: string) {
    await this.assertCurrentStageAtLeast(userId, 'EMAIL_VERIFICATION');
    return this.verification.requestEmailVerification(userId);
  }

  async confirmEmailVerification(userId: string, token: string) {
    await this.assertCurrentStageAtLeast(userId, 'EMAIL_VERIFICATION');
    const result = await this.verification.confirmEmailVerification(userId, token);
    await this.completeStage(userId, 'EMAIL_VERIFICATION', 'USERNAME');
    return result;
  }

  async setUsername(userId: string, username: string) {
    await this.assertExactStage(userId, 'USERNAME');
    const format = validateUsernameFormat(username);
    if (!format.ok) {
      throw new BadRequestException(format.reason);
    }
    const display = username.trim();
    const normalized = normalizeUsername(display);

    try {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { username: display, usernameNormalized: normalized },
      });
    } catch {
      throw new ConflictException('Username is not available');
    }

    await this.audit.record({
      actorId: userId,
      action: 'onboarding.username_set',
      subject: userId,
      payload: { usernameNormalized: normalized },
    });
    await this.completeStage(userId, 'USERNAME', 'PRIVACY');
    return { status: 'ok' as const, username: display };
  }

  async setPrivacy(
    userId: string,
    input: { emailVisibility?: Visibility; phoneVisibility?: Visibility },
  ) {
    await this.assertExactStage(userId, 'PRIVACY');
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        emailVisibility: input.emailVisibility ?? Visibility.PRIVATE,
        phoneVisibility: input.phoneVisibility ?? Visibility.PRIVATE,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: 'onboarding.privacy_set',
      subject: userId,
      payload: {
        emailVisibility: profile.emailVisibility,
        phoneVisibility: profile.phoneVisibility,
      },
    });
    await this.completeStage(userId, 'PRIVACY', 'REGION_LOCALE');
    return {
      emailVisibility: profile.emailVisibility,
      phoneVisibility: profile.phoneVisibility,
    };
  }

  async setRegionLocale(
    userId: string,
    input: {
      countryCode: string;
      regionCode?: string;
      locale: string;
      timeZone: string;
      displayCurrency: string;
    },
  ) {
    await this.assertExactStage(userId, 'REGION_LOCALE');
    if (!isValidTimeZone(input.timeZone)) {
      throw new BadRequestException('Invalid IANA time zone');
    }
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        countryCode: input.countryCode.toUpperCase(),
        regionCode: input.regionCode?.toUpperCase() ?? null,
        locale: input.locale,
        timeZone: input.timeZone,
        displayCurrency: input.displayCurrency.toUpperCase(),
      },
    });
    await this.audit.record({
      actorId: userId,
      action: 'onboarding.region_locale_set',
      subject: userId,
      payload: {
        countryCode: profile.countryCode,
        locale: profile.locale,
        timeZone: profile.timeZone,
        displayCurrency: profile.displayCurrency,
      },
    });
    await this.completeStage(userId, 'REGION_LOCALE', 'CONTACT_NUMBER');
    return {
      countryCode: profile.countryCode,
      regionCode: profile.regionCode,
      locale: profile.locale,
      timeZone: profile.timeZone,
      displayCurrency: profile.displayCurrency,
    };
  }

  async setPhone(userId: string, phone: string, defaultCountry?: string) {
    await this.assertExactStage(userId, 'CONTACT_NUMBER');
    const parsed = parsePhoneNumberFromString(phone, defaultCountry as never);
    if (!parsed?.isValid()) {
      throw new BadRequestException('Invalid phone number');
    }
    const phoneE164 = parsed.format('E.164');

    // Enumeration-resistant: do not reveal if another account already uses this number.
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        phoneE164,
        phoneVerifiedAt: null,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'onboarding.phone_set',
      subject: userId,
      payload: { phoneSet: true },
    });
    await this.completeStage(userId, 'CONTACT_NUMBER', 'PHONE_VERIFICATION');
    return { status: 'ok' as const, phoneE164, verified: false };
  }

  async requestPhoneOtp(userId: string) {
    await this.assertExactStage(userId, 'PHONE_VERIFICATION');
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile?.phoneE164) {
      throw new BadRequestException('Phone number required before OTP');
    }
    return this.verification.requestPhoneOtp(userId, profile.phoneE164);
  }

  async confirmPhoneOtp(userId: string, code: string) {
    await this.assertExactStage(userId, 'PHONE_VERIFICATION');
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile?.phoneE164) {
      throw new BadRequestException('Phone number required before OTP');
    }
    const result = await this.verification.confirmPhoneOtp(userId, profile.phoneE164, code);
    if (result.status === 'verified') {
      await this.completeStage(userId, 'PHONE_VERIFICATION', 'PROVIDER_INTERESTS');
    }
    return result;
  }

  async setProviderInterests(userId: string, providers: string[]) {
    await this.assertExactStage(userId, 'PROVIDER_INTERESTS');
    const allowed = new Set<string>(INTEREST_PROVIDER_KEYS);
    const selected = [...new Set(providers.map((p) => p.trim().toLowerCase()))].filter((p) =>
      allowed.has(p),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.providerInterest.deleteMany({ where: { userId } });
      for (const providerKey of selected) {
        await tx.providerInterest.create({
          data: {
            userId,
            providerKey,
            state: InterestState.INTEREST_SELECTED,
          },
        });
      }
    });

    await this.audit.record({
      actorId: userId,
      action: 'onboarding.interests_set',
      subject: userId,
      payload: { providers: selected, connectionState: 'NOT_CONNECTED' },
    });
    await this.completeStage(userId, 'PROVIDER_INTERESTS', 'AGE_GATE');
    return {
      interests: selected.map((providerKey) => ({
        providerKey,
        state: 'INTEREST_SELECTED' as const,
        connectionState: 'NOT_CONNECTED' as const,
      })),
    };
  }

  async confirmAgeGate(userId: string, ruleVersion = AGE_GATE_RULE_VERSION) {
    await this.assertExactStage(userId, 'AGE_GATE');
    const confirmedAt = new Date();
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ageGateConfirmedAt: confirmedAt,
        ageGateRuleVersion: ruleVersion,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: 'onboarding.age_gate_confirmed',
      subject: userId,
      payload: { ruleVersion, confirmedAt: confirmedAt.toISOString() },
    });
    await this.completeStage(userId, 'AGE_GATE', 'LEGAL_CONSENTS');
    return { status: 'ok' as const, ruleVersion };
  }

  async grantConsents(
    userId: string,
    consents: Array<{
      consentType: string;
      policyVersion: string;
      status: 'GRANTED' | 'DENIED';
      platform: string;
    }>,
  ) {
    await this.assertExactStage(userId, 'LEGAL_CONSENTS');
    for (const required of REQUIRED_CONSENTS) {
      const row = consents.find((c) => c.consentType === required);
      if (!row || row.status !== 'GRANTED') {
        throw new BadRequestException(`Required consent not granted: ${required}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.consentRecord.findMany({
        where: { userId, replacedAt: null, withdrawnAt: null },
      });
      for (const row of existing) {
        await tx.consentRecord.update({
          where: { id: row.id },
          data: { replacedAt: new Date() },
        });
      }
      for (const consent of consents) {
        await tx.consentRecord.create({
          data: {
            userId,
            consentType: consent.consentType,
            policyVersion: consent.policyVersion,
            status: consent.status as ConsentStatus,
            platform: consent.platform,
            source: 'onboarding',
          },
        });
      }
    });

    await this.audit.record({
      actorId: userId,
      action: 'onboarding.consents_recorded',
      subject: userId,
      payload: {
        types: consents.map((c) => c.consentType),
        legalReview: 'OWNER / LEGAL DECISION REQUIRED — professional legal review',
      },
    });
    await this.completeStage(userId, 'LEGAL_CONSENTS', 'SUBSCRIPTION_SELECTION');
    return { status: 'ok' as const };
  }

  async selectSubscription(
    userId: string,
    productCode: string,
    storefront: 'APPLE' | 'GOOGLE' | 'INTERNAL',
  ) {
    await this.assertExactStage(userId, 'SUBSCRIPTION_SELECTION');
    const selection = await this.catalogue.selectProductIntent(userId, productCode, storefront);
    await this.entitlements.syncFromSubscriptionIntent(userId, selection.subscriptionId);
    await this.completeStage(userId, 'SUBSCRIPTION_SELECTION', 'AVATAR_PET_HANDOFF');
    await this.prisma.onboardingState.update({
      where: { userId },
      data: { status: OnboardingStatus.HANDOFF_READY },
    });
    await this.audit.record({
      actorId: userId,
      action: 'onboarding.subscription_intent_selected',
      subject: userId,
      payload: {
        productCode,
        storefront,
        subscriptionStatus: selection.status,
      },
    });
    return {
      ...selection,
      handoff: {
        nextPhase: 'avatar_pet',
        createdOwnedAvatar: false,
        createdOwnedPet: false,
        message: 'Onboarding handoff ready. Avatar/pet systems are not implemented in Phase 2.',
      },
    };
  }

  private nextActions(stage: OnboardingStage, status: OnboardingStatus) {
    if (status === 'HANDOFF_READY' || stage === 'AVATAR_PET_HANDOFF') {
      return ['await_avatar_pet_phase'];
    }
    const map: Record<OnboardingStage, string[]> = {
      ACCOUNT_CREATED: ['request_email_verification'],
      EMAIL_VERIFICATION: ['request_email_verification', 'confirm_email_verification'],
      USERNAME: ['set_username'],
      PRIVACY: ['set_privacy'],
      REGION_LOCALE: ['set_region_locale'],
      CONTACT_NUMBER: ['set_phone'],
      PHONE_VERIFICATION: ['request_phone_otp', 'confirm_phone_otp'],
      PROVIDER_INTERESTS: ['set_provider_interests'],
      AGE_GATE: ['confirm_age_gate'],
      LEGAL_CONSENTS: ['grant_consents'],
      SUBSCRIPTION_SELECTION: ['select_subscription'],
      AVATAR_PET_HANDOFF: ['await_avatar_pet_phase'],
    };
    return map[stage];
  }

  private async completeStage(userId: string, completed: OnboardingStage, next: OnboardingStage) {
    const state = await this.ensureStarted(userId);
    if (state.currentStage !== completed) {
      throw new ForbiddenException('Onboarding stage mismatch');
    }
    const completedStages = [...(state.completedStages as OnboardingStage[])];
    if (!completedStages.includes(completed)) {
      completedStages.push(completed);
    }
    await this.prisma.onboardingState.update({
      where: { userId },
      data: {
        currentStage: next,
        completedStages,
        lastAdvancedAt: new Date(),
        status:
          next === 'AVATAR_PET_HANDOFF'
            ? OnboardingStatus.HANDOFF_READY
            : OnboardingStatus.IN_PROGRESS,
      },
    });
  }

  private async assertExactStage(userId: string, expected: OnboardingStage) {
    const state = await this.ensureStarted(userId);
    if (state.currentStage !== expected) {
      throw new ForbiddenException(
        `Onboarding requires stage ${expected}; current is ${state.currentStage}`,
      );
    }
  }

  private async assertCurrentStageAtLeast(userId: string, expected: OnboardingStage) {
    const state = await this.ensureStarted(userId);
    const currentIdx = ONBOARDING_FLOW.indexOf(state.currentStage);
    const expectedIdx = ONBOARDING_FLOW.indexOf(expected);
    if (currentIdx < expectedIdx) {
      throw new ForbiddenException('Onboarding stage not yet reachable');
    }
  }

  async assertNoSkip(userId: string, target: OnboardingStage) {
    const state = await this.ensureStarted(userId);
    if (state.currentStage !== target) {
      throw new ForbiddenException('Cannot skip onboarding stages');
    }
  }
}

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
