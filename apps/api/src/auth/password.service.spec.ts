import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service';
import { isPrivilegedRole } from '@voxora/contracts';

describe('PasswordService', () => {
  it('hashes and verifies with argon2id', async () => {
    const service = new PasswordService();
    const hash = await service.hash('correct-horse-battery');
    expect(hash).not.toEqual('correct-horse-battery');
    expect(await service.verify(hash, 'correct-horse-battery')).toBe(true);
    expect(await service.verify(hash, 'wrong-password')).toBe(false);
  });
});

describe('privileged MFA policy contract', () => {
  it('requires privileged roles to be distinguishable for MFA gates', () => {
    expect(isPrivilegedRole('OWNER')).toBe(true);
    expect(isPrivilegedRole('USER')).toBe(false);
  });
});
