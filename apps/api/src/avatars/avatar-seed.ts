import type { AvatarEquipmentSlot } from '@voxora/contracts';

export const PHASE3_RIG_FAMILY = 'humanoid_v1';
export const STARTER_AVATAR_ID = 'voxora-guide';
export const MOON_DASH_LEGENDARY_AVATAR_ID = 'moon-dash-legendary';

export const phase3Avatars = [
  {
    id: STARTER_AVATAR_ID,
    displayName: 'Voxora Guide',
    tier: 'BASIC',
    rarity: 'COMMON',
    rigFamily: PHASE3_RIG_FAMILY,
    riveAssetRef: 'rive://avatars/voxora-guide-v1',
    thumbnailRef: 'asset://avatars/voxora-guide-thumb',
    entitlementCapability: 'avatar.basic',
    active: true,
    version: 1,
    performanceProfile: 'STANDARD',
    fallbackAvatarId: null,
  },
  {
    id: MOON_DASH_LEGENDARY_AVATAR_ID,
    displayName: 'Moon Dash Legendary',
    tier: 'LEGENDARY',
    rarity: 'LEGENDARY',
    rigFamily: PHASE3_RIG_FAMILY,
    riveAssetRef: 'rive://avatars/moon-dash-legendary-v1',
    thumbnailRef: 'asset://avatars/moon-dash-legendary-thumb',
    entitlementCapability: 'avatar.legendary',
    active: true,
    version: 1,
    performanceProfile: 'STANDARD',
    fallbackAvatarId: STARTER_AVATAR_ID,
  },
] as const;

export const phase3Items = [
  {
    id: 'silver-wave-hair',
    displayName: 'Silver Wave Hair',
    slot: 'HAIR' satisfies AvatarEquipmentSlot,
    rarity: 'COMMON',
    rigFamily: PHASE3_RIG_FAMILY,
    assetRef: 'rive://items/silver-wave-hair-v1',
    thumbnailRef: 'asset://items/silver-wave-hair-thumb',
    active: true,
    version: 1,
    performanceProfile: 'STANDARD',
    conflictsWith: [] satisfies AvatarEquipmentSlot[],
  },
  {
    id: 'nebula-jacket',
    displayName: 'Nebula Jacket',
    slot: 'TOP' satisfies AvatarEquipmentSlot,
    rarity: 'COMMON',
    rigFamily: PHASE3_RIG_FAMILY,
    assetRef: 'rive://items/nebula-jacket-v1',
    thumbnailRef: 'asset://items/nebula-jacket-thumb',
    active: true,
    version: 1,
    performanceProfile: 'STANDARD',
    conflictsWith: ['FULL_OUTFIT'] satisfies AvatarEquipmentSlot[],
  },
  {
    id: 'moon-pin',
    displayName: 'Moon Pin',
    slot: 'JEWELLERY' satisfies AvatarEquipmentSlot,
    rarity: 'COMMON',
    rigFamily: PHASE3_RIG_FAMILY,
    assetRef: 'rive://items/moon-pin-v1',
    thumbnailRef: 'asset://items/moon-pin-thumb',
    active: true,
    version: 1,
    performanceProfile: 'LOW',
    conflictsWith: [] satisfies AvatarEquipmentSlot[],
  },
] as const;
