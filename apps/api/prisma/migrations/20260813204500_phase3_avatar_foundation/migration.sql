-- CreateTable
CREATE TABLE "AvatarCatalogue" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "rigFamily" TEXT NOT NULL,
    "riveAssetRef" TEXT NOT NULL,
    "thumbnailRef" TEXT NOT NULL,
    "entitlementCapability" TEXT,
    "packageKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "performanceProfile" TEXT NOT NULL DEFAULT 'STANDARD',
    "fallbackAvatarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarCatalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarAsset" (
    "id" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "rigFamily" TEXT NOT NULL,
    "avatarId" TEXT,
    "itemId" TEXT,
    "slot" TEXT,
    "storageRef" TEXT NOT NULL,
    "thumbnailRef" TEXT,
    "performanceProfile" TEXT NOT NULL DEFAULT 'STANDARD',
    "fallbackAssetId" TEXT,
    "metadataJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarItem" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "rigFamily" TEXT NOT NULL,
    "assetRef" TEXT NOT NULL,
    "thumbnailRef" TEXT NOT NULL,
    "entitlementCapability" TEXT,
    "packageKey" TEXT,
    "conflictsJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "performanceProfile" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatarOwnership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "avatarId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatarOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatarItemOwnership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatarItemOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatarSelection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "avatarId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAvatarSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatarEquipment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "avatarId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAvatarEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarCatalogue_active_tier_idx" ON "AvatarCatalogue"("active", "tier");

-- CreateIndex
CREATE INDEX "AvatarCatalogue_rigFamily_idx" ON "AvatarCatalogue"("rigFamily");

-- CreateIndex
CREATE INDEX "AvatarAsset_assetType_active_idx" ON "AvatarAsset"("assetType", "active");

-- CreateIndex
CREATE INDEX "AvatarAsset_rigFamily_idx" ON "AvatarAsset"("rigFamily");

-- CreateIndex
CREATE INDEX "AvatarItem_slot_active_idx" ON "AvatarItem"("slot", "active");

-- CreateIndex
CREATE INDEX "AvatarItem_rigFamily_idx" ON "AvatarItem"("rigFamily");

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatarOwnership_userId_avatarId_key" ON "UserAvatarOwnership"("userId", "avatarId");

-- CreateIndex
CREATE INDEX "UserAvatarOwnership_source_idx" ON "UserAvatarOwnership"("source");

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatarItemOwnership_userId_itemId_key" ON "UserAvatarItemOwnership"("userId", "itemId");

-- CreateIndex
CREATE INDEX "UserAvatarItemOwnership_source_idx" ON "UserAvatarItemOwnership"("source");

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatarSelection_userId_key" ON "UserAvatarSelection"("userId");

-- CreateIndex
CREATE INDEX "UserAvatarSelection_avatarId_idx" ON "UserAvatarSelection"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatarEquipment_userId_avatarId_slot_key" ON "UserAvatarEquipment"("userId", "avatarId", "slot");

-- CreateIndex
CREATE INDEX "UserAvatarEquipment_itemId_idx" ON "UserAvatarEquipment"("itemId");

-- AddForeignKey
ALTER TABLE "UserAvatarOwnership" ADD CONSTRAINT "UserAvatarOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarOwnership" ADD CONSTRAINT "UserAvatarOwnership_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "AvatarCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarItemOwnership" ADD CONSTRAINT "UserAvatarItemOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarItemOwnership" ADD CONSTRAINT "UserAvatarItemOwnership_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AvatarItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarSelection" ADD CONSTRAINT "UserAvatarSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarSelection" ADD CONSTRAINT "UserAvatarSelection_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "AvatarCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarEquipment" ADD CONSTRAINT "UserAvatarEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarEquipment" ADD CONSTRAINT "UserAvatarEquipment_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "AvatarCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarEquipment" ADD CONSTRAINT "UserAvatarEquipment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AvatarItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
