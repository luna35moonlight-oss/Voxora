import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { PermissionKey } from '@voxora/contracts';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

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

  async assignRole(input: { userId: string; role: RoleName; assignedBy?: string }) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: input.role } });
    return this.prisma.roleAssignment.upsert({
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
  }
}
