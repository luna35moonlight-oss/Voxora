-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameId" TEXT NOT NULL,
    "dayKey" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "score" INTEGER,
    "durationMs" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "GameAttempt_createdAt_idx" ON "GameAttempt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameDailyCounter_userId_gameId_dayKey_key" ON "GameDailyCounter"("userId", "gameId", "dayKey");

-- CreateIndex
CREATE INDEX "GameDailyCounter_gameId_dayKey_idx" ON "GameDailyCounter"("gameId", "dayKey");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDailyCounter" ADD CONSTRAINT "GameDailyCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
