import { z } from 'zod';

/** Roles — server-assigned only. Never elevate from client email checks. */
export const RoleName = z.enum([
  'USER',
  'SUPPORT',
  'MODERATOR',
  'ADMIN',
  'OWNER',
  'SERVICE_ACCOUNT',
]);
export type RoleName = z.infer<typeof RoleName>;

/** Privileged roles that require MFA before production privileged access. */
export const PRIVILEGED_ROLES: readonly RoleName[] = [
  'SUPPORT',
  'MODERATOR',
  'ADMIN',
  'OWNER',
] as const;

export function isPrivilegedRole(role: RoleName): boolean {
  return (PRIVILEGED_ROLES as readonly string[]).includes(role);
}

export const PermissionKey = z.enum([
  'auth.session.read',
  'auth.session.revoke',
  'user.profile.read',
  'user.profile.update',
  'admin.users.read',
  'admin.roles.assign',
  'admin.audit.read',
  'admin.feature_flags.manage',
  'owner.bootstrap',
]);
export type PermissionKey = z.infer<typeof PermissionKey>;

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('voxora-api'),
  timestamp: z.string(),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(128),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthenticationAssurance = z.enum(['PASSWORD', 'MFA']);
export type AuthenticationAssurance = z.infer<typeof AuthenticationAssurance>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  roles: z.array(RoleName),
  mfaEnabled: z.boolean(),
  /** Server-authoritative session assurance — never trust a client-provided MFA flag. */
  authenticationAssurance: AuthenticationAssurance.optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  status: z.literal('authenticated'),
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MfaRequiredResponseSchema = z.object({
  status: z.literal('mfa_required'),
  challengeToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
});
export type MfaRequiredResponse = z.infer<typeof MfaRequiredResponseSchema>;

export const MfaEnrollmentRequiredResponseSchema = z.object({
  status: z.literal('mfa_enrollment_required'),
  enrollmentToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
});
export type MfaEnrollmentRequiredResponse = z.infer<typeof MfaEnrollmentRequiredResponseSchema>;

export const LoginResponseSchema = z.discriminatedUnion('status', [
  AuthResponseSchema.extend({ status: z.literal('authenticated') }),
  MfaRequiredResponseSchema,
  MfaEnrollmentRequiredResponseSchema,
]);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

/** Entitlement capability keys — server evaluates; never trust UI labels. */
export const EntitlementCapability = z.enum([
  'avatar.basic',
  'avatar.elite',
  'avatar.legendary',
  'pet.basic',
  'pet.elite',
  'pet.legendary',
  'pet.training',
  'pet.battle',
  'games.access',
  'bondfire.access',
  'bondfire.messageQuota',
  'wellness.access',
  'voice.access',
  'mail.read',
  'mail.write',
  'calendar.read',
  'calendar.write',
  'contacts.read',
  'files.access',
  'workspace.access',
]);
export type EntitlementCapability = z.infer<typeof EntitlementCapability>;

/** Honest connection states — Connected only after real auth + capability verification. */
export const ProviderConnectionState = z.enum([
  'NOT_CONNECTED',
  'AUTHORIZATION_STARTED',
  'CONNECTED',
  'LIMITED_CAPABILITY',
  'REAUTHORIZATION_REQUIRED',
  'EXPIRED',
  'ERROR',
  'DISCONNECTED',
]);
export type ProviderConnectionState = z.infer<typeof ProviderConnectionState>;

/** Interest selection is not connection. */
export const InterestState = z.literal('INTEREST_SELECTED');
export type InterestState = z.infer<typeof InterestState>;

export const OnboardingStage = z.enum([
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
]);
export type OnboardingStage = z.infer<typeof OnboardingStage>;

export const ONBOARDING_STAGE_ORDER: readonly OnboardingStage[] = [
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
] as const;

export const DeliveryStatus = z.enum(['NOT_CONFIGURED', 'ACCEPTED', 'FAILED', 'DEV_CAPTURED']);
export type DeliveryStatus = z.infer<typeof DeliveryStatus>;

export const Visibility = z.enum(['PRIVATE', 'PUBLIC']);
export type Visibility = z.infer<typeof Visibility>;

export const UsernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Username must start with a letter and use A-Z, 0-9, _');

export const SetUsernameRequestSchema = z.object({
  username: UsernameSchema,
});

export const PrivacyUpdateSchema = z.object({
  emailVisibility: Visibility.optional(),
  phoneVisibility: Visibility.optional(),
});

export const RegionLocaleSchema = z.object({
  countryCode: z.string().length(2),
  regionCode: z.string().max(32).optional(),
  locale: z.string().min(2).max(35),
  timeZone: z.string().min(1).max(64),
  displayCurrency: z.string().length(3),
});

export const PhoneRequestSchema = z.object({
  phone: z.string().min(8).max(20),
  defaultCountry: z.string().length(2).optional(),
});

export const OtpVerifySchema = z.object({
  code: z.string().min(4).max(10),
});

export const ProviderInterestsSchema = z.object({
  providers: z.array(z.string().min(1).max(64)).max(32),
});

export const AgeGateSchema = z.object({
  confirmed18Plus: z.literal(true),
  ruleVersion: z.string().min(1).max(32).default('age-gate-v1'),
});

export const ConsentGrantSchema = z.object({
  consents: z
    .array(
      z.object({
        consentType: z.enum([
          'terms_of_service',
          'privacy_policy',
          'communications_preferences',
          'marketing_optional',
          'provider_specific',
          'feature_permissions_optional',
        ]),
        policyVersion: z.string().min(1).max(64),
        status: z.enum(['GRANTED', 'DENIED']),
        platform: z.string().min(1).max(32).default('mobile'),
      }),
    )
    .min(1),
});

export const SubscriptionSelectSchema = z.object({
  productCode: z.enum(['level_1', 'level_2', 'level_3', 'level_4']),
  storefront: z.enum(['APPLE', 'GOOGLE', 'INTERNAL']).default('INTERNAL'),
});

export const MfaVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  challengeToken: z.string().min(1).optional(),
  enrollmentToken: z.string().min(1).optional(),
});

export const MfaConfirmEnrollmentSchema = z.object({
  enrollmentToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export const StoreVerifySchema = z.object({
  storefront: z.enum(['APPLE', 'GOOGLE']),
  productCode: z.string().min(1),
  purchaseToken: z.string().min(1).optional(),
  receiptData: z.string().min(1).optional(),
});

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  correlationId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Policy documents require professional legal review — placeholders only. */
export const LEGAL_REVIEW_REQUIRED = 'OWNER / LEGAL DECISION REQUIRED — professional legal review';

export const WhiteWolfMoonDashGameId = z.literal('white-wolf-moon-dash');
export type WhiteWolfMoonDashGameId = z.infer<typeof WhiteWolfMoonDashGameId>;

export const WhiteWolfMoonDashDailyLimit = 10;
export const WhiteWolfMoonDashPrizeRanks = 2;
export const WhiteWolfMoonDashMaxAcceptedScore = 40;

export const WhiteWolfLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerLabel: z.string().min(1),
  score: z.number().int().nonnegative(),
  prizeEligible: z.boolean(),
  prizeStatus: z.enum([
    'CURRENT_LEADER',
    'PROVISIONAL_WINNER',
    'VERIFIED_WINNER',
    'PRIZE_ISSUED',
    'PRIZE_REDEEMED',
    'NOT_IN_PRIZE_POSITION',
  ]),
});
export type WhiteWolfLeaderboardEntry = z.infer<typeof WhiteWolfLeaderboardEntrySchema>;

export const WhiteWolfRewardStatusSchema = z.enum([
  'NOT_RANKED',
  'NOT_IN_PRIZE_POSITION',
  'CURRENT_LEADER',
  'PROVISIONAL_WINNER',
  'VERIFIED_WINNER',
  'PRIZE_ISSUED',
  'PRIZE_REDEEMED',
]);
export type WhiteWolfRewardStatus = z.infer<typeof WhiteWolfRewardStatusSchema>;

export const WhiteWolfGameStatusResponseSchema = z.object({
  gameId: WhiteWolfMoonDashGameId,
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dailyAttemptLimit: z.literal(WhiteWolfMoonDashDailyLimit),
  attemptsUsedToday: z.number().int().min(0).max(WhiteWolfMoonDashDailyLimit),
  attemptsRemainingToday: z.number().int().min(0).max(WhiteWolfMoonDashDailyLimit),
  bestScore: z.number().int().nonnegative(),
  bestRank: z.number().int().positive().nullable(),
  prizeRanks: z.literal(WhiteWolfMoonDashPrizeRanks),
  rewardStatus: WhiteWolfRewardStatusSchema,
  rewardNote: z.string().min(1),
  leaderboard: z.array(WhiteWolfLeaderboardEntrySchema).max(WhiteWolfMoonDashPrizeRanks),
  serverTime: z.string(),
});
export type WhiteWolfGameStatusResponse = z.infer<typeof WhiteWolfGameStatusResponseSchema>;

export const StartWhiteWolfAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  attemptNumber: z.number().int().min(1).max(WhiteWolfMoonDashDailyLimit),
  status: WhiteWolfGameStatusResponseSchema,
});
export type StartWhiteWolfAttemptResponse = z.infer<typeof StartWhiteWolfAttemptResponseSchema>;

export const WhiteWolfAttemptOutcomeSchema = z.enum(['won', 'resting', 'forfeited']);
export type WhiteWolfAttemptOutcome = z.infer<typeof WhiteWolfAttemptOutcomeSchema>;

export const CompleteWhiteWolfAttemptRequestSchema = z.object({
  score: z.number().int().min(0).max(WhiteWolfMoonDashMaxAcceptedScore),
  outcome: WhiteWolfAttemptOutcomeSchema,
  durationMs: z
    .number()
    .int()
    .min(0)
    .max(15 * 60 * 1000)
    .optional(),
});
export type CompleteWhiteWolfAttemptRequest = z.infer<typeof CompleteWhiteWolfAttemptRequestSchema>;

export const CompleteWhiteWolfAttemptResponseSchema = z.object({
  status: WhiteWolfGameStatusResponseSchema,
});
export type CompleteWhiteWolfAttemptResponse = z.infer<
  typeof CompleteWhiteWolfAttemptResponseSchema
>;

export const AvatarTierSchema = z.enum(['BASIC', 'ELITE', 'LEGENDARY']);
export type AvatarTier = z.infer<typeof AvatarTierSchema>;

export const AvatarRaritySchema = z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']);
export type AvatarRarity = z.infer<typeof AvatarRaritySchema>;

export const AvatarPerformanceProfileSchema = z.enum(['HIGH', 'STANDARD', 'LOW']);
export type AvatarPerformanceProfile = z.infer<typeof AvatarPerformanceProfileSchema>;

export const AvatarEquipmentSlotSchema = z.enum([
  'HAIR',
  'HEADWEAR',
  'FACE_ACCESSORY',
  'TOP',
  'BOTTOM',
  'FULL_OUTFIT',
  'OUTERWEAR',
  'HANDS',
  'SHOES',
  'JEWELLERY',
  'BACK_ACCESSORY',
  'HELD_ITEM',
  'SPECIAL_EFFECT',
]);
export type AvatarEquipmentSlot = z.infer<typeof AvatarEquipmentSlotSchema>;

export const AvatarRuntimeStateSchema = z.enum([
  'IDLE',
  'BLINK',
  'LOOK_LEFT',
  'LOOK_RIGHT',
  'LISTEN',
  'THINK',
  'SPEAK',
  'SMILE',
  'HAPPY',
  'EXCITED',
  'SURPRISED',
  'CONCERNED',
  'CONFUSED',
  'CELEBRATE',
  'WAVE',
  'RETURN_TO_IDLE',
]);
export type AvatarRuntimeState = z.infer<typeof AvatarRuntimeStateSchema>;

export const AvatarCatalogueItemSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  tier: AvatarTierSchema,
  rarity: AvatarRaritySchema,
  rigFamily: z.string().min(1),
  riveAssetRef: z.string().min(1),
  thumbnailRef: z.string().min(1),
  entitlementCapability: EntitlementCapability.optional(),
  packageKey: z.string().min(1).optional(),
  active: z.boolean(),
  version: z.number().int().positive(),
  performanceProfile: AvatarPerformanceProfileSchema,
  fallbackAvatarId: z.string().min(1).nullable(),
  owned: z.boolean(),
  lockedReason: z.string().nullable(),
});
export type AvatarCatalogueItem = z.infer<typeof AvatarCatalogueItemSchema>;

export const AvatarInventoryItemSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  slot: AvatarEquipmentSlotSchema,
  rarity: AvatarRaritySchema,
  rigFamily: z.string().min(1),
  assetRef: z.string().min(1),
  thumbnailRef: z.string().min(1),
  performanceProfile: AvatarPerformanceProfileSchema,
  conflictsWith: z.array(AvatarEquipmentSlotSchema),
  active: z.boolean(),
  owned: z.boolean(),
  lockedReason: z.string().nullable(),
});
export type AvatarInventoryItem = z.infer<typeof AvatarInventoryItemSchema>;

export const EquippedAvatarItemSchema = z.object({
  slot: AvatarEquipmentSlotSchema,
  item: AvatarInventoryItemSchema,
});
export type EquippedAvatarItem = z.infer<typeof EquippedAvatarItemSchema>;

export const CurrentAvatarResponseSchema = z.object({
  currentAvatar: AvatarCatalogueItemSchema.nullable(),
  catalogue: z.array(AvatarCatalogueItemSchema),
  inventory: z.array(AvatarInventoryItemSchema),
  equipment: z.array(EquippedAvatarItemSchema),
  runtimeStates: z.array(AvatarRuntimeStateSchema),
  performanceProfiles: z.array(AvatarPerformanceProfileSchema),
  reducedMotionSupported: z.literal(true),
  moonDashLegendaryPrizeCompatible: z.literal(true),
});
export type CurrentAvatarResponse = z.infer<typeof CurrentAvatarResponseSchema>;

export const SelectAvatarRequestSchema = z.object({
  avatarId: z.string().min(1),
});
export type SelectAvatarRequest = z.infer<typeof SelectAvatarRequestSchema>;

export const EquipAvatarItemRequestSchema = z.object({
  avatarId: z.string().min(1),
  itemId: z.string().min(1),
});
export type EquipAvatarItemRequest = z.infer<typeof EquipAvatarItemRequestSchema>;

export const UnequipAvatarItemRequestSchema = z.object({
  avatarId: z.string().min(1),
  slot: AvatarEquipmentSlotSchema,
});
export type UnequipAvatarItemRequest = z.infer<typeof UnequipAvatarItemRequestSchema>;
