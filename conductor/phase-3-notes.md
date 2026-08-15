# Phase 3 Notes — Scene Engine and Living Avatar Foundation

**Document status:** INTEGRATED — final audit complete; Android native Rive **ANDROID NATIVE VALIDATED** (see limitations); iOS outstanding  
**Product owner:** Maryke Farrell  
**Last updated:** 2026-08-15  
**Integration audit date:** 2026-08-14  
**Branch audited:** `cursor/phase-3-final-integration-9cb3`  
**Commit audited (preflight):** `e269ab1` (subsequent fixes on branch tip)

---

## Delivered

- Avatar Catalogue, ownership, inventory, equipment, compatibility, persistence.
- Avatar runtime state priorities + reduced-motion fallbacks.
- Scene Engine layer order including future pet extension points (pets not implemented).
- Real `@rive-app/react-native@0.4.19` dependency (with `react-native-nitro-modules@0.35.10`).
- Development-only Rive CDN test asset metadata + adapter (binary not committed).
- Production `.riv` asset contract: `rive-production-asset-contract.md`.
- Moon Dash Legendary Avatar remains a locked catalogue entry grantable only via the shared ownership model.
- `__DEV__` Native Rive validation harness (`RiveNativeValidationScreen`) reachable from Sign In without API auth.

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
| Native iOS/Android / Expo dev build visual Rive proof | see Android native validation section | N/A |

## Final integration audit (2026-08-14)

Label: `INTEGRATED`

Traced Phase 2 (onboarding, verification architecture, privacy defaults, username/locale/timezone/currency, age gate, legal consent, catalogue, subscriptions, Entitlement Service, privileged MFA + session assurance, settings), Phase 2.5 Moon Dash (server-authoritative 10 UTC attempts, reserve-before-play, single-use submit, leaderboard/tie-break, provisional vs verified winners, First/Second prize positions, manual Legendary redeem architecture only), Phase 3 Avatar Foundation (catalogue/ownership/inventory/equipment/compatibility/runtime/Scene Engine 16 layers), Games & Rewards documentation (RPS/Wheel docs-only; Coins/Diamonds separate; Reward Ledger boundary documented), Legendary compatibility (no `MoonDashAvatarSystem`; no auto grant), and Rive architecture (exact pins, native wiring, adapter, fallbacks, profiles).

Non-blocking observations (not merge defects for Phase 2–3 scope):

- `GamePrizeAward` schema exists; Owner prize-issuance API not yet exposed (manual Legendary path remains documented; no automatic ownership).
- Mobile MFA UI/apiClient methods not wired (API MFA + e2e present).
- No dedicated Moon Dash / Avatar HTTP e2e files (unit/service/contract + migrate cover those areas).
- Production avatar `.riv` artwork remains a separate asset-production task.

## Remote CI (2026-08-14)

Label: `REMOTE CI VALIDATED` (on audited tip `e269ab1`; re-validate after any new push)

| Run | Event | Job | Result | URL |
|-----|-------|-----|--------|-----|
| 31842840312 | pull_request | foundation | **pass** | https://github.com/luna35moonlight-oss/Voxora/actions/runs/31842840312 |
| 31842817122 | push | foundation | **pass** | https://github.com/luna35moonlight-oss/Voxora/actions/runs/31842817122 |

Draft PR: https://github.com/luna35moonlight-oss/Voxora/pull/7

## Android native Rive validation (2026-08-14/15)

Label: `ANDROID NATIVE VALIDATED` (with documented limitations below)

| Item | Value |
|------|-------|
| Build method | Local Expo prebuild + Gradle `assembleDebug` (`-PreactNativeArchitectures=x86_64`), JS embedded via `debuggableVariants=[]` / `export:embed` for offline Metro hosts |
| Build command | `pnpm exec expo prebuild --platform android --no-install` then `./android/gradlew :app:assembleDebug -PreactNativeArchitectures=x86_64` |
| Build result | **SUCCESS** (includes `:rive-app_react-native` CMake + Java compile) |
| Install result | **SUCCESS** |
| Device / emulator | AVD `voxora_api34` — `sdk_gphone64_x86_64` (Google APIs, Pixel 6 skin) |
| Android version | 14 (API 34) |
| Acceleration | TCG software (`-accel off`) — nested KVM unavailable on this cloud host |
| Asset load path | Emulator has **no outbound WAN/DNS**; same community `.riv` binary was mirrored on host and served via `adb reverse` + `EXPO_PUBLIC_RIVE_DEV_ASSET_URL=http://127.0.0.1:8765/avatar-pack.riv`. Canonical CDN remains `RIVE_DEV_TEST_ASSET_CANONICAL_CDN_URL`. |
| Defect fixed | Wrong Expo SDK pins (`expo-linking@8` / `expo-constants@18` / etc.) caused `NoSuchMethodError` in `ExpoLinkingModule` — aligned to Expo 57 companion versions. Rive/RN pins unchanged. |

### Required checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Native build succeeds | **PASS** |
| 2 | Application installs | **PASS** |
| 3 | Application launches | **PASS** (after Expo linking pin fix) |
| 4 | Development `.riv` loads while online | **PASS** (local mirror of community file; WAN DNS unavailable on emulator) |
| 5 | Artboard visibly renders | **PASS** — evidence `rive-idle-rendered.png` |
| 6 | Rive state machine initializes | **PASS** — boolean inputs applied |
| 7 | IDLE visibly working | **PASS** |
| 8 | LISTEN can be triggered | **PASS** (application-orchestrated; documented) |
| 9 | THINK can be triggered | **PASS** (application-orchestrated; documented) |
| 10 | SPEAK can be triggered | **PASS** (application-orchestrated; documented; non-interruptible by design) |
| 11 | Positive reaction (SMILE → `isHappy`) | **PASS** via adapter/unit path; harness remount now resets to IDLE so SMILE is reachable after SPEAK |
| 12 | Returns to IDLE | **PASS** for SMILE/`returnsToIdle` states via app orchestration |
| 13 | Ordinary React rerenders do not continuously restart animation | **PASS** — parent re-render tick increments while Applied notes remain stable |
| 14 | Unmount/remount behaves correctly | **PASS** |
| 15 | Remote asset/network failure honest fallback | **PASS** — earlier CDN DNS failure showed honest fallback UI |
| 16 | Offline / unresolved host fallback | **PASS** (same as #15 on this host) |
| 17 | Reduced-motion behavior | **PASS** |
| 18 | STANDARD performance profile | **PASS** |
| 19 | LOW performance profile retains presence | **PASS** |
| 20 | Device rotation | **PASS** (user_rotation landscape/portrait; no crash) |
| 21 | Background / resume | **PARTIAL** — soft home/resume kept process; hard path under TCG can drop process |
| 22 | No material native-module crash after linking fix | **PASS** |

Evidence: `/opt/cursor/artifacts/android-rive/` (idle artboard, state triggers, reduced-motion, LOW, remount, fallback, crash-before-fix).

**LISTEN / THINK / SPEAK** remain **application-orchestrated** on the development asset. SMILE → `isHappy`. Marker: `DEVELOPMENT TEST ASSET — NOT VOXORA PRODUCTION ART`. Production must not depend on the community CDN URL.

## iOS status

`IOS NATIVE VALIDATION OUTSTANDING — REQUIRES MACOS/XCODE`

## Merge gate status

Android native Rive visual proof completed on this host with the limitations above recorded. Re-green remote CI after this commit before merge.

## Explicitly not started

- Phase 4 pets  
- Rock Paper Scissors, Spinning Wheel, or full Games Platform implementation  
- Alpha / Alpha Bondfire  
- Production Voxora `.riv` artwork  

## Moon Dash Legendary ownership compatibility

Conceptual lifecycle preserved (not auto-executed):

verified prize → manual redeem code/reference → valid redemption → server ownership grant (`UserAvatarOwnership`) → inventory/selection available → audit → code marked redeemed

No `MoonDashAvatarSystem`. No automatic code issuance/redemption/grant in Phase 3.

