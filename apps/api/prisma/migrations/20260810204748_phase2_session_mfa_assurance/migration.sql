-- CreateEnum
CREATE TYPE "AuthenticationAssurance" AS ENUM ('PASSWORD', 'MFA');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "authenticationAssurance" "AuthenticationAssurance" NOT NULL DEFAULT 'PASSWORD',
ADD COLUMN     "mfaVerifiedAt" TIMESTAMP(3);
