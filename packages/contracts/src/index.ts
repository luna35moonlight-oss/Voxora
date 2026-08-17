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

/**
 * Voxora Pet Card Race — a card game where pets are the racers.
 *
 * One attempt is a three-race meet and each race needs a different pet. The server owns
 * every shuffle, deal, rival advance, combination evaluation, cooldown check, and score.
 * The client selects cards and animates server-approved results; it never reports a score.
 */
export const PetCardRaceGameId = z.literal('voxora-pet-card-race');
export type PetCardRaceGameId = z.infer<typeof PetCardRaceGameId>;

/** Meets per user per UTC server day. */
export const PetCardRaceDailyLimit = 10;
/** Races in one meet — a different pet must be chosen for each. */
export const PetCardRaceRacesPerMeet = 3;
/**
 * Steps from the starting line to the finish line. Tuned against the 13 cards a race deals:
 * sensible play covers the track with room for the tactics rivals aim at the champion.
 */
export const PetCardRaceTrackLength = 11;
/** Track step of the leading racer that opens each card station. */
export const PetCardRaceStationSteps = [0, 4, 7, 9] as const;
/** Cards dealt at each station — the final station deals one extra card. */
export const PetCardRaceStationDealSizes = [3, 3, 3, 4] as const;
export const PetCardRaceStationCount = 4;
/** Waiting period between card selections. */
export const PetCardRacePlayCooldownMs = 5_000;
/** Latency allowance so an honest client is never rejected for being milliseconds early. */
export const PetCardRacePlayCooldownToleranceMs = 250;
/**
 * One rival run card is revealed on every tick of the server clock, so the three rivals share
 * the stream and each advances roughly every third tick. Tuned so the leading rival reaches the
 * line at about the same time as a player who spends their cards sensibly.
 */
export const PetCardRaceRivalTickMs = 2_000;
/** Wild cards in a race deck. */
export const PetCardRaceJokerCount = 2;
export const PetCardRaceMaxRaceScore = 100;
export const PetCardRaceMaxAcceptedScore = PetCardRaceMaxRaceScore * PetCardRaceRacesPerMeet;
export const PetCardRaceLeaderboardSize = 5;
/** Cards a single selection may contain — one card up to three pairs. */
export const PetCardRaceMaxSelectionSize = 6;

export const PetCardRaceRacerIdSchema = z.enum([
  'shadow-panther',
  'star-kitten',
  'moonlit-wolf',
  'aurora-dragon',
]);
export type PetCardRaceRacerId = z.infer<typeof PetCardRaceRacerIdSchema>;

export const PetCardRaceRacerSchema = z.object({
  racerId: PetCardRaceRacerIdSchema,
  displayName: z.string().min(1),
  speciesFamily: z.string().min(1),
  /** Appearance only. Every racer runs on identical odds — no hidden stat differences. */
  appearance: z.string().min(1),
});
export type PetCardRaceRacer = z.infer<typeof PetCardRaceRacerSchema>;

/**
 * Race roster. These are race-local racer definitions for this game only: they are not
 * pet species records, not user-owned pets, and they grant no ownership or pet progression.
 * Phase 4 Pet Foundation owns real pets and may later map these racers onto real species.
 */
export const PET_CARD_RACE_ROSTER: readonly PetCardRaceRacer[] = [
  {
    racerId: 'shadow-panther',
    displayName: 'Nyx',
    speciesFamily: 'cats',
    appearance: 'Black panther in violet crystal armour with glowing amethyst markings',
  },
  {
    racerId: 'star-kitten',
    displayName: 'Nova',
    speciesFamily: 'cats',
    appearance: 'Fluffy pastel kitten with a lilac star crest and a comet tail',
  },
  {
    racerId: 'moonlit-wolf',
    displayName: 'Lumi',
    speciesFamily: 'canines',
    appearance: 'Silver-white wolf with moonlit crystal jewellery',
  },
  {
    racerId: 'aurora-dragon',
    displayName: 'Kai',
    speciesFamily: 'dragons',
    appearance: 'Teal aurora dragon with luminous green scale lines and a fanned crest',
  },
] as const;

export const PetCardRaceRankSchema = z.enum([
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]);
export type PetCardRaceRank = z.infer<typeof PetCardRaceRankSchema>;

export const PET_CARD_RACE_RANK_ORDER: readonly PetCardRaceRank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;

/** High cards run faster than the rest: each one in a selection adds a step. */
export const PET_CARD_RACE_FAST_RANKS: readonly PetCardRaceRank[] = ['10', 'J', 'Q', 'K'] as const;
export const PetCardRaceFastRankStepBonus = 1;

export const PetCardRaceSuitSchema = z.enum(['MOON', 'STAR', 'CRYSTAL', 'FLAME']);
export type PetCardRaceSuit = z.infer<typeof PetCardRaceSuitSchema>;

export const PetCardRaceTacticKindSchema = z.enum(['CHASER', 'WEIGHTS', 'MUD', 'SHIELD', 'SPRINT']);
export type PetCardRaceTacticKind = z.infer<typeof PetCardRaceTacticKindSchema>;

export const PetCardRaceTacticTargetSchema = z.enum([
  'CHAMPION',
  'ONE_RIVAL',
  'ALL_RIVALS',
  'TRACK',
]);
export type PetCardRaceTacticTarget = z.infer<typeof PetCardRaceTacticTargetSchema>;

export const PetCardRaceTacticDefinitionSchema = z.object({
  kind: PetCardRaceTacticKindSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  affects: PetCardRaceTacticTargetSchema,
  requiresRivalTarget: z.boolean(),
});
export type PetCardRaceTacticDefinition = z.infer<typeof PetCardRaceTacticDefinitionSchema>;

/** Steps a rival loses to weights, mud, or a chaser. */
export const PetCardRaceSlowSteps = 1;
/** Steps a sprint card adds to the champion. */
export const PetCardRaceSprintSteps = 1;
/** Steps ahead of the champion where a mud stretch is laid down. */
export const PetCardRaceMudLeadSteps = 2;

export const PET_CARD_RACE_TACTIC_DEFINITIONS: readonly PetCardRaceTacticDefinition[] = [
  {
    kind: 'CHASER',
    title: 'Trail chaser',
    description:
      'A wild trail animal bursts from the trees and chases one rival off the path: that rival drops back a step and loses its next run card.',
    affects: 'ONE_RIVAL',
    requiresRivalTarget: true,
  },
  {
    kind: 'WEIGHTS',
    title: 'Heavy paws',
    description: 'Weights settle on every rival’s feet: each rival loses its next run card.',
    affects: 'ALL_RIVALS',
    requiresRivalTarget: false,
  },
  {
    kind: 'MUD',
    title: 'Mud stretch',
    description:
      'Mud floods the track ahead of your champion: every rival that reaches it spends a run card slogging through.',
    affects: 'TRACK',
    requiresRivalTarget: false,
  },
  {
    kind: 'SHIELD',
    title: 'Moon shield',
    description: 'A guarding sigil blocks the next rival tactic aimed at your champion.',
    affects: 'CHAMPION',
    requiresRivalTarget: false,
  },
  {
    kind: 'SPRINT',
    title: 'Star sprint',
    description: 'Your champion sprints one extra step immediately.',
    affects: 'CHAMPION',
    requiresRivalTarget: false,
  },
] as const;

export const PetCardRaceCardTypeSchema = z.enum(['RANK', 'JOKER', 'TACTIC']);
export type PetCardRaceCardType = z.infer<typeof PetCardRaceCardTypeSchema>;

export const PetCardRaceCardSchema = z.object({
  /** Unique within a race. Server-issued; the client may only play cards it was dealt. */
  cardId: z.string().min(1),
  type: PetCardRaceCardTypeSchema,
  rank: PetCardRaceRankSchema.nullable(),
  suit: PetCardRaceSuitSchema.nullable(),
  tactic: PetCardRaceTacticKindSchema.nullable(),
  /** True for 10, J, Q, and K — and for a joker standing in for one of them. */
  fast: z.boolean(),
  label: z.string().min(1),
});
export type PetCardRaceCard = z.infer<typeof PetCardRaceCardSchema>;

export const PetCardRaceComboKindSchema = z.enum([
  'SINGLE',
  'PAIR',
  'TWO_PAIR',
  'THREE_OF_A_KIND',
  'RUN_OF_FOUR',
  'THREE_PAIR',
  'FULL_HOUSE',
  'FOUR_OF_A_KIND',
  'TACTIC',
]);
export type PetCardRaceComboKind = z.infer<typeof PetCardRaceComboKindSchema>;

/** Steps a combination is worth before fast-card bonuses. */
export const PET_CARD_RACE_COMBO_BASE_STEPS: Readonly<Record<PetCardRaceComboKind, number>> = {
  SINGLE: 1,
  PAIR: 3,
  TWO_PAIR: 4,
  THREE_OF_A_KIND: 5,
  RUN_OF_FOUR: 6,
  THREE_PAIR: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  TACTIC: 0,
};

export const PET_CARD_RACE_COMBO_LABELS: Readonly<Record<PetCardRaceComboKind, string>> = {
  SINGLE: 'Single card',
  PAIR: 'Pair',
  TWO_PAIR: 'Two pair',
  THREE_OF_A_KIND: 'Three of a kind',
  RUN_OF_FOUR: 'Run of four',
  THREE_PAIR: 'Three pair',
  FULL_HOUSE: 'Full house',
  FOUR_OF_A_KIND: 'Four of a kind',
  TACTIC: 'Tactic card',
};

/** Combinations of a pair or better earn meet score in addition to track steps. */
export const PetCardRaceComboScorePoints = 3;
export const PetCardRaceComboScoreCap = 30;
export const PetCardRaceTacticScorePoints = 4;
export const PetCardRaceTacticScoreCap = 16;
export const PET_CARD_RACE_POSITION_POINTS: readonly number[] = [40, 25, 12, 5] as const;
export const PetCardRaceMarginBonusPerStep = 2;
export const PetCardRaceMarginBonusCap = 10;
export const PetCardRacePhotoFinishBonus = 4;

export const PetCardRaceLaneSchema = z.object({
  racerId: PetCardRaceRacerIdSchema,
  isChampion: z.boolean(),
  step: z.number().int().min(0).max(PetCardRaceTrackLength),
  /** Steps this racer loses to weights, mud, or a chaser before it moves again. */
  slowedSteps: z.number().int().min(0),
  shielded: z.boolean(),
  finishPosition: z.number().int().min(1).max(4).nullable(),
});
export type PetCardRaceLane = z.infer<typeof PetCardRaceLaneSchema>;

export const PetCardRaceEventTypeSchema = z.enum([
  'RACE_START',
  'STATION_DEAL',
  'CARDS_PLAYED',
  'CHAMPION_ADVANCE',
  'RIVAL_ADVANCE',
  'SLOWED',
  'MUD_HIT',
  'TACTIC_PLAYED',
  'RIVAL_TACTIC',
  'SHIELD_BLOCKED',
  'RACER_FINISHED',
  'RACE_COMPLETE',
]);
export type PetCardRaceEventType = z.infer<typeof PetCardRaceEventTypeSchema>;

export const PetCardRaceEventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  type: PetCardRaceEventTypeSchema,
  racerId: PetCardRaceRacerIdSchema.nullable(),
  step: z.number().int().min(0).max(PetCardRaceTrackLength).nullable(),
  message: z.string().min(1),
});
export type PetCardRaceEvent = z.infer<typeof PetCardRaceEventSchema>;

export const PetCardRacePhaseSchema = z.enum(['RUNNING', 'FINISHED', 'FORFEITED']);
export type PetCardRacePhase = z.infer<typeof PetCardRacePhaseSchema>;

export const PetCardRaceMeetPhaseSchema = z.enum([
  'RACING',
  'RACE_INTERMISSION',
  'COMPLETE',
  'FORFEITED',
]);
export type PetCardRaceMeetPhase = z.infer<typeof PetCardRaceMeetPhaseSchema>;

export const PetCardRaceFinishSchema = z.object({
  racerId: PetCardRaceRacerIdSchema,
  position: z.number().int().min(1).max(4),
  step: z.number().int().min(0).max(PetCardRaceTrackLength),
  crossedLine: z.boolean(),
});
export type PetCardRaceFinish = z.infer<typeof PetCardRaceFinishSchema>;

export const PetCardRaceScoreBreakdownSchema = z.object({
  positionPoints: z.number().int().nonnegative(),
  comboPoints: z.number().int().nonnegative(),
  tacticPoints: z.number().int().nonnegative(),
  marginBonus: z.number().int().nonnegative(),
  photoFinishBonus: z.number().int().nonnegative(),
  total: z.number().int().min(0).max(PetCardRaceMaxRaceScore),
});
export type PetCardRaceScoreBreakdown = z.infer<typeof PetCardRaceScoreBreakdownSchema>;

export const PetCardRaceRaceResultSchema = z.object({
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  championRacerId: PetCardRaceRacerIdSchema,
  championPosition: z.number().int().min(1).max(4),
  championCrossedLine: z.boolean(),
  order: z.array(PetCardRaceFinishSchema).length(4),
  combosPlayed: z.number().int().nonnegative(),
  tacticsPlayed: z.number().int().nonnegative(),
  photoFinish: z.boolean(),
  score: z.number().int().min(0).max(PetCardRaceMaxRaceScore),
  breakdown: PetCardRaceScoreBreakdownSchema,
});
export type PetCardRaceRaceResult = z.infer<typeof PetCardRaceRaceResultSchema>;

export const PetCardRaceSelectionPreviewSchema = z.object({
  valid: z.boolean(),
  kind: PetCardRaceComboKindSchema.nullable(),
  label: z.string().min(1),
  baseSteps: z.number().int().nonnegative(),
  fastBonus: z.number().int().nonnegative(),
  steps: z.number().int().nonnegative(),
  reason: z.string().nullable(),
});
export type PetCardRaceSelectionPreview = z.infer<typeof PetCardRaceSelectionPreviewSchema>;

export const PetCardRaceRaceViewSchema = z.object({
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  phase: PetCardRacePhaseSchema,
  championRacerId: PetCardRaceRacerIdSchema,
  trackLength: z.literal(PetCardRaceTrackLength),
  lanes: z.array(PetCardRaceLaneSchema).length(4),
  mudSteps: z.array(z.number().int().min(0).max(PetCardRaceTrackLength)),
  hand: z.array(PetCardRaceCardSchema),
  cardsLeftToDeal: z.number().int().nonnegative(),
  stationsDealt: z.number().int().min(0).max(PetCardRaceStationCount),
  stationsTotal: z.literal(PetCardRaceStationCount),
  /** Server-approved events since the previous call, in animation order. */
  events: z.array(PetCardRaceEventSchema),
  /** Remaining wait before the next selection is accepted. */
  cooldownRemainingMs: z.number().int().min(0),
  nextRivalTickInMs: z.number().int().min(0).nullable(),
  combosPlayed: z.number().int().nonnegative(),
  tacticsPlayed: z.number().int().nonnegative(),
  result: PetCardRaceRaceResultSchema.nullable(),
});
export type PetCardRaceRaceView = z.infer<typeof PetCardRaceRaceViewSchema>;

export const PetCardRaceMeetResultSchema = z.object({
  totalScore: z.number().int().min(0).max(PetCardRaceMaxAcceptedScore),
  bestPosition: z.number().int().min(1).max(4),
  wins: z.number().int().min(0).max(PetCardRaceRacesPerMeet),
  races: z.array(PetCardRaceRaceResultSchema).max(PetCardRaceRacesPerMeet),
});
export type PetCardRaceMeetResult = z.infer<typeof PetCardRaceMeetResultSchema>;

export const PetCardRaceMeetViewSchema = z.object({
  attemptId: z.string().min(1),
  attemptNumber: z.number().int().min(1).max(PetCardRaceDailyLimit),
  meetPhase: PetCardRaceMeetPhaseSchema,
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  racesTotal: z.literal(PetCardRaceRacesPerMeet),
  usedRacerIds: z.array(PetCardRaceRacerIdSchema).max(PetCardRaceRacesPerMeet),
  availableRacerIds: z.array(PetCardRaceRacerIdSchema),
  currentRace: PetCardRaceRaceViewSchema.nullable(),
  completedRaces: z.array(PetCardRaceRaceResultSchema).max(PetCardRaceRacesPerMeet),
  meetScore: z.number().int().min(0).max(PetCardRaceMaxAcceptedScore),
  result: PetCardRaceMeetResultSchema.nullable(),
});
export type PetCardRaceMeetView = z.infer<typeof PetCardRaceMeetViewSchema>;

export const PetCardRaceLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerLabel: z.string().min(1),
  score: z.number().int().nonnegative(),
});
export type PetCardRaceLeaderboardEntry = z.infer<typeof PetCardRaceLeaderboardEntrySchema>;

/** Prizes, currencies, and pet progression for this game are undefined — see open-questions.md. */
export const PetCardRaceRewardStatusSchema = z.literal('REWARD_RULES_PENDING_OWNER_DECISION');
export type PetCardRaceRewardStatus = z.infer<typeof PetCardRaceRewardStatusSchema>;

export const PetCardRaceStatusResponseSchema = z.object({
  gameId: PetCardRaceGameId,
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dailyAttemptLimit: z.literal(PetCardRaceDailyLimit),
  attemptsUsedToday: z.number().int().min(0).max(PetCardRaceDailyLimit),
  attemptsRemainingToday: z.number().int().min(0).max(PetCardRaceDailyLimit),
  racesPerMeet: z.literal(PetCardRaceRacesPerMeet),
  bestScore: z.number().int().nonnegative(),
  bestRank: z.number().int().positive().nullable(),
  rewardStatus: PetCardRaceRewardStatusSchema,
  rewardNote: z.string().min(1),
  leaderboard: z.array(PetCardRaceLeaderboardEntrySchema).max(PetCardRaceLeaderboardSize),
  roster: z.array(PetCardRaceRacerSchema).length(4),
  serverTime: z.string(),
});
export type PetCardRaceStatusResponse = z.infer<typeof PetCardRaceStatusResponseSchema>;

export const StartPetCardRaceMeetRequestSchema = z.object({
  championRacerId: PetCardRaceRacerIdSchema,
});
export type StartPetCardRaceMeetRequest = z.infer<typeof StartPetCardRaceMeetRequestSchema>;

export const StartNextPetCardRaceRequestSchema = z.object({
  championRacerId: PetCardRaceRacerIdSchema,
});
export type StartNextPetCardRaceRequest = z.infer<typeof StartNextPetCardRaceRequestSchema>;

export const PlayPetCardRaceCardsRequestSchema = z.object({
  cardIds: z.array(z.string().min(1)).min(1).max(PetCardRaceMaxSelectionSize),
  targetRacerId: PetCardRaceRacerIdSchema.optional(),
});
export type PlayPetCardRaceCardsRequest = z.infer<typeof PlayPetCardRaceCardsRequestSchema>;

export const PetCardRaceResponseSchema = z.object({
  meet: PetCardRaceMeetViewSchema,
  status: PetCardRaceStatusResponseSchema,
});
export type PetCardRaceResponse = z.infer<typeof PetCardRaceResponseSchema>;

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
