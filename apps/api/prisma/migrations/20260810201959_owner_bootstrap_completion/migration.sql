-- CreateTable
CREATE TABLE "OwnerBootstrapCompletion" (
    "id" TEXT NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerBootstrapCompletion_pkey" PRIMARY KEY ("id")
);
