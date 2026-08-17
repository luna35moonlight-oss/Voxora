# Voxora Requirements Matrix — Phase 3 final integration

**Document status:** Phase 2 + 2.5 + 3 integrated; Games & Rewards Addendum **recorded** (not implemented); Rive native validation pending  
**Last updated:** 2026-08-14

---

## Architecture gates

| ID | Status |
|----|--------|
| REQ-000 … REQ-000i, REQ-200 | APPROVED |

---

## Phase 1 foundation

| ID | Description | Status | Evidence |
|----|-------------|--------|----------|
| REQ-P1 | Phase 1 core foundation | MERGED | PR #2 → main |
| REQ-150a | Owner bootstrap genuinely one-time | MERGED / TESTED | `OwnerBootstrapCompletion` |
| REQ-LEG-OSS | Public OSS licence for Voxora-owned code | OWNER / LEGAL DECISION REQUIRED | OQ-LEG-003 |

---

## Phase 2 account & commercial

| ID | Description | Status | Evidence |
|----|-------------|--------|----------|
| REQ-P2 | Phase 2 account & commercial foundation | IMPLEMENTED / TESTED | Phase 2 PR |
| REQ-P2-ONB | Resumable server onboarding state machine | IMPLEMENTED / TESTED | `OnboardingState` + e2e |
| REQ-011 | Email verification + EmailDeliveryProvider | IMPLEMENTED / TESTED | NOT_CONFIGURED / dev capture |
| REQ-012 | Phone OTP + PhoneVerificationProvider | IMPLEMENTED / TESTED | E.164 + OTP lifecycle |
| REQ-013 | Username unique/normalized/reserved | IMPLEMENTED / TESTED | username util + e2e |
| REQ-014 | Privacy defaults PRIVATE | IMPLEMENTED / TESTED | UserProfile |
| REQ-015 | Region/locale/tz/currency | IMPLEMENTED / TESTED | onboarding region-locale |
| REQ-016 | Interests INTEREST_SELECTED ≠ CONNECTED | IMPLEMENTED / TESTED | ProviderInterest |
| REQ-017 | Age gate 18+ versioned record | IMPLEMENTED / TESTED | age-gate-v1 |
| REQ-018 | Versioned consents | IMPLEMENTED / TESTED | ConsentRecord |
| REQ-019 | Product catalogue Levels 1–4 | IMPLEMENTED / TESTED | CatalogueService seed |
| REQ-020 | Entitlement Service (server authoritative) | IMPLEMENTED / TESTED | EntitlementsService |
| REQ-021 | Feature flags ≠ entitlements | IMPLEMENTED | separate modules |
| REQ-022 | Apple/Google store adapters | IMPLEMENTED (NOT_CONFIGURED) | StoreService |
| REQ-023 | Wellness trial architecture only | IMPLEMENTED | TrialGrant ARCHITECTURE_ONLY |
| REQ-P2-MFA | Privileged MFA production enforcement | IMPLEMENTED / TESTED | TOTP enroll/challenge e2e |
| REQ-P2-SESS | Privileged session MFA assurance + no stale elevation | IMPLEMENTED / TESTED | Session.mfaVerifiedAt + refresh/bootstrap/reset e2e |
| REQ-P2-OWNER | Single Owner privileged identity (Maryke Farrell) | APPROVED / DOCUMENTED | ADR-023; no ADMIN dual-assign |
| REQ-P2-SET | Settings surfaces | IMPLEMENTED | `/v1/settings` + mobile |
| REQ-P2-HANDOFF | Avatar/pet handoff without fake ownership | IMPLEMENTED / TESTED | AVATAR_PET_HANDOFF |
| REQ-090 | Alpha Bondfire conversations | NOT STARTED (correct) | — |
| REQ-032/033 | Scene Engine / Interaction Runtime production | INTEGRATED foundation (Phase 3) | Scene Engine docs + avatar runtime |

Deferred commercial formulas remain in `open-questions.md`.

---

## Phase 2.5 — White Wolf Moon Dash early game vertical slice

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P25-001 | White Wolf Moon Dash runs inside Voxora only | Mobile home game card | — | — | Mobile game logic tests | INTEGRATED |
| REQ-P25-002 | Server reserves attempt before gameplay | Start daily try control | `POST /v1/games/white-wolf-moon-dash/attempts/start` | `GameAttempt`, `GameDailyCounter` | API typecheck + service tests | INTEGRATED |
| REQ-P25-003 | 10 tries per user per UTC day | Attempts remaining display | Atomic server daily counter | `GameDailyCounter` unique user/game/day | Regression required before public launch | INTEGRATED |
| REQ-P25-004 | Score submission single-use and user-bound | Automatic end/forfeit submission | `POST /attempts/:attemptId/complete` | `GameAttempt.status`, `validationStatus` | API service tests cover ranking; broader e2e pending | INTEGRATED |
| REQ-P25-005 | High score and leaderboard server-side | Best score/rank display | `GET /me` status | completed `GameAttempt` rows | Tie-rule service test | INTEGRATED |
| REQ-P25-006 | Tie rule: highest score, then earliest server completion | Prize positions display | Service ranking | `completedAt` server timestamp | Tie-rule service test | INTEGRATED |
| REQ-P25-007 | Prize position is not verified winner | Clear prize status copy | Typed reward states | `GamePrizeAward` lifecycle model | Contract tests | INTEGRATED |
| REQ-P25-008 | Legendary Avatar code manual only | Honest mobile copy | No code generation endpoint | Prize award model has issuance fields only | Regression required before public launch | INTEGRATED |
| REQ-P25-009 | Public promotional rules not invented | — | — | — | Documentation review | OWNER / LEGAL REVIEW REQUIRED |

---

## Voxora Pet Card Race — card-driven pet race slice (ADR-028)

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-PCR-001 | Card game with pets as the racers, inside Voxora | Mobile home race card with four lanes | `GET /v1/games/pet-card-race/me` | — | Mobile helper tests | IMPLEMENTED FOR OWNER REVIEW |
| REQ-PCR-002 | 10 meets per user per UTC server day | Meets remaining display | Atomic daily counter increment | `GameDailyCounter` unique user/game/day | Engine + service tests | IMPLEMENTED |
| REQ-PCR-003 | Three races per meet, a different pet each race | Champion picker filtered to unused pets | `POST /meets/:attemptId/races/next` | `GameAttempt.progressState` | Engine meet-completion tests | IMPLEMENTED |
| REQ-PCR-004 | Every player starts a race with the same mixed deal of 8 cards | Opening hand | Server deals 6 run cards and 2 tactic cards | `GameAttempt.progressState` | Engine opening-deal tests | IMPLEMENTED |
| REQ-PCR-004b | Four stations per race deal extra cards: 3, 3, 3, then 4 | Hand and station counter | Server deal from a server-held draw pile | `GameAttempt.progressState` | Engine station tests | IMPLEMENTED |
| REQ-PCR-005 | Five seconds between card selections | Countdown on the run button | Server compares its own last-play timestamp | — | Engine cooldown test | IMPLEMENTED |
| REQ-PCR-006 | Combinations, jokers, and faster 10/J/Q/K cards | Live selection preview | Server re-evaluates every selection | — | `packages/domain` combination tests | IMPLEMENTED |
| REQ-PCR-007 | Five tactic cards: chaser, weights, mud, shield, sprint | Tactic cards and target picker | Engine tactic effects and rival answers | `GameAttempt.progressState` | Engine tactic tests | IMPLEMENTED |
| REQ-PCR-008 | Rival racers advance on the server clock | Animated lanes plus sync polling | `POST /meets/:attemptId/sync` | — | Engine rival tick test | IMPLEMENTED — polling transport is a known limitation |
| REQ-PCR-009 | Score is server-computed; the client cannot submit one | Score breakdown display | No score field exists in any request | `GameAttempt.score` | Engine score tests | IMPLEMENTED |
| REQ-PCR-010 | Leaderboard by best meet score, ties by earliest completion | Leaderboard list | Service ranking | completed `GameAttempt` rows | Leaderboard service test | IMPLEMENTED |
| REQ-PCR-011 | No rewards, currencies, redeem codes, or pet progression | Honest reward-status copy | `REWARD_RULES_PENDING_OWNER_DECISION` | No ledger or prize writes | Documentation review | OWNER DECISION REQUIRED |
| REQ-PCR-012 | Racers are game-local, not pet or avatar records | Race roster only | Roster constant in contracts | No pet or avatar tables touched | Documentation review | IMPLEMENTED |
| REQ-PCR-013 | Balance values confirmed by the owner | — | — | — | Documentation review | PROVISIONAL — OWNER CONFIRMATION REQUESTED |

---

## Phase 3 — Scene Engine and living avatar foundation

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P3-001 | Avatar Catalogue | Avatar Foundation card catalogue list | `GET /v1/avatars/me` | `AvatarCatalogue`, `AvatarAsset` | Contracts + API typecheck | INTEGRATED |
| REQ-P3-002 | Avatar ownership | Locked/owned labels | Ownership validation in `AvatarsService` | `UserAvatarOwnership` | Contracts locked Legendary test | INTEGRATED |
| REQ-P3-003 | Avatar inventory | Wardrobe proof list | Inventory validation in `AvatarsService` | `AvatarItem`, `UserAvatarItemOwnership` | Contracts equipment test | INTEGRATED |
| REQ-P3-004 | Equip/unequip persistence | Equip/unequip controls | `POST /avatars/equip`, `POST /avatars/unequip` | `UserAvatarEquipment` | API typecheck, mobile typecheck | INTEGRATED |
| REQ-P3-005 | Compatibility rules | Locked/incompatible errors | Rig/ownership/conflict checks | Item rig + conflict metadata | API typecheck | INTEGRATED |
| REQ-P3-006 | Runtime state model | Idle/Listen/Think/Speak/Smile controls | Client runtime foundation | — | `avatarRuntime.test.ts` | INTEGRATED |
| REQ-P3-007 | Reduced motion | Toggle in avatar card | Client runtime fallback | — | Reduced-motion runtime test | INTEGRATED |
| REQ-P3-008 | Rive primary runtime | Avatar Foundation Rive view | Catalogue stores Rive refs + `@rive-app/react-native@0.4.19` | `riveAssetRef`, `AvatarAsset.storageRef` | Adapter/unit tests; native outstanding | INTEGRATED — JS validated; NATIVE VALIDATION REQUIRED |
| REQ-P3-009 | Moon Dash Legendary prize compatibility | Locked Legendary avatar reference | Future ownership grant path uses same ownership model | `UserAvatarOwnership` | Contract locked Legendary test | INTEGRATED FOUNDATION |
| REQ-P3-010 | No pets / no Alpha / no additional games beyond Moon Dash | Honest mobile copy | Moon Dash only; no pet/Alpha APIs | — | Documentation review | INTEGRATED |
| REQ-P3-011 | Games & Rewards Addendum recorded (RPS, Wheel, ledger, currencies) | — | Docs only — no premature game build | — | `game-system.md` + ADR-027 | RECORDED — NOT IMPLEMENTED |
| REQ-GAME-RPS | Rock Paper Scissors — 10/UTC day; pet skill progression points | Future Phase 13 | Server-authoritative | Future | — | CONFIRMED FUTURE — NOT STARTED |
| REQ-GAME-WHEEL | Spinning Wheel — Shards / Diamonds / Coins / Avatar Skin code | Future Phase 13 | Server-authoritative outcome | Future | — | CONFIRMED FUTURE — NOT STARTED |
| REQ-RWD-LEDGER | Central Reward Ledger for games/rewards | Future | Reward Service | `reward_ledger` (planned) | — | ARCHITECTURE REQUIRED — NOT IMPLEMENTED |
| REQ-CUR-SPLIT | Voxora Coins ≠ Diamonds | Future | Ledger-backed separate types | Future balances | — | CONFIRMED — commercial rules deferred |
