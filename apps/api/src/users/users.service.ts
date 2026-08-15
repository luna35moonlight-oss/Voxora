import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const roles = await this.rbac.getUserRoles(userId);
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const onboarding = await this.prisma.onboardingState.findUnique({ where: { userId } });
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      roles,
      mfaEnabled: user.mfaEnabled,
      status: user.status,
      username: profile?.username ?? null,
      phoneVerified: Boolean(profile?.phoneVerifiedAt),
      onboardingStage: onboarding?.currentStage ?? null,
      onboardingStatus: onboarding?.status ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
