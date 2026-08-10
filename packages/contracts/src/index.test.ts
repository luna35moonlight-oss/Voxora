import { describe, expect, it } from 'vitest';
import { isPrivilegedRole, RoleName, PRIVILEGED_ROLES } from './index';

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
