import { isPrivilegedRole, type RoleName } from '@voxora/contracts';

/** Server-authoritative authentication assurance levels for sessions. */
export type AuthLevel = 'password' | 'mfa';

export function rolesArePrivileged(roles: readonly string[]): boolean {
  return roles.some((r) => isPrivilegedRole(r as RoleName));
}
