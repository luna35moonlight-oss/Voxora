# Phase 3 Notes — Scene Engine and Living Avatar Foundation

**Document status:** INTEGRATED on final-integration branch — Rive runtime wired; native device validation outstanding  
**Product owner:** Maryke Farrell  
**Last updated:** 2026-08-14

---

## Delivered

- Avatar Catalogue, ownership, inventory, equipment, compatibility, persistence.
- Avatar runtime state priorities + reduced-motion fallbacks.
- Scene Engine layer order including future pet extension points (pets not implemented).
- Real `@rive-app/react-native@0.4.19` dependency (with `react-native-nitro-modules@0.35.10`).
- Development-only Rive CDN test asset metadata + adapter (binary not committed).
- Production `.riv` asset contract: `rive-production-asset-contract.md`.
- Moon Dash Legendary Avatar remains a locked catalogue entry grantable only via the shared ownership model.

## Rive posture

| Item | Status |
|------|--------|
| Package | `@rive-app/react-native` **0.4.19** (exact pin) |
| Peer | `react-native-nitro-modules` **0.35.10** (exact pin) |
| Expo | `~57.0.11` (not downgraded) |
| React Native | `0.86.2` (not downgraded) |
| Expo Go | **Not supported** for this native module |
| Expo development build | **Required** for native proof |
| Dev test asset | Rive community Avatar Pack Use Case via public CDN — `DEVELOPMENT TEST ASSET — NOT VOXORA PRODUCTION ART` |
| Binary in repo | **Not committed** (redistribution not assumed) |
| JS-level validation | Module import + adapter/unit tests |
| Native device validation | **NATIVE VALIDATION REQUIRED** |

## Games & Rewards Addendum (documentation only)

Owner-approved requirements are recorded in `game-system.md`, `moon-dash.md`, `pet-system.md`, `avatar-system.md`, `roadmap.md`, `decisions.md` (ADR-027), `open-questions.md`, and `requirements-matrix.md`.

Confirmed future (not implemented here):

- Rock Paper Scissors — 10 attempts/user/UTC day; server-approved pet skill progression points  
- Spinning Wheel — may award Pet Skill-Up Shards, Voxora Diamonds, Voxora Coins, Avatar Skin redeem codes  
- Central Reward Ledger; shared redeem-code architecture; UTC server day for attempt limits  

**Do not** build Rock Paper Scissors, Spinning Wheel, Coins, Diamonds, shard economies, or Phase 13 during this Phase 3 closeout. Do not invent unresolved formulas or Wheel probabilities.

## Local CI-equivalent regression (2026-08-14)

Label: `LOCAL CI-EQUIVALENT CHECKS`

| Command | Result | Exit |
|---------|--------|------|
| `pnpm install --frozen-lockfile` | pass | 0 |
| `pnpm format:check` | pass (after prettier write) | 0 |
| `pnpm --filter @voxora/contracts --filter @voxora/config --filter @voxora/design-system --filter @voxora/testing run build` | pass | 0 |
| `DATABASE_URL=… pnpm --filter @voxora/api prisma:validate` | pass | 0 |
| `pnpm --filter @voxora/api prisma:generate` | pass | 0 |
| `pnpm --filter @voxora/api lint` | pass | 0 |
| `pnpm typecheck` | pass | 0 |
| `pnpm test` | pass | 0 |
| `pnpm --filter @voxora/api build` | pass | 0 |
| `pnpm --filter @voxora/mobile typecheck` | pass | 0 |
| `pnpm --filter @voxora/mobile exec expo config --type public` | pass | 0 |
| `pnpm build` | pass | 0 |
| `pnpm --filter @voxora/api exec prisma migrate deploy` | blocked — no Postgres at localhost:5432 | 1 |
| `pnpm --filter @voxora/api test:e2e` | blocked — DATABASE_URL/REDIS_URL/JWT secrets + DB unavailable | 1 |
| Remote GitHub Actions CI | not run (no push per Product Owner instruction) | N/A |
| Native iOS/Android / Expo dev build visual Rive proof | NATIVE VALIDATION REQUIRED | N/A |

## Moon Dash Legendary ownership compatibility

Conceptual lifecycle preserved (not auto-executed):

verified prize → manual redeem code/reference → valid redemption → server ownership grant (`UserAvatarOwnership`) → inventory/selection available → audit → code marked redeemed

No `MoonDashAvatarSystem`. No automatic code issuance/redemption/grant in Phase 3.
