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

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  roles: z.array(RoleName),
  mfaEnabled: z.boolean(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

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

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  correlationId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

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
