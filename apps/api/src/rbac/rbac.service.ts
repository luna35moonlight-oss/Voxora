import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import {
  isPrivilegedRole,
  type PermissionKey,
  type RoleName as ContractRole,
} from '@voxora/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const DEFAULT_PERMISSIONS: Array<{ key: PermissionKey; description: string }> = [
  { key: 'auth.session.read', description: 'Read own sessions' },
  { key: 'auth.session.revoke', description: 'Revoke own sessions' },
  { key: 'user.profile.read', description: 'Read own profile' },
  { key: 'user.profile.update', description: 'Update own profile' },
  { key: 'admin.users.read', description: 'Read users (admin)' },
  { key: 'admin.roles.assign', description: 'Assign roles' },
  { key: 'admin.audit.read', description: 'Read audit events' },
  { key: 'admin.feature_flags.manage', description: 'Manage feature flags' },
  { key: 'owner.bootstrap', description: 'Owner bootstrap elevation' },
];

const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  USER: ['auth.session.read', 'auth.session.revoke', 'user.profile.read', 'user.profile.update'],
  SUPPORT: [
    'auth.session.read',
    'auth.session.revoke',
    'user.profile.read',
    'user.profile.update',
    'admin.users.read',
    'admin.audit.read',
  ],
  MODERATOR: [
    'auth.session.read',
    'auth.session.revoke',
    'user.profile.read',
    'user.profile.update',
    'admin.users.read',
    'admin.audit.read',
  ],
  ADMIN: [
    'auth.session.read',
    'auth.session.revoke',
    'user.profile.read',
    'user.profile.update',
    'admin.users.read',
    'admin.roles.assign',
    'admin.audit.read',
    'admin.feature_flags.manage',
  ],
  OWNER: [
    'auth.session.read',
    'auth.session.revoke',
    'user.profile.read',
    'user.profile.update',
    'admin.users.read',
    'admin.roles.assign',
    'admin.audit.read',
    'admin.feature_flags.manage',
    'owner.bootstrap',
  ],
  SERVICE_ACCOUNT: ['auth.session.read'],
};

/**
 * CURRENT PRIVILEGED IDENTITY POLICY: SINGLE OWNER — MARYKE FARRELL
 *
 * RBAC retains ADMIN / MODERATOR / SUPPORT for future authorised use.
 * Do not assign those roles unless the Product Owner explicitly authorises it.
 * OWNER is the highest privileged authority; do not also assign ADMIN to Owner
 * merely to duplicate labels.
 */
@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureSeed();
  }

  async ensureSeed() {
    for (const roleName of Object.values(RoleName)) {
      await this.prisma.role.upsert({
        where: { name: roleName },
        create: { name: roleName, description: `${roleName} role` },
        update: {},
      });
    }

    for (const perm of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: perm.key },
        create: perm,
        update: { description: perm.description },
      });
    }

    for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS) as Array<
      [RoleName, PermissionKey[]]
    >) {
      const role = await this.prisma.role.findUniqueOrThrow({ where: { name: roleName } });
      for (const key of keys) {
        const permission = await this.prisma.permission.findUniqueOrThrow({ where: { key } });
        await this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          create: { roleId: role.id, permissionId: permission.id },
          update: {},
        });
      }
    }
  }

  async getUserRoles(userId: string): Promise<RoleName[]> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId, revokedAt: null },
      include: { role: true },
    });
    return assignments.map((a) => a.role.name);
  }

  async userHasPermission(userId: string, permission: PermissionKey): Promise<boolean> {
    const count = await this.prisma.roleAssignment.count({
      where: {
        userId,
        revokedAt: null,
        role: {
          permissions: {
            some: { permission: { key: permission } },
          },
        },
      },
    });
    return count > 0;
  }

  /**
   * Assign a role. Granting a privileged role invalidates existing sessions
   * so stale refresh tokens cannot silently pick up elevated claims.
   */
  async assignRole(input: { userId: string; role: RoleName; assignedBy?: string }) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: input.role } });
    const assignment = await this.prisma.roleAssignment.upsert({
      where: { userId_roleId: { userId: input.userId, roleId: role.id } },
      create: {
        userId: input.userId,
        roleId: role.id,
        assignedBy: input.assignedBy,
      },
      update: {
        revokedAt: null,
        assignedBy: input.assignedBy,
      },
    });

    if (isPrivilegedRole(input.role as ContractRole)) {
      await this.revokeAllSessionsForUser(input.userId, `privileged_role_granted:${input.role}`);
    }

    return assignment;
  }

  /**
   * Revoke a role assignment. Removing a privileged role also invalidates sessions.
   */
  async revokeRole(input: { userId: string; role: RoleName; revokedBy?: string }) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: input.role } });
    const existing = await this.prisma.roleAssignment.findUnique({
      where: { userId_roleId: { userId: input.userId, roleId: role.id } },
    });
    if (!existing || existing.revokedAt) {
      return existing;
    }

    const updated = await this.prisma.roleAssignment.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    if (isPrivilegedRole(input.role as ContractRole)) {
      await this.revokeAllSessionsForUser(input.userId, `privileged_role_revoked:${input.role}`);
    }

    await this.audit.record({
      actorId: input.userId,
      action: 'rbac.role_revoked',
      subject: input.userId,
      payload: { role: input.role, revokedBy: input.revokedBy ?? null },
    });

    return updated;
  }

  async revokeAllSessionsForUser(userId: string, reason: string) {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      actorId: userId,
      action: 'auth.sessions_revoked',
      subject: userId,
      payload: { reason, count: result.count },
    });
    return result;
  }
}
