import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type {
  AvatarCatalogueItem,
  AvatarEquipmentSlot,
  AvatarInventoryItem,
  CurrentAvatarResponse,
} from '@voxora/contracts';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { phase3Avatars, phase3Items, STARTER_AVATAR_ID } from './avatar-seed';

const runtimeStates = [
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
] as const;

@Injectable()
export class AvatarsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureSeedCatalogue();
  }

  async getCurrent(userId: string): Promise<CurrentAvatarResponse> {
    await this.ensureStarterOwnership(userId);

    const [catalogueRows, itemRows, avatarOwnerships, itemOwnerships, selection] =
      await Promise.all([
        this.prisma.avatarCatalogue.findMany({ where: { active: true }, orderBy: { id: 'asc' } }),
        this.prisma.avatarItem.findMany({ where: { active: true }, orderBy: { id: 'asc' } }),
        this.prisma.userAvatarOwnership.findMany({ where: { userId } }),
        this.prisma.userAvatarItemOwnership.findMany({ where: { userId } }),
        this.prisma.userAvatarSelection.findUnique({ where: { userId } }),
      ]);

    const ownedAvatarIds = new Set(avatarOwnerships.map((ownership) => ownership.avatarId));
    const ownedItemIds = new Set(itemOwnerships.map((ownership) => ownership.itemId));
    const selectedAvatarId =
      selection?.avatarId ??
      avatarOwnerships.find((ownership) => ownership.avatarId === STARTER_AVATAR_ID)?.avatarId ??
      null;

    const currentAvatarRow =
      selectedAvatarId === null
        ? null
        : catalogueRows.find((avatar) => avatar.id === selectedAvatarId) ?? null;
    const equipmentRows =
      selectedAvatarId === null
        ? []
        : await this.prisma.userAvatarEquipment.findMany({
            where: { userId, avatarId: selectedAvatarId },
            include: { item: true },
            orderBy: { slot: 'asc' },
          });

    return {
      currentAvatar: currentAvatarRow
        ? toAvatarCatalogueItem(currentAvatarRow, ownedAvatarIds.has(currentAvatarRow.id))
        : null,
      catalogue: catalogueRows.map((avatar) =>
        toAvatarCatalogueItem(avatar, ownedAvatarIds.has(avatar.id)),
      ),
      inventory: itemRows.map((item) => toInventoryItem(item, ownedItemIds.has(item.id))),
      equipment: equipmentRows.map((equipment) => ({
        slot: equipment.slot as AvatarEquipmentSlot,
        item: toInventoryItem(equipment.item, true),
      })),
      runtimeStates: [...runtimeStates],
      performanceProfiles: ['HIGH', 'STANDARD', 'LOW'],
      reducedMotionSupported: true,
      moonDashLegendaryPrizeCompatible: true,
    };
  }

  async selectAvatar(userId: string, avatarId: string): Promise<CurrentAvatarResponse> {
    await this.ensureStarterOwnership(userId);

    const avatar = await this.prisma.avatarCatalogue.findUnique({ where: { id: avatarId } });
    if (!avatar?.active) {
      throw new NotFoundException('Avatar not found');
    }

    const ownership = await this.prisma.userAvatarOwnership.findUnique({
      where: { userId_avatarId: { userId, avatarId } },
    });
    if (!ownership) {
      throw new ForbiddenException('Avatar is locked until entitlement or ownership is granted');
    }

    await this.prisma.userAvatarSelection.upsert({
      where: { userId },
      create: { userId, avatarId },
      update: { avatarId },
    });
    await this.audit.record({
      actorId: userId,
      action: 'avatars.select',
      subject: avatarId,
    });

    return this.getCurrent(userId);
  }

  async equipItem(userId: string, avatarId: string, itemId: string): Promise<CurrentAvatarResponse> {
    await this.ensureStarterOwnership(userId);
    const [avatar, item, avatarOwnership, itemOwnership] = await Promise.all([
      this.prisma.avatarCatalogue.findUnique({ where: { id: avatarId } }),
      this.prisma.avatarItem.findUnique({ where: { id: itemId } }),
      this.prisma.userAvatarOwnership.findUnique({ where: { userId_avatarId: { userId, avatarId } } }),
      this.prisma.userAvatarItemOwnership.findUnique({ where: { userId_itemId: { userId, itemId } } }),
    ]);

    if (!avatar?.active || !item?.active) {
      throw new NotFoundException('Avatar or item not found');
    }
    if (!avatarOwnership || !itemOwnership) {
      throw new ForbiddenException('Cannot equip unowned avatar items');
    }
    if (avatar.rigFamily !== item.rigFamily) {
      throw new BadRequestException('Item is not compatible with the selected avatar rig');
    }

    const slot = item.slot as AvatarEquipmentSlot;
    const conflicts = parseConflicts(item.conflictsJson);
    await this.prisma.$transaction(async (tx) => {
      if (conflicts.length) {
        await tx.userAvatarEquipment.deleteMany({
          where: { userId, avatarId, slot: { in: conflicts } },
        });
      }
      await tx.userAvatarEquipment.upsert({
        where: { userId_avatarId_slot: { userId, avatarId, slot } },
        create: { userId, avatarId, itemId, slot },
        update: { itemId },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: 'avatars.equip',
      subject: `${avatarId}:${itemId}`,
      payload: { slot },
    });

    return this.getCurrent(userId);
  }

  async unequipItem(
    userId: string,
    avatarId: string,
    slot: AvatarEquipmentSlot,
  ): Promise<CurrentAvatarResponse> {
    await this.prisma.userAvatarEquipment.deleteMany({ where: { userId, avatarId, slot } });
    await this.audit.record({
      actorId: userId,
      action: 'avatars.unequip',
      subject: `${avatarId}:${slot}`,
    });
    return this.getCurrent(userId);
  }

  private async ensureSeedCatalogue() {
    for (const avatar of phase3Avatars) {
      await this.prisma.avatarCatalogue.upsert({
        where: { id: avatar.id },
        create: avatar,
        update: avatar,
      });
      await this.prisma.avatarAsset.upsert({
        where: { id: `${avatar.id}-base-rive` },
        create: {
          id: `${avatar.id}-base-rive`,
          avatarId: avatar.id,
          assetType: 'AVATAR_BASE_RIVE',
          rigFamily: avatar.rigFamily,
          storageRef: avatar.riveAssetRef,
          thumbnailRef: avatar.thumbnailRef,
          performanceProfile: avatar.performanceProfile,
        },
        update: {
          storageRef: avatar.riveAssetRef,
          thumbnailRef: avatar.thumbnailRef,
          performanceProfile: avatar.performanceProfile,
        },
      });
    }

    for (const item of phase3Items) {
      await this.prisma.avatarItem.upsert({
        where: { id: item.id },
        create: { ...item, conflictsJson: item.conflictsWith },
        update: { ...item, conflictsJson: item.conflictsWith },
      });
      await this.prisma.avatarAsset.upsert({
        where: { id: `${item.id}-layer-rive` },
        create: {
          id: `${item.id}-layer-rive`,
          itemId: item.id,
          assetType: 'AVATAR_LAYER_RIVE',
          rigFamily: item.rigFamily,
          slot: item.slot,
          storageRef: item.assetRef,
          thumbnailRef: item.thumbnailRef,
          performanceProfile: item.performanceProfile,
        },
        update: {
          storageRef: item.assetRef,
          thumbnailRef: item.thumbnailRef,
          performanceProfile: item.performanceProfile,
        },
      });
    }
  }

  private async ensureStarterOwnership(userId: string) {
    await this.prisma.userAvatarOwnership.upsert({
      where: { userId_avatarId: { userId, avatarId: STARTER_AVATAR_ID } },
      create: {
        userId,
        avatarId: STARTER_AVATAR_ID,
        source: 'PHASE3_STARTER_GRANT',
      },
      update: {},
    });

    for (const item of phase3Items) {
      await this.prisma.userAvatarItemOwnership.upsert({
        where: { userId_itemId: { userId, itemId: item.id } },
        create: {
          userId,
          itemId: item.id,
          source: 'PHASE3_STARTER_GRANT',
        },
        update: {},
      });
    }
  }
}

function toAvatarCatalogueItem(
  avatar: {
    id: string;
    displayName: string;
    tier: string;
    rarity: string;
    rigFamily: string;
    riveAssetRef: string;
    thumbnailRef: string;
    entitlementCapability: string | null;
    packageKey: string | null;
    active: boolean;
    version: number;
    performanceProfile: string;
    fallbackAvatarId: string | null;
  },
  owned: boolean,
): AvatarCatalogueItem {
  return {
    ...avatar,
    tier: avatar.tier as AvatarCatalogueItem['tier'],
    rarity: avatar.rarity as AvatarCatalogueItem['rarity'],
    entitlementCapability: avatar.entitlementCapability as AvatarCatalogueItem['entitlementCapability'],
    packageKey: avatar.packageKey ?? undefined,
    performanceProfile: avatar.performanceProfile as AvatarCatalogueItem['performanceProfile'],
    owned,
    lockedReason: owned ? null : `${avatar.tier} avatar requires entitlement or explicit ownership`,
  };
}

function toInventoryItem(
  item: {
    id: string;
    displayName: string;
    slot: string;
    rarity: string;
    rigFamily: string;
    assetRef: string;
    thumbnailRef: string;
    performanceProfile: string;
    conflictsJson: unknown;
    active: boolean;
  },
  owned: boolean,
): AvatarInventoryItem {
  return {
    id: item.id,
    displayName: item.displayName,
    slot: item.slot as AvatarEquipmentSlot,
    rarity: item.rarity as AvatarInventoryItem['rarity'],
    rigFamily: item.rigFamily,
    assetRef: item.assetRef,
    thumbnailRef: item.thumbnailRef,
    performanceProfile: item.performanceProfile as AvatarInventoryItem['performanceProfile'],
    conflictsWith: parseConflicts(item.conflictsJson),
    active: item.active,
    owned,
    lockedReason: owned ? null : 'Item requires ownership before it can be equipped',
  };
}

function parseConflicts(value: unknown): AvatarEquipmentSlot[] {
  return Array.isArray(value) ? (value.filter((slot) => typeof slot === 'string') as AvatarEquipmentSlot[]) : [];
}
