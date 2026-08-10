## Phase 1 Core Foundation

Monorepo foundation for Voxora after Phase 0 owner approval.

### Apps
- `apps/api` — NestJS modular monolith
- `apps/mobile` — Expo React Native (SDK 57 stable), Android API 29+ / iOS 16.4+

### Packages
- `packages/contracts`
- `packages/config`
- `packages/design-system`
- `packages/testing`

### Local development
1. Copy `.env.example` to `.env` and adjust secrets.
2. Start PostgreSQL + Redis.
3. `pnpm install`
4. `pnpm --filter @voxora/api prisma:migrate`
5. `pnpm api:dev`
6. `pnpm mobile:start` (dev client / Expo)

Owner bootstrap requires both `OWNER_BOOTSTRAP_EMAIL` and `OWNER_BOOTSTRAP_TOKEN` — never client-side email elevation.
