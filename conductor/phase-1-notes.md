# Phase 1 notes — Core Foundation (closeout)

**Status:** APPROVED SUBJECT TO CLOSEOUT — ready for owner merge review  
**PR:** https://github.com/luna35moonlight-oss/Voxora/pull/2  
**Closeout date:** 2026-08-10

## Scope delivered

- Monorepo: `apps/mobile`, `apps/api`, `packages/{contracts,config,design-system,testing}`
- Expo SDK 57 / RN 0.86; Android API 29; iOS 16.4
- NestJS + PostgreSQL + Prisma migrations + Redis/BullMQ foundation
- Auth, RBAC, audit, feature flags, health, design tokens, CI

## Closeout corrections (2026-08-10)

### Owner bootstrap is genuinely one-time

- Persisted `OwnerBootstrapCompletion` row (`id = owner_bootstrap`) in PostgreSQL
- Rejects when completion already exists (survives restarts)
- Rejects when an active OWNER role assignment already exists
- Requires configured identity **and** secret **and** registered user
- Constant-time secret comparison (`safeEqualSecret`)
- Bootstrap secrets never appear in API responses, audit payloads, or client config
- Future Owner administration must not reuse bootstrap

### Privileged MFA status

**MFA-READY, NOT YET PRODUCTION-ENFORCED**

Phase 1 still audits privileged login without MFA and may issue a session.  
Phase 2 must implement real TOTP enrollment/challenge enforcement for OWNER/ADMIN/MODERATOR/SUPPORT before privileged production access.

### Copyright / licence treatment

- Removed Expo template `apps/mobile/LICENSE` from being presented as Voxora’s product licence
- Preserved Expo MIT attribution in `apps/mobile/THIRD_PARTY_NOTICES.md`
- Added root `NOTICE.md`
- Voxora product copyright remains © Maryke Farrell. All rights reserved.
- Open-source licence grant for Voxora-owned code: **OWNER / LEGAL DECISION REQUIRED**

## Explicitly not in Phase 1

No Alpha Bondfire, AI provider, avatars, pets, Scene Engine / Interaction Runtime production impl, games, battles, Wellness, mail/calendar connections, fake social integrations, fake billing/subscription success.

## Local development

1. Copy `.env.example` → `.env`
2. PostgreSQL + Redis
3. `pnpm install`
4. `pnpm --filter @voxora/api prisma:migrate`
5. `pnpm api:dev` / `pnpm mobile:start`

Owner bootstrap requires `OWNER_BOOTSTRAP_EMAIL` + `OWNER_BOOTSTRAP_TOKEN` and succeeds only once.
