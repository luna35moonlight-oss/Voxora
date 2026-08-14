-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('ACCOUNT_CREATED', 'EMAIL_VERIFICATION', 'USERNAME', 'PRIVACY', 'REGION_LOCALE', 'CONTACT_NUMBER', 'PHONE_VERIFICATION', 'PROVIDER_INTERESTS', 'AGE_GATE', 'LEGAL_CONSENTS', 'SUBSCRIPTION_SELECTION', 'AVATAR_PET_HANDOFF');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('IN_PROGRESS', 'HANDOFF_READY', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'WITHDRAWN', 'DENIED');

-- CreateEnum
CREATE TYPE "InterestState" AS ENUM ('INTEREST_SELECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INTENT_SELECTED', 'PENDING_STORE_CONFIGURATION', 'PENDING_VERIFICATION', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'IN_GRACE', 'REVOKED');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('SUBSCRIPTION', 'TRIAL', 'ADD_ON', 'PACKAGE', 'PROMOTION', 'ADMIN_GRANT', 'FEATURE_DEFAULT');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('ARCHITECTURE_ONLY', 'PENDING_OWNER_RULES', 'ACTIVE', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "Storefront" AS ENUM ('APPLE', 'GOOGLE', 'INTERNAL');

-- AlterTable
ALTER TABLE "MfaFactor" ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "lastUsedStep" INTEGER;

-- AlterTable
ALTER TABLE "VerificationRecord" ADD COLUMN     "destinationHash" TEXT,
ADD COLUMN     "lastResendAt" TIMESTAMP(3),
ADD COLUMN     "providerRef" TEXT;

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "username" TEXT,
    "usernameNormalized" TEXT,
    "emailVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "phoneVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "countryCode" TEXT,
    "regionCode" TEXT,
    "locale" TEXT,
    "timeZone" TEXT,
    "displayCurrency" TEXT,
    "phoneE164" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "ageGateConfirmedAt" TIMESTAMP(3),
    "ageGateRuleVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currentStage" "OnboardingStage" NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "status" "OnboardingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedStages" JSONB NOT NULL DEFAULT '[]',
    "lastAdvancedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "consentType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "platform" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderInterest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "state" "InterestState" NOT NULL DEFAULT 'INTEREST_SELECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVersion" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "entitlementsJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProductMapping" (
    "id" UUID NOT NULL,
    "productVersionId" UUID NOT NULL,
    "storefront" "Storefront" NOT NULL,
    "storeProductId" TEXT,
    "configured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productVersionId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INTENT_SELECTED',
    "storefront" "Storefront" NOT NULL DEFAULT 'INTERNAL',
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subscriptionId" UUID,
    "storefront" "Storefront" NOT NULL,
    "storeRef" TEXT,
    "status" TEXT NOT NULL,
    "rawVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementDefinition" (
    "id" UUID NOT NULL,
    "capability" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntitlementDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntitlement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "capability" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "limitValue" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialGrant" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productVersionId" UUID,
    "trialKey" TEXT NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'ARCHITECTURE_ONLY',
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevDeliveryArtifact" (
    "id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevDeliveryArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_usernameNormalized_key" ON "UserProfile"("usernameNormalized");

-- CreateIndex
CREATE INDEX "UserProfile_phoneE164_idx" ON "UserProfile"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");

-- CreateIndex
CREATE INDEX "ProviderInterest_userId_idx" ON "ProviderInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderInterest_userId_providerKey_key" ON "ProviderInterest"("userId", "providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "MfaChallenge_tokenHash_key" ON "MfaChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "MfaChallenge_userId_purpose_idx" ON "MfaChallenge"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "ProductVersion_currency_idx" ON "ProductVersion"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_productId_version_key" ON "ProductVersion"("productId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProductMapping_productVersionId_storefront_key" ON "StoreProductMapping"("productVersionId", "storefront");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscriptionId_createdAt_idx" ON "SubscriptionEvent"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseReference_userId_idx" ON "PurchaseReference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EntitlementDefinition_capability_key" ON "EntitlementDefinition"("capability");

-- CreateIndex
CREATE INDEX "UserEntitlement_userId_capability_idx" ON "UserEntitlement"("userId", "capability");

-- CreateIndex
CREATE INDEX "TrialGrant_userId_trialKey_idx" ON "TrialGrant"("userId", "trialKey");

-- CreateIndex
CREATE INDEX "DevDeliveryArtifact_userId_channel_purpose_idx" ON "DevDeliveryArtifact"("userId", "channel", "purpose");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderInterest" ADD CONSTRAINT "ProviderInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductMapping" ADD CONSTRAINT "StoreProductMapping_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReference" ADD CONSTRAINT "PurchaseReference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReference" ADD CONSTRAINT "PurchaseReference_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
