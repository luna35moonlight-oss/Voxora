-- Additive, nullable preferences. Existing profiles and account data are preserved.
ALTER TABLE "UserProfile" ADD COLUMN "communicationAgreement" JSONB;
