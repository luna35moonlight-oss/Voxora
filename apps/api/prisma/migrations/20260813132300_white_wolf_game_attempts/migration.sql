-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "dayKey" TIMESTAMP(3) NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "startState" JSONB,
    "completionState" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'RESERVED',
    "score" INTEGER,
    "durationMs" INTEGER,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePrizeAward" (
    "id" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "leaderboardPosition" INTEGER NOT NULL,
    "qualifyingRunId" UUID NOT NULL,
    "qualifyingScore" INTEGER NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PROVISIONAL_WINNER',
    "prizeType" TEXT NOT NULL,
    "prizeCatalogueRef" TEXT,
    "issuanceStatus" TEXT NOT NULL DEFAULT 'NOT_ISSUED',
    "issuedBy" UUID,
    "issuedAt" TIMESTAMP(3),
    "redemptionStatus" TEXT NOT NULL DEFAULT 'NOT_REDEEMED',
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamePrizeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDailyCounter" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "dayKey" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "highScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameDailyCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAttempt_userId_gameId_dayKey_idx" ON "GameAttempt"("userId", "gameId", "dayKey");

-- CreateIndex
CREATE INDEX "GameAttempt_gameId_status_score_idx" ON "GameAttempt"("gameId", "status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "GameAttempt_userId_gameId_dayKey_attemptNumber_key" ON "GameAttempt"("userId", "gameId", "dayKey", "attemptNumber");

-- CreateIndex
CREATE INDEX "GameAttempt_createdAt_idx" ON "GameAttempt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameDailyCounter_userId_gameId_dayKey_key" ON "GameDailyCounter"("userId", "gameId", "dayKey");

-- CreateIndex
CREATE INDEX "GameDailyCounter_gameId_dayKey_idx" ON "GameDailyCounter"("gameId", "dayKey");

-- CreateIndex
CREATE INDEX "GamePrizeAward_gameId_competitionId_idx" ON "GamePrizeAward"("gameId", "competitionId");

-- CreateIndex
CREATE INDEX "GamePrizeAward_userId_idx" ON "GamePrizeAward"("userId");

-- CreateIndex
CREATE INDEX "GamePrizeAward_verificationStatus_issuanceStatus_idx" ON "GamePrizeAward"("verificationStatus", "issuanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "GamePrizeAward_gameId_competitionId_leaderboardPosition_key" ON "GamePrizeAward"("gameId", "competitionId", "leaderboardPosition");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDailyCounter" ADD CONSTRAINT "GameDailyCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePrizeAward" ADD CONSTRAINT "GamePrizeAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePrizeAward" ADD CONSTRAINT "GamePrizeAward_qualifyingRunId_fkey" FOREIGN KEY ("qualifyingRunId") REFERENCES "GameAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePrizeAward" ADD CONSTRAINT "GamePrizeAward_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
