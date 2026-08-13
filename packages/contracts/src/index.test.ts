import { describe, expect, it } from 'vitest';
import {
  AvatarCatalogueItemSchema,
  AvatarInventoryItemSchema,
  isPrivilegedRole,
  RoleName,
  PRIVILEGED_ROLES,
} from './index';

describe('RBAC contracts', () => {
  it('marks owner/admin/moderator/support as privileged', () => {
    expect(isPrivilegedRole('OWNER')).toBe(true);
    expect(isPrivilegedRole('ADMIN')).toBe(true);
    expect(isPrivilegedRole('MODERATOR')).toBe(true);
    expect(isPrivilegedRole('SUPPORT')).toBe(true);
    expect(isPrivilegedRole('USER')).toBe(false);
    expect(isPrivilegedRole('SERVICE_ACCOUNT')).toBe(false);
  });

  it('parses role names', () => {
    expect(RoleName.parse('OWNER')).toBe('OWNER');
    expect(() => RoleName.parse('superuser')).toThrow();
  });

  it('lists privileged roles without USER', () => {
    expect(PRIVILEGED_ROLES).not.toContain('USER');
  });
});

describe('avatar foundation contracts', () => {
  it('represents locked legendary avatars without granting ownership', () => {
    const avatar = AvatarCatalogueItemSchema.parse({
      id: 'legendary-moon-dash',
      displayName: 'Moon Dash Legendary',
      tier: 'LEGENDARY',
      rarity: 'LEGENDARY',
      rigFamily: 'humanoid_v1',
      riveAssetRef: 'rive://avatars/moon-dash-legendary-v1',
      thumbnailRef: 'asset://avatars/moon-dash-legendary-thumb',
      entitlementCapability: 'avatar.legendary',
      active: true,
      version: 1,
      performanceProfile: 'STANDARD',
      fallbackAvatarId: 'voxora-guide',
      owned: false,
      lockedReason: 'Legendary avatar requires entitlement or explicit ownership grant',
    });

    expect(avatar.owned).toBe(false);
    expect(avatar.tier).toBe('LEGENDARY');
  });

  it('describes layered equipment compatibility metadata', () => {
    const item = AvatarInventoryItemSchema.parse({
      id: 'nebula-jacket',
      displayName: 'Nebula Jacket',
      slot: 'TOP',
      rarity: 'COMMON',
      rigFamily: 'humanoid_v1',
      assetRef: 'rive://items/nebula-jacket-v1',
      thumbnailRef: 'asset://items/nebula-jacket-thumb',
      performanceProfile: 'STANDARD',
      conflictsWith: ['FULL_OUTFIT'],
      active: true,
      owned: true,
      lockedReason: null,
    });

    expect(item.conflictsWith).toContain('FULL_OUTFIT');
  });
});
