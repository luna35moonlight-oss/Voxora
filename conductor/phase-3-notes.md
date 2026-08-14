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
| `pnpm --filter @voxora/api exec prisma migrate deploy` | blocked locally — no Postgres; **passed in remote CI** | local 1 / CI 0 |
| `pnpm --filter @voxora/api test:e2e` | blocked locally; **passed in remote CI** (26 tests) | local 1 / CI 0 |
| Remote GitHub Actions CI | **pass** (PR #7) | 0 |
| Native iOS/Android / Expo dev build visual Rive proof | NATIVE VALIDATION REQUIRED | N/A |

## Remote CI (2026-08-14)

Label: `REMOTE CI VALIDATED`

| Run | Event | Job | Result | URL |
|-----|-------|-----|--------|-----|
| 31842840312 | pull_request | foundation | **pass** | https://github.com/luna35moonlight-oss/Voxora/actions/runs/31842840312 |
| 31842817122 | push | foundation | **pass** | https://github.com/luna35moonlight-oss/Voxora/actions/runs/31842817122 |

CI applied migrations: Phase 2 account/commercial, session MFA assurance, White Wolf game attempts, Phase 3 avatar foundation. API e2e: foundation + Phase 2 + session-assurance (26 passed). No dedicated Moon Dash/Avatar HTTP e2e files yet (unit/service/contract + migrate cover those areas).

Draft PR: https://github.com/luna35moonlight-oss/Voxora/pull/7

## Native Rive manual procedure (Product Owner / native tester)

**Requirement:** Expo development build. **Expo Go does not count.**

1. `pnpm install --frozen-lockfile`
2. Point `EXPO_PUBLIC_API_URL` at a reachable API.
3. Android first: EAS development build or `expo prebuild` + native run.
4. Launch the **development client** (not Expo Go); sign in; open Avatar Foundation.
5. Confirm banner `DEVELOPMENT TEST ASSET — NOT VOXORA PRODUCTION ART`.
6. Online: `.riv` loads from CDN; artboard visible; state machine active; IDLE visible.
7. Trigger LISTEN / THINK / SPEAK / SMILE. LISTEN/THINK/SPEAK are **application-orchestrated** on this demo asset; SMILE drives `isHappy`.
8. Confirm return to IDLE via app orchestration after reaction.
9. Parent re-renders must not continuously restart animation; unmount/remount behaves cleanly.
10. Reduced motion retains presence; STANDARD and LOW profiles both show meaningful avatar presence.
11. Offline / CDN failure: honest fallback (remote CDN is **dev-only**, not production delivery).
12. Repeat on iOS where macOS/Xcode is available.

This cloud agent host has **no Android SDK/emulator and no Xcode** — native steps were not executed here.

## Explicitly not started

- Phase 4 pets  
- Rock Paper Scissors, Spinning Wheel, or full Games Platform implementation  
- Alpha / Alpha Bondfire  
- Production Voxora `.riv` artwork  

## Moon Dash Legendary ownership compatibility

Conceptual lifecycle preserved (not auto-executed):

verified prize → manual redeem code/reference → valid redemption → server ownership grant (`UserAvatarOwnership`) → inventory/selection available → audit → code marked redeemed

No `MoonDashAvatarSystem`. No automatic code issuance/redemption/grant in Phase 3.

