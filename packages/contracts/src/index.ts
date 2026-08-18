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
 * Voxora Pet Card Race — a live race where the pets run continuously and cards influence the race.
 *
 * All four pets run from the moment the countdown ends, under server-authoritative simulation. The
 * player's cards change speed, place obstacles, hinder rivals, and defend their own pet: they do not
 * create the movement. The client renders and interpolates; the server owns every position.
 *
 * Numbers the Owner has not approved live in `PET_CARD_RACE_BALANCE` so they can be reviewed and
 * changed in one place. Anything marked OWNER APPROVED comes from an explicit owner instruction.
 */
export const PetCardRaceGameId = z.literal('voxora-pet-card-race');
export type PetCardRaceGameId = z.infer<typeof PetCardRaceGameId>;

/** OWNER APPROVED — meets per user per UTC server day. */
export const PetCardRaceDailyLimit = 10;
/** OWNER APPROVED — races in one meet. */
export const PetCardRaceRacesPerMeet = 3;
/** OWNER APPROVED — cards in the opening deal, influenced by the chosen pet. */
export const PetCardRaceOpeningDealSize = 8;
/** OWNER APPROVED — four normal checkpoints of three cards, then a final checkpoint of four. */
export const PetCardRaceNormalCheckpointCount = 4;
export const PetCardRaceNormalCheckpointCards = 3;
export const PetCardRaceFinalCheckpointCards = 4;
export const PetCardRaceCheckpointCount = PetCardRaceNormalCheckpointCount + 1;
/** OWNER APPROVED — wait after a committed play, not between selecting cards of one play. */
export const PetCardRacePlayCooldownMs = 5_000;
/** Latency allowance so an honest client is never rejected for being milliseconds early. */
export const PetCardRacePlayCooldownToleranceMs = 250;
/** OWNER APPROVED — wild cards in the pool. */
export const PetCardRaceJokerCount = 2;
/** Cards a single selection may contain — one card up to three pairs. */
export const PetCardRaceMaxSelectionSize = 6;
/**
 * How often the client asks the server for an authoritative snapshot. Between snapshots it keeps the
 * pets running by extrapolating from the reported speed, so the race never looks like it stalls.
 */
export const PetCardRaceSyncIntervalMs = 1_500;
export const PetCardRaceLeaderboardSize = 5;

/** Total cards a race deals: the opening deal plus every checkpoint. */
export const PetCardRaceCardsPerRace =
  PetCardRaceOpeningDealSize +
  PetCardRaceNormalCheckpointCount * PetCardRaceNormalCheckpointCards +
  PetCardRaceFinalCheckpointCards;

/**
 * Every gameplay value the Owner has **not** approved, in one reviewable place.
 *
 * PROVISIONAL — OWNER APPROVAL REQUIRED for each entry below. They were chosen only so the race can
 * be played and reviewed; none of them should be quoted back as an owner rule.
 */
export const PET_CARD_RACE_BALANCE = {
  /** Course length. Pets cover this distance; the client renders it as a fraction. */
  courseMetres: 700,
  /** Speed every racer runs at before any card, effect, or pace variation. */
  baseSpeedMetresPerSecond: 8,
  /** House racers breathe around the base speed so the pack shuffles without random jumps. */
  housePaceAmplitude: 0.12,
  housePacePeriodMs: 9_000,
  /** 3 → 2 → 1 → GO before the pets launch. */
  countdownMs: 3_200,
  /** Server simulation resolution. Smaller is smoother and costs more work per request. */
  simulationStepMs: 100,
  /** Fractions of the course where cards are delivered. The last entry is the final checkpoint. */
  checkpointFractions: [0.18, 0.36, 0.54, 0.72, 0.88],
  /** Speed multiplier and duration granted by each combination. */
  comboBoosts: {
    SINGLE: { multiplier: 1.06, durationMs: 3_000 },
    PAIR: { multiplier: 1.18, durationMs: 4_000 },
    TWO_PAIR: { multiplier: 1.26, durationMs: 4_500 },
    THREE_OF_A_KIND: { multiplier: 1.32, durationMs: 5_000 },
    RUN_OF_FOUR: { multiplier: 1.42, durationMs: 5_000 },
    THREE_PAIR: { multiplier: 1.44, durationMs: 5_500 },
    FULL_HOUSE: { multiplier: 1.52, durationMs: 6_000 },
    FOUR_OF_A_KIND: { multiplier: 1.65, durationMs: 6_500 },
  },
  /** Extra multiplier per high card (10, J, Q, K) inside a played combination, and its ceiling. */
  fastCardBonusPerCard: 0.04,
  fastCardBonusCap: 0.12,
  /** Tactic card effects. */
  tactics: {
    SPRINT: { multiplier: 1.6, durationMs: 3_500 },
    WEIGHTS: { multiplier: 0.74, durationMs: 4_500 },
    CHASER: { multiplier: 0.62, durationMs: 4_000 },
    MUD: { multiplier: 0.55, lengthMetres: 55, aheadMetres: 70 },
    /** A shield holds until it blocks one rival tactic rather than expiring on a timer. */
    SHIELD: { blocksOneTactic: true },
  },
  /** Race score weights. */
  scoring: {
    positionPoints: [40, 25, 12, 5],
    comboPoints: 3,
    comboPointsCap: 30,
    tacticPoints: 4,
    tacticPointsCap: 16,
    marginPointsPerTenMetres: 1,
    marginPointsCap: 10,
    photoFinishMetres: 12,
    photoFinishPoints: 4,
    maxRaceScore: 100,
  },
} as const;

export const PetCardRaceMaxRaceScore = PET_CARD_RACE_BALANCE.scoring.maxRaceScore;
export const PetCardRaceMaxAcceptedScore = PetCardRaceMaxRaceScore * PetCardRaceRacesPerMeet;

/**
 * Development racer identities.
 *
 * PLACEHOLDERS ONLY. The Pet Card Race must ultimately race the player's real pet from the Phase 4
 * Pet Foundation: these entries exist so the race can be built and reviewed before that system
 * exists, and they are reported to the client as `DEVELOPMENT_PLACEHOLDER` so nothing pretends to be
 * an owned pet. They are not a permanent second pet ecosystem.
 */
export const PetCardRacePetIdSchema = z.enum([
  'shadow-panther',
  'star-kitten',
  'moonlit-wolf',
  'aurora-dragon',
]);
export type PetCardRacePetId = z.infer<typeof PetCardRacePetIdSchema>;

/** Body plan that drives the running animation, so a panther never runs as a wolf. */
export const PetCardRaceSilhouetteSchema = z.enum(['PANTHER', 'SMALL_MYSTIC', 'WOLF', 'DRAGON']);
export type PetCardRaceSilhouette = z.infer<typeof PetCardRaceSilhouetteSchema>;

export const PetCardRacePetSourceSchema = z.enum(['PET_FOUNDATION', 'DEVELOPMENT_PLACEHOLDER']);
export type PetCardRacePetSource = z.infer<typeof PetCardRacePetSourceSchema>;

export const PetCardRacePaletteSchema = z.object({
  body: z.string().min(4),
  shade: z.string().min(4),
  accent: z.string().min(4),
  eye: z.string().min(4),
});
export type PetCardRacePalette = z.infer<typeof PetCardRacePaletteSchema>;

export const PetCardRacePetSchema = z.object({
  /** Pet Foundation instance id once integrated; a placeholder key until then. */
  petId: PetCardRacePetIdSchema,
  displayName: z.string().min(1),
  speciesFamily: z.string().min(1),
  appearance: z.string().min(1),
  silhouette: PetCardRaceSilhouetteSchema,
  palette: PetCardRacePaletteSchema,
  /** Pet → race profile → opening hand influence. */
  raceProfileKey: z.string().min(1),
  source: PetCardRacePetSourceSchema,
});
export type PetCardRacePet = z.infer<typeof PetCardRacePetSchema>;

/**
 * Pet → Race Profile → opening hand influence.
 *
 * The structure is deliberately data-driven so different pets can later carry different racing
 * personalities. `approved` is false everywhere until the Owner defines real weightings; today every
 * profile carries the same neutral mix so no pet is secretly stronger than another.
 */
export const PetCardRaceRaceProfileSchema = z.object({
  profileKey: z.string().min(1),
  displayName: z.string().min(1),
  summary: z.string().min(1),
  openingMix: z.object({
    runCards: z.number().int().nonnegative(),
    tacticCards: z.number().int().nonnegative(),
  }),
  /** False until the Owner approves per-pet weightings. The client must say so honestly. */
  approved: z.literal(false),
});
export type PetCardRaceRaceProfile = z.infer<typeof PetCardRaceRaceProfileSchema>;

export const PET_CARD_RACE_NEUTRAL_PROFILE_KEY = 'neutral-provisional';

export const PET_CARD_RACE_RACE_PROFILES: readonly PetCardRaceRaceProfile[] = [
  {
    profileKey: PET_CARD_RACE_NEUTRAL_PROFILE_KEY,
    displayName: 'Neutral trial profile',
    summary:
      'Every pet currently opens on the same neutral mix. Per-pet racing personalities are not defined yet.',
    openingMix: { runCards: 6, tacticCards: 2 },
    approved: false,
  },
] as const;

export const PET_CARD_RACE_PETS: readonly PetCardRacePet[] = [
  {
    petId: 'shadow-panther',
    displayName: 'Nyx',
    speciesFamily: 'panther',
    appearance: 'Black panther in violet crystal armour with glowing amethyst markings',
    silhouette: 'PANTHER',
    palette: { body: '#4A3680', shade: '#6B51B0', accent: '#C4B5FD', eye: '#F5F3FF' },
    raceProfileKey: PET_CARD_RACE_NEUTRAL_PROFILE_KEY,
    source: 'DEVELOPMENT_PLACEHOLDER',
  },
  {
    petId: 'star-kitten',
    displayName: 'Nova',
    speciesFamily: 'mystic feline',
    appearance: 'Fluffy pastel creature with a lilac star crest and a comet tail',
    silhouette: 'SMALL_MYSTIC',
    palette: { body: '#E6D8FF', shade: '#F7EDFF', accent: '#FF9BD2', eye: '#6D28D9' },
    raceProfileKey: PET_CARD_RACE_NEUTRAL_PROFILE_KEY,
    source: 'DEVELOPMENT_PLACEHOLDER',
  },
  {
    petId: 'moonlit-wolf',
    displayName: 'Lumi',
    speciesFamily: 'wolf',
    appearance: 'Silver-white wolf with moonlit crystal jewellery',
    silhouette: 'WOLF',
    palette: { body: '#EEF3FF', shade: '#CBD8FF', accent: '#A5B4FC', eye: '#6D28D9' },
    raceProfileKey: PET_CARD_RACE_NEUTRAL_PROFILE_KEY,
    source: 'DEVELOPMENT_PLACEHOLDER',
  },
  {
    petId: 'aurora-dragon',
    displayName: 'Kai',
    speciesFamily: 'dragon-lizard',
    appearance: 'Teal aurora dragon with luminous green scale lines and a fanned crest',
    silhouette: 'DRAGON',
    palette: { body: '#1F9E93', shade: '#2DD4BF', accent: '#86EFAC', eye: '#0B4F45' },
    raceProfileKey: PET_CARD_RACE_NEUTRAL_PROFILE_KEY,
    source: 'DEVELOPMENT_PLACEHOLDER',
  },
] as const;

export const PetCardRaceTacticKindSchema = z.enum(['CHASER', 'WEIGHTS', 'MUD', 'SHIELD', 'SPRINT']);
export type PetCardRaceTacticKind = z.infer<typeof PetCardRaceTacticKindSchema>;

export const PetCardRaceTacticTargetSchema = z.enum([
  'OWN_PET',
  'ONE_RIVAL',
  'ALL_RIVALS',
  'COURSE',
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

export const PET_CARD_RACE_TACTIC_DEFINITIONS: readonly PetCardRaceTacticDefinition[] = [
  {
    kind: 'CHASER',
    title: 'Trail chaser',
    description:
      'A wild trail animal bursts into the race and chases one chosen rival, breaking its stride until it shakes the chaser off.',
    affects: 'ONE_RIVAL',
    requiresRivalTarget: true,
  },
  {
    kind: 'WEIGHTS',
    title: 'Heavy paws',
    description:
      'Weights drag at every rival’s feet: their run turns heavy and laboured until the weights wear off.',
    affects: 'ALL_RIVALS',
    requiresRivalTarget: false,
  },
  {
    kind: 'MUD',
    title: 'Mud stretch',
    description:
      'A stretch of mud appears on the course ahead: rivals that run into it slog through and lose pace until they are clear.',
    affects: 'COURSE',
    requiresRivalTarget: false,
  },
  {
    kind: 'SHIELD',
    title: 'Moon shield',
    description:
      'A guarding field surrounds your pet and blocks the next rival tactic aimed at it.',
    affects: 'OWN_PET',
    requiresRivalTarget: false,
  },
  {
    kind: 'SPRINT',
    title: 'Star sprint',
    description: 'Your pet surges into an immediate sprint.',
    affects: 'OWN_PET',
    requiresRivalTarget: false,
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

/** OWNER APPROVED — 10, J, Q, and K run faster than the rest of the pool. */
export const PET_CARD_RACE_FAST_RANKS: readonly PetCardRaceRank[] = ['10', 'J', 'Q', 'K'] as const;

export const PetCardRaceSuitSchema = z.enum(['MOON', 'STAR', 'CRYSTAL', 'FLAME']);
export type PetCardRaceSuit = z.infer<typeof PetCardRaceSuitSchema>;

export const PetCardRaceCardTypeSchema = z.enum(['RANK', 'JOKER', 'TACTIC']);
export type PetCardRaceCardType = z.infer<typeof PetCardRaceCardTypeSchema>;

export const PetCardRaceCardSchema = z.object({
  /** Unique within a race. Server-issued; a client may only play cards it was dealt. */
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

export const PET_CARD_RACE_COMBO_LABELS: Readonly<Record<PetCardRaceComboKind, string>> = {
  SINGLE: 'Single card',
  PAIR: 'Pair',
  TWO_PAIR: 'Two pair',
  THREE_OF_A_KIND: 'Three of a kind',
  RUN_OF_FOUR: 'Sequence of four',
  THREE_PAIR: 'Three pairs',
  FULL_HOUSE: 'Full house',
  FOUR_OF_A_KIND: 'Four of a kind',
  TACTIC: 'Tactic card',
};

/** What a selection is worth: a speed boost for a duration, not a jump along the course. */
export const PetCardRaceSelectionPreviewSchema = z.object({
  valid: z.boolean(),
  kind: PetCardRaceComboKindSchema.nullable(),
  label: z.string().min(1),
  /** Speed multiplier applied to the pet while the boost lasts, 1 means no change. */
  speedMultiplier: z.number().nonnegative(),
  fastCardBonus: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  reason: z.string().nullable(),
});
export type PetCardRaceSelectionPreview = z.infer<typeof PetCardRaceSelectionPreviewSchema>;

export const PetCardRaceStatusEffectSchema = z.object({
  kind: z.enum(['BOOST', 'SPRINT', 'WEIGHTS', 'CHASED', 'MUD', 'SHIELDED']),
  multiplier: z.number().nonnegative(),
  endsInMs: z.number().int().nonnegative(),
});
export type PetCardRaceStatusEffect = z.infer<typeof PetCardRaceStatusEffectSchema>;

export const PetCardRaceTrainerKindSchema = z.enum(['PLAYER', 'HOUSE']);
export type PetCardRaceTrainerKind = z.infer<typeof PetCardRaceTrainerKindSchema>;

/**
 * One competitor: a trainer identity paired with the pet that runs for them.
 *
 * `HOUSE` trainers are Voxora's own race entrants, not other people. Multiplayer against real
 * players is a later phase and this game never pretends a house racer is a human opponent.
 */
export const PetCardRaceCompetitorSchema = z.object({
  competitorId: z.string().min(1),
  trainerKind: PetCardRaceTrainerKindSchema,
  isYou: z.boolean(),
  trainerName: z.string().min(1),
  trainerAvatarId: z.string().min(1).nullable(),
  trainerAvatarName: z.string().min(1).nullable(),
  pet: PetCardRacePetSchema,
  progressMetres: z.number().nonnegative(),
  progressFraction: z.number().min(0).max(1),
  /** Live speed, so the client can interpolate smoothly between syncs. */
  speedMetresPerSecond: z.number().nonnegative(),
  speedMultiplier: z.number().nonnegative(),
  position: z.number().int().min(1).max(4),
  statuses: z.array(PetCardRaceStatusEffectSchema),
  finishPosition: z.number().int().min(1).max(4).nullable(),
  finishTimeMs: z.number().int().nonnegative().nullable(),
});
export type PetCardRaceCompetitor = z.infer<typeof PetCardRaceCompetitorSchema>;

export const PetCardRaceCheckpointSchema = z.object({
  index: z.number().int().min(1).max(PetCardRaceCheckpointCount),
  atMetres: z.number().nonnegative(),
  atFraction: z.number().min(0).max(1),
  cardsAwarded: z.number().int().positive(),
  isFinal: z.boolean(),
  reached: z.boolean(),
});
export type PetCardRaceCheckpoint = z.infer<typeof PetCardRaceCheckpointSchema>;

export const PetCardRaceObstacleSchema = z.object({
  obstacleId: z.string().min(1),
  kind: z.literal('MUD'),
  startMetres: z.number().nonnegative(),
  endMetres: z.number().nonnegative(),
  affectsYou: z.boolean(),
});
export type PetCardRaceObstacle = z.infer<typeof PetCardRaceObstacleSchema>;

export const PetCardRaceEventTypeSchema = z.enum([
  'COUNTDOWN',
  'RACE_START',
  'CARDS_PLAYED',
  'SPEED_BOOST',
  'SPRINT',
  'WEIGHTS',
  'CHASER',
  'MUD_PLACED',
  'MUD_HIT',
  'SHIELD_RAISED',
  'SHIELD_BLOCKED',
  'RIVAL_TACTIC',
  'CHECKPOINT_CARDS',
  'OVERTAKE',
  'FINISH',
  'RACE_COMPLETE',
]);
export type PetCardRaceEventType = z.infer<typeof PetCardRaceEventTypeSchema>;

/** A race event the client should show, not merely a log line. */
export const PetCardRaceEventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  type: PetCardRaceEventTypeSchema,
  competitorId: z.string().min(1).nullable(),
  targetCompetitorId: z.string().min(1).nullable(),
  atMetres: z.number().nonnegative().nullable(),
  atMs: z.number().int().nonnegative(),
  message: z.string().min(1),
});
export type PetCardRaceEvent = z.infer<typeof PetCardRaceEventSchema>;

export const PetCardRacePhaseSchema = z.enum(['COUNTDOWN', 'RUNNING', 'FINISHED', 'FORFEITED']);
export type PetCardRacePhase = z.infer<typeof PetCardRacePhaseSchema>;

export const PetCardRaceMeetPhaseSchema = z.enum([
  'PET_SELECTION',
  'RACING',
  'RACE_RESULT',
  'COMPLETE',
  'FORFEITED',
]);
export type PetCardRaceMeetPhase = z.infer<typeof PetCardRaceMeetPhaseSchema>;

export const PetCardRaceFinishSchema = z.object({
  competitorId: z.string().min(1),
  petId: PetCardRacePetIdSchema,
  trainerName: z.string().min(1),
  isYou: z.boolean(),
  position: z.number().int().min(1).max(4),
  progressMetres: z.number().nonnegative(),
  crossedLine: z.boolean(),
  finishTimeMs: z.number().int().nonnegative().nullable(),
});
export type PetCardRaceFinish = z.infer<typeof PetCardRaceFinishSchema>;

export const PetCardRaceScoreBreakdownSchema = z.object({
  positionPoints: z.number().int().nonnegative(),
  comboPoints: z.number().int().nonnegative(),
  tacticPoints: z.number().int().nonnegative(),
  marginPoints: z.number().int().nonnegative(),
  photoFinishPoints: z.number().int().nonnegative(),
  total: z.number().int().min(0).max(PetCardRaceMaxRaceScore),
});
export type PetCardRaceScoreBreakdown = z.infer<typeof PetCardRaceScoreBreakdownSchema>;

export const PetCardRaceRaceResultSchema = z.object({
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  petId: PetCardRacePetIdSchema,
  yourPosition: z.number().int().min(1).max(4),
  crossedLine: z.boolean(),
  order: z.array(PetCardRaceFinishSchema).length(4),
  combosPlayed: z.number().int().nonnegative(),
  tacticsPlayed: z.number().int().nonnegative(),
  photoFinish: z.boolean(),
  marginMetres: z.number(),
  score: z.number().int().min(0).max(PetCardRaceMaxRaceScore),
  breakdown: PetCardRaceScoreBreakdownSchema,
});
export type PetCardRaceRaceResult = z.infer<typeof PetCardRaceRaceResultSchema>;

export const PetCardRaceRaceViewSchema = z.object({
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  phase: PetCardRacePhaseSchema,
  /** Remaining 3 → 2 → 1 → GO time; zero once the pets are running. */
  countdownRemainingMs: z.number().int().min(0),
  courseMetres: z.number().positive(),
  checkpoints: z.array(PetCardRaceCheckpointSchema).length(PetCardRaceCheckpointCount),
  competitors: z.array(PetCardRaceCompetitorSchema).length(4),
  obstacles: z.array(PetCardRaceObstacleSchema),
  hand: z.array(PetCardRaceCardSchema),
  cardsLeftToDeal: z.number().int().nonnegative(),
  checkpointsReached: z.number().int().min(0).max(PetCardRaceCheckpointCount),
  /** Race events since the previous call, in order, for the client to animate. */
  events: z.array(PetCardRaceEventSchema),
  cooldownRemainingMs: z.number().int().min(0),
  /** Server clock at the moment of this snapshot, so the client can extrapolate positions. */
  serverTimeMs: z.number().int().nonnegative(),
  raceElapsedMs: z.number().int().nonnegative(),
  combosPlayed: z.number().int().nonnegative(),
  tacticsPlayed: z.number().int().nonnegative(),
  result: PetCardRaceRaceResultSchema.nullable(),
});
export type PetCardRaceRaceView = z.infer<typeof PetCardRaceRaceViewSchema>;

export const PetCardRaceStandingSchema = z.object({
  competitorId: z.string().min(1),
  trainerName: z.string().min(1),
  isYou: z.boolean(),
  points: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
});
export type PetCardRaceStanding = z.infer<typeof PetCardRaceStandingSchema>;

export const PetCardRaceMeetResultSchema = z.object({
  totalScore: z.number().int().min(0).max(PetCardRaceMaxAcceptedScore),
  bestPosition: z.number().int().min(1).max(4),
  wins: z.number().int().min(0).max(PetCardRaceRacesPerMeet),
  races: z.array(PetCardRaceRaceResultSchema).max(PetCardRaceRacesPerMeet),
  standings: z.array(PetCardRaceStandingSchema),
});
export type PetCardRaceMeetResult = z.infer<typeof PetCardRaceMeetResultSchema>;

export const PetCardRaceMeetViewSchema = z.object({
  attemptId: z.string().min(1),
  attemptNumber: z.number().int().min(1).max(PetCardRaceDailyLimit),
  meetPhase: PetCardRaceMeetPhaseSchema,
  raceNumber: z.number().int().min(1).max(PetCardRaceRacesPerMeet),
  racesTotal: z.literal(PetCardRaceRacesPerMeet),
  usedPetIds: z.array(PetCardRacePetIdSchema).max(PetCardRaceRacesPerMeet),
  selectablePetIds: z.array(PetCardRacePetIdSchema),
  currentRace: PetCardRaceRaceViewSchema.nullable(),
  completedRaces: z.array(PetCardRaceRaceResultSchema).max(PetCardRaceRacesPerMeet),
  standings: z.array(PetCardRaceStandingSchema),
  meetScore: z.number().int().min(0).max(PetCardRaceMaxAcceptedScore),
  result: PetCardRaceMeetResultSchema.nullable(),
});
export type PetCardRaceMeetView = z.infer<typeof PetCardRaceMeetViewSchema>;

/**
 * The Voxora avatar that enters the race. Read from the one avatar selection the Avatar Foundation
 * owns — this game keeps no avatar state of its own.
 */
export const PetCardRaceTrainerAvatarSchema = z.object({
  avatarId: z.string().min(1),
  displayName: z.string().min(1),
  thumbnailRef: z.string().min(1),
});
export type PetCardRaceTrainerAvatar = z.infer<typeof PetCardRaceTrainerAvatarSchema>;

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
  /** Avatar that enters the race, or null until the player has one. */
  trainerAvatar: PetCardRaceTrainerAvatarSchema.nullable(),
  /** Racers available today, with the honest note that they are development placeholders. */
  pets: z.array(PetCardRacePetSchema).length(4),
  raceProfiles: z.array(PetCardRaceRaceProfileSchema),
  petFoundationIntegrated: z.literal(false),
  bestScore: z.number().int().nonnegative(),
  bestRank: z.number().int().positive().nullable(),
  raceWins: z.number().int().nonnegative(),
  rewardStatus: PetCardRaceRewardStatusSchema,
  rewardNote: z.string().min(1),
  leaderboard: z.array(PetCardRaceLeaderboardEntrySchema).max(PetCardRaceLeaderboardSize),
  serverTime: z.string(),
});
export type PetCardRaceStatusResponse = z.infer<typeof PetCardRaceStatusResponseSchema>;

export const StartPetCardRaceMeetRequestSchema = z.object({
  petId: PetCardRacePetIdSchema,
});
export type StartPetCardRaceMeetRequest = z.infer<typeof StartPetCardRaceMeetRequestSchema>;

export const StartNextPetCardRaceRequestSchema = z.object({
  petId: PetCardRacePetIdSchema,
});
export type StartNextPetCardRaceRequest = z.infer<typeof StartNextPetCardRaceRequestSchema>;

export const PlayPetCardRaceCardsRequestSchema = z.object({
  cardIds: z.array(z.string().min(1)).min(1).max(PetCardRaceMaxSelectionSize),
  targetCompetitorId: z.string().min(1).optional(),
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
