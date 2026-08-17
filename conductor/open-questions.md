# Voxora Open Questions — Phase 0

**Document status:** OWNER REVIEW COMPLETE — deferred items remain visible  
**Product owner:** Maryke Farrell  
**Last updated:** 2026-08-10 (Phase 2 — deferred commercial/Bondfire/Wellness rules unchanged)  

**Policy:** Items marked **DEFERRED — OWNER DECISION REQUIRED BEFORE RELEVANT IMPLEMENTATION PHASE** do **not** block Phase 1. Cursor must build interfaces/extension points and must **not** invent answers.

Items marked **RESOLVED** were decided in the 2026-08-10 owner review.

---

## Resolved by owner (2026-08-10)

| ID | Decision |
|----|----------|
| OQ-MOB-001 | Expo React Native + TypeScript APPROVED (dev builds/prebuild; stable SDK only) |
| OQ-MOB-002 | Android minimum = API 29 (Android 10) |
| OQ-MOB-003 | iOS minimum = **16.4** |
| OQ-MOB-004 | Tablets supported/adaptive; not launch-blocking |
| OQ-MOB-005 | Continuous listening / wake-word **not** in V1 |
| OQ-AV-001 | Rive APPROVED as primary living-character runtime, with safeguards (not every visual system) |
| OQ-AV-004 | Visemes preferred; amplitude fallback allowed; architecture must support visemes from the start |
| OQ-BE-001 | NestJS + TS modular monolith + PostgreSQL + Redis + BullMQ APPROVED (not .NET by default) |
| OQ-COM-019 | Apple IAP + Google Play Billing architecture APPROVED; server final entitlement authority; no prohibited web bypass |
| OQ-COM-020 | ZAR commercial intention retained; do not hard-code R15/R25/R99/R125 into access logic; map via storefront config |
| OQ-SEC-001 (partial) | MFA required for Owner/Admin/Moderator/Support at privileged production access; ordinary-user MFA capability required; final user mandate deferred |
| OQ-SEC-003 | Owner bootstrap server-side only — never client email hard-code; Phase 1 closeout makes bootstrap genuinely one-time |
| OQ-PROC-001 | Phase 0 approved with amendments; Phase 1 authorised after docs update |
| OQ-PROC-002 | ADRs updated per `decisions.md` |
| OQ-AL-001..002 (Phase 1) | Do **not** select permanent AI/STT/TTS vendors in Phase 1 — interfaces only |

---

## A. Commercial & subscriptions — DEFERRED

| ID | Question | Status |
|----|----------|--------|
| OQ-COM-001 | Wellness final price? | DEFERRED — OWNER DECISION REQUIRED BEFORE RELEVANT IMPLEMENTATION PHASE |
| OQ-COM-002 | Add-on pricing catalogue? | DEFERRED |
| OQ-COM-003 | Package pricing (avatar/pet packages)? | DEFERRED |
| OQ-COM-004 | Avatar package ownership rules? | DEFERRED |
| OQ-COM-005 | Pet package ownership rules? | DEFERRED |
| OQ-COM-006 | Cancellation rules? | DEFERRED |
| OQ-COM-007 | Failed payment rules? | DEFERRED |
| OQ-COM-008 | Grace periods? | DEFERRED |
| OQ-COM-009 | Upgrade rules? | DEFERRED |
| OQ-COM-010 | Downgrade rules? | DEFERRED |
| OQ-COM-011 | Reactivation rules? | DEFERRED |
| OQ-COM-012 | Trial reset rules? | DEFERRED |
| OQ-COM-013 | Purchased cosmetics after downgrade? | DEFERRED |
| OQ-COM-014 | Pet ownership after downgrade? | DEFERRED |
| OQ-COM-015 | Progression after downgrade? | DEFERRED |
| OQ-COM-016 | Promotional access rules? | DEFERRED |
| OQ-COM-017 | Refunds policy? | DEFERRED |
| OQ-COM-018 | Bondfire quota reset period? | DEFERRED |

Commercial intention (not hard-coded into entitlement logic): Level 1 R15 / Level 2 R25 / Level 3 R99 / Level 4 R125 per month.

---

## B. Bondfire quota counting — DEFERRED

| ID | Question | Status |
|----|----------|--------|
| OQ-BF-001 | Do failed Alpha requests count? | DEFERRED |
| OQ-BF-002 | Do retries count? | DEFERRED |
| OQ-BF-003 | How do voice requests count? | DEFERRED |
| OQ-BF-004 | Do tool invocations count separately? | DEFERRED |
| OQ-BF-005 | How does streaming count? | DEFERRED |
| OQ-BF-006 | Level 4 Bondfire quota / unlimited? | DEFERRED |

---

## C. Pets, training, battles, games — DEFERRED

| ID | Question | Status |
|----|----------|--------|
| OQ-PET-001 | Exact XP levels / thresholds? | DEFERRED |
| OQ-PET-002 | Exact evolution rules? | DEFERRED |
| OQ-PET-003 | Exact pet energy rules? | DEFERRED |
| OQ-PET-004 | Exact battle balancing formulas? | DEFERRED |
| OQ-PET-005 | Exact matchmaking rules? | DEFERRED |
| OQ-PET-006 | Which fairness option is approved? | DEFERRED |
| OQ-PET-007 | Exact game scores and rewards? | DEFERRED |
| OQ-PET-008 | Exact achievement list and reward values? | DEFERRED |
| OQ-PET-009 | General leaderboard rules? | DEFERRED — Moon Dash Phase 2.5 tie rule is resolved only for that slice |
| OQ-PET-010 | Marketplace rules (if any)? | DEFERRED |
| OQ-PET-011 | Launch species list and art priority? | DEFERRED |
| OQ-PET-012 | Is PvP required for first public launch? | DEFERRED |
| OQ-GAME-025 | Moon Dash exceptional technical-failure refund policy? | OWNER DECISION REQUIRED |
| OQ-GAME-026 | Moon Dash complete server replay / signed move telemetry requirements? | OWNER DECISION REQUIRED BEFORE PUBLIC COMPETITIVE LAUNCH |
| OQ-GAME-027 | Moon Dash promotion start/end dates, eligibility, territory, and public rules version? | PROMOTIONAL COMPETITION TERMS — OWNER / LEGAL REVIEW REQUIRED BEFORE PUBLIC LAUNCH |
| OQ-PET-013 | RPS points per win/draw/loss toward pet skills? | DEFERRED — OWNER DECISION REQUIRED BEFORE IMPLEMENTATION |
| OQ-PET-014 | Pet skill level thresholds / maxima / species multipliers? | DEFERRED — OWNER DECISION REQUIRED BEFORE IMPLEMENTATION |
| OQ-PET-015 | Pet Skill-Up Shard rarity / shards-per-level / upgrade probability? | DEFERRED — OWNER DECISION REQUIRED BEFORE IMPLEMENTATION |
| OQ-GAME-WHEEL-001 | Spinning Wheel spins, reset rules, probabilities, quantities? | OWNER DECISION REQUIRED BEFORE IMPLEMENTATION |
| OQ-PCR-001 | Pet Card Race rewards / prizes / competition (currently none are awarded)? | **OWNER DECISION REQUIRED BEFORE ANY PET CARD RACE REWARD** |
| OQ-PCR-002 | Pet Card Race balance values — track length 14, station steps 3/6/9/12, the 6 run / 2 tactic split inside the 8-card opening deal, 1.3 s rival tick, combination step values and the two-step high-card cap, the two-step slow cost, score weights? (owner-stated rules — three races, the 8-card opening deal, 3/3/3/4 station deals, five second wait, fast 10/J/Q/K, combinations, jokers, five tactic cards — are not in question) | PROVISIONAL — OWNER CONFIRMATION REQUESTED (see `pet-card-race.md` §7) |
| OQ-PCR-003 | Should the rival trainers keep answering every station after the first with one tactic aimed at the champion? | PROVISIONAL — OWNER CONFIRMATION REQUESTED |
| OQ-PCR-004 | Which real pet species should the four racers map onto once Phase 4 Pet Foundation exists? | DEFERRED — OWNER DECISION REQUIRED (racers are game-local until then) |
| OQ-PCR-005 | Should Pet Card Race results ever contribute pet skill progression like Rock Paper Scissors? | DEFERRED — OWNER DECISION REQUIRED; nothing is written today |

**Confirmed (not inventable):** Rock Paper Scissors is a future game (10 tries/user/UTC day) that contributes server-approved progression points toward pet skill development. Pet Skill-Up Shards are a confirmed reward type. Exact formulas remain deferred. See `game-system.md` / ADR-027. Do not implement RPS, Wheel, Coins, Diamonds, or shard economies in Phase 3.

**Related future gate (not Phase 1):** Art-pipeline PoC (avatar + layered outfit + pet + accessory + Idle/Listen/Think/Speak/Reaction) before mass asset production — see ADR-004.

---

## D. Avatar & art pipeline — partially resolved

| ID | Question | Status |
|----|----------|--------|
| OQ-AV-002 | Launch avatar bases and clothing package set? | DEFERRED |
| OQ-AV-003 | Who produces rigs/animations? | DEFERRED |
| OQ-AV-004b | Production `.riv` files for the Phase 3 proof avatar and layers? | OWNER / ART PIPELINE REQUIRED |
| OQ-AV-005 | Final Legendary Moon Dash avatar art and catalogue reference? | OWNER / ART PIPELINE REQUIRED BEFORE PUBLIC PRIZE REDEMPTION |
| OQ-AV-006 | Downgrade behavior for explicitly owned avatar cosmetics? | OWNER DECISION REQUIRED BEFORE COMMERCIAL ENFORCEMENT |

---

## E. Backend / ops — deferred where not decided

| ID | Question | Status |
|----|----------|--------|
| OQ-BE-002 | Preferred cloud host / region / data residency? | DEFERRED (Phase 1 needs env structure only) |
| OQ-BE-003 | Object storage vendor? | DEFERRED |
| OQ-BE-004 | Email delivery vendor? | DEFERRED (verification architecture in Phase 1; vendor later) |
| OQ-BE-005 | SMS OTP vendor? | DEFERRED |

---

## F. Alpha & providers — deferred vendor picks

| ID | Question | Status |
|----|----------|--------|
| OQ-AL-001 | Initial AI model provider(s)? | DEFERRED — interfaces only in foundation |
| OQ-AL-002 | STT/TTS vendor vs OS speech APIs? | DEFERRED |
| OQ-AL-003 | Launch order for Google vs Microsoft mail/calendar? | DEFERRED |
| OQ-AL-004 | Are contacts launch-critical? | DEFERRED |
| OQ-AL-005 | Which messaging networks to investigate first? | DEFERRED |
| OQ-AL-006 | Memory / transcript retention defaults? | DEFERRED |

---

## G. Security, legal, Wellness — deferred remainder

| ID | Question | Status |
|----|----------|--------|
| OQ-SEC-001b | Final ordinary-user MFA mandatory vs optional at launch? | DEFERRED |
| OQ-SEC-002 | Account deletion & retention policy details? | DEFERRED |
| OQ-SEC-004 | Phase 2 privileged MFA must be production-enforced (TOTP enrollment/challenge) | **REQUIRED IN PHASE 2** (not inventable as optional for privileged roles) |
| OQ-LEG-001 | Final Terms / Privacy versions for recording? | DEFERRED |
| OQ-LEG-002 | Communications preference defaults? | DEFERRED |
| OQ-LEG-003 | Public open-source licence grant for Voxora-owned code (if any)? | **OWNER / LEGAL DECISION REQUIRED** — do not invent MIT/Apache/etc. for Voxora product source |
| OQ-WEL-001 | Detailed Wellness specification? | DEFERRED |
| OQ-WEL-002 | Wellness pricing? | DEFERRED |

---

## H. Technical limitations (still anticipated)

| ID | Topic | Note |
|----|-------|------|
| OQ-LIM-001 | Unified inbox for WhatsApp/Instagram/etc. | Provider/legal — verify before promising |
| OQ-LIM-002 | Web payment for digital unlocks | Store policy — IAP/Play Billing path approved |
| OQ-LIM-003 | Background processing on iOS/Android | OS limits; server jobs + push |
| OQ-LIM-004 | Perfect viseme lip sync | Provider-dependent; architecture must allow visemes |
| OQ-LIM-005 | Always-on mic wake word | Not V1; later approval only |

---

## I. Games, rewards, currencies — confirmed vs deferred

| ID | Question | Status |
|----|----------|--------|
| OQ-GAME-001 | Confirmed game set includes Moon Dash, Rock Paper Scissors, Spinning Wheel? | **RESOLVED** — yes (see ADR-027 / `game-system.md`) |
| OQ-GAME-002 | RPS daily attempts? | **RESOLVED** — 10 tries/user/UTC day (server UTC day) |
| OQ-GAME-003 | Moon Dash daily attempts? | **RESOLVED** — 10 tries/user/UTC day (unchanged) |
| OQ-GAME-004 | Spinning Wheel spin count / free-spin frequency / UTC reset / earned or purchased spins? | DEFERRED — **OWNER DECISION REQUIRED BEFORE SPINNING WHEEL IMPLEMENTATION** |
| OQ-GAME-005 | Spinning Wheel reward probabilities (Coins / Diamonds / Shards / Avatar Skin)? | DEFERRED — OWNER DECISION REQUIRED |
| OQ-GAME-006 | Spinning Wheel reward quantities? | DEFERRED — OWNER DECISION REQUIRED |
| OQ-CUR-001 | Voxora Coins and Diamonds are separate ledger-backed currencies? | **RESOLVED** — yes; do not collapse |
| OQ-CUR-002 | Coin/Diamond purchase price, exchange rate, expiration, transfer, gifting, cash value, withdrawal, marketplace, max balances? | DEFERRED — OWNER DECISION REQUIRED |
| OQ-RWD-001 | Central Reward Ledger for all games? | **RESOLVED** — required architecture |
| OQ-RWD-002 | Shared redeem-code architecture across Moon Dash / Wheel / promotions? | **RESOLVED** — required; no parallel incompatible systems |
| OQ-RWD-003 | Redeem-code expiry rules? | DEFERRED — do not invent unless defined |

Do **not** implement Rock Paper Scissors, Spinning Wheel, Coins, Diamonds, or shard economies during Phase 3/4 merely because requirements are recorded.

---

## J. Process

| ID | Status |
|----|--------|
| OQ-PROC-001 | RESOLVED — Phase 0 approved; Phase 1 authorised after docs on baseline |
| Phase 2 gate | Per owner instruction (2026-08-13) |
| Phase 3 gate | IMPLEMENTED FOR OWNER REVIEW + Games & Rewards addendum recorded |
| Phase 13 | Full Games Platform — RPS + Wheel belong here, not Phase 3/4 |
