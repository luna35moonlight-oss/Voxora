# Voxora Architecture Decisions — Phase 0

**Document status:** OWNER REVIEW COMPLETE — Phase 0 baseline  
**Owner:** Maryke Farrell  
**Review date:** 2026-08-10  
**Note:** These decisions are authoritative. Cursor must not reinterpret them. Phase 1 may begin only after this documentation update is on `main`.

---

## Decision log

### ADR-001 — Fresh greenfield build
- **Status:** ACCEPTED (factual)
- **Context:** Repository contained only README + Visual Studio gitignore.
- **Decision:** Treat as fresh build; no runtime code to KEEP beyond identity seeds.
- **Consequences:** All systems designed before implementation; Phase 0 docs are the architectural baseline.

### ADR-002 — Primary product is native-installed mobile apps
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Android + iOS independent applications; website supporting only.
- **Consequences:** Mobile architecture drives Phase 1; WebView wrapper forbidden as product.

### ADR-003 — Shared mobile codebase via Expo React Native + TypeScript
- **Status:** APPROVED WITH AMENDMENT (Maryke Farrell, 2026-08-10)
- **Decision:**
  - Expo React Native + TypeScript
  - Production development-build / prebuild architecture (not Expo Go-only)
  - Android and iOS as equal primary production platforms
  - Native modules/bridges where Expo/shared JS is insufficient
  - At scaffold time use the **current stable production Expo SDK** (not beta/canary/experimental)
- **Platform baseline (product minimum):**
  - Android 10 / API 29 or newer
  - iOS **16.4** or newer (not merely “iOS 16+”)
  - If stable Expo SDK or store requirements require a higher minimum, use the higher version and document why
- **Device priority:**
  - Launch-critical: Android phones, iPhones
  - Supported/adaptive (not launch-blocking): Android tablets, iPads
- **Forbidden:** website-first product; WebView wrapper; Expo Go-only app; dependency on ChatGPT/Claude/Copilot or another consumer AI app
- **Scaffold note (2026-08-10):** Current stable Expo SDK is **57** (React Native 0.86; Expo docs: iOS 16.4+, Android 7+). Product Android floor remains **API 29** (stricter than Expo’s SDK floor).
- **Alternatives rejected for default:** Flutter; fully native dual codebase; .NET MAUI
- **Owner review:** Complete

### ADR-004 — Rive character pipeline
- **Status:** APPROVED WITH SAFEGUARDS (Maryke Farrell, 2026-08-10)
- **Decision:** Rive is the **primary** animation/runtime for:
  - living avatars and pets
  - character state machines
  - facial states / expressions
  - reactions
  - compatible clothing/equipment presentation
  - avatar speaking/listening/thinking states
  - pet contextual reactions
- **Safeguards:**
  - Rive is **not** mandated for every visual or game capability
  - Skia / native GPU may supplement for particles, effects, high-performance rendering, specialised games, complex scenes
  - More demanding games may use an appropriate game/rendering runtime later
  - **Battle calculation never belongs to Rive** (server-authoritative, independent of animation)
  - Do not replace Rive without OWNER REVIEW
  - Do not force inappropriate game functionality into Rive merely because Rive is present
- **Art-pipeline proof of concept (required before mass asset production):**
  1. one avatar base  
  2. layered clothing  
  3. one accessory  
  4. one pet  
  5. pet equipment/accessory  
  6. Idle  
  7. Listening  
  8. Thinking  
  9. Speaking  
  10. pet contextual reaction  
  11. runtime state switching  
  12. persistence of equipped assets  
- **Owner review:** Complete

### ADR-005 — Backend NestJS + PostgreSQL + Redis
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:**
  - TypeScript + NestJS modular monolith
  - PostgreSQL as primary system of record
  - Redis for cache / jobs / pub-sub as appropriate
  - BullMQ or equivalent production-ready Redis job system
  - Microservices-first is **NOT** approved
  - Strong domain boundaries so modules can be extracted later when scale genuinely requires it
  - Visual Studio gitignore is **not** a reason to use .NET
- **ORM:** Prisma acceptable as initial preferred solution unless validation shows material reason for Drizzle or another approved alternative. Migrations required; never unsafe production auto-sync.
- **Owner review:** Complete

### ADR-006 — One Alpha
- **Status:** CONFIRMED AND APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:** Exactly one Alpha architecture. Modules access authorised capabilities; do not create Calendar/Email/Wellness/Reminder/Pet/Battle/Game Alphas or a separate Bondfire AI.
- **Bondfire:** Alpha Bondfire is the primary intentional conversational environment for that same Alpha (spelling **Bondfire**, never Bonfire).
- **Provider independence:** Do **not** select a permanent AI/STT/TTS vendor in Phase 1. Establish provider-independent interfaces. External models power Alpha; they are not the product identity.
- **Owner review:** Complete

### ADR-007 — Server authority
- **Status:** CONFIRMED (Maryke Farrell, 2026-08-10)
- **Decision:** Server remains authoritative for durable/commercially meaningful state including: subscription, entitlement, owned avatars/pets, pet progression/levels/equipment validation, game rewards, battle calculation/rewards, reward ledger, provider connections, external action confirmation.
- **Client:** may cache and present; must not be final authority for protected persistent state.
- **Owner review:** Complete

### ADR-008 — Interaction Runtime and Scene Engine
- **Status:** CONFIRMED (Maryke Farrell, 2026-08-10)
- **Decision:** One central Interaction Runtime; one coherent Scene Engine. Screens must never implement duplicate avatar/pet reaction systems.
- **Phase 1:** Do not fully implement Scene Engine or living character production systems unless a minimal interface is specifically required for architectural compilation. Production implementation belongs to later phases.
- **Owner review:** Complete

### ADR-009 — Provider adapters / honest states
- **Status:** CONFIRMED (Maryke Farrell, 2026-08-10)
- **Decision:** Real auth/capability verification only. Never display Connected / Verified / Sent / Scheduled / Synced / Uploaded / Paid / Completed until the real operation succeeded. No fake integrations.
- **Owner review:** Complete

### ADR-010 — Store-compliant billing for digital entitlements
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:**
  - iOS → Apple StoreKit / In-App Purchase
  - Android → Google Play Billing
  - Voxora server validates purchase state and remains final entitlement authority
  - Commercial intention remains Level 1=R15, Level 2=R25, Level 3=R99, Level 4=R125 per month
  - **Do not hard-code those ZAR values into entitlement/access logic**
  - Pricing must be server-configurable, storefront-aware, currency-aware, versioned, auditable
  - Storefronts may map to Apple/Google price points and local currencies
  - Do not create a prohibited web-payment bypass
- **Phase 1:** Foundation/extension points only; full billing implementation is later.
- **Owner review:** Complete

### ADR-011 — Initial public launch 18+
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** No minor accounts in initial version.
- **Owner review:** Complete (unchanged)

### ADR-012 — Wellness uses Alpha; detailed behaviour waits
- **Status:** CONFIRMED — detailed content DEFERRED
- **Decision:** Architect module boundary only; no medical diagnosis invention. Wellness price/content/crisis behaviour deferred until relevant phase.
- **Owner review:** Complete for boundary; content deferred

### ADR-013 — Vertical slice delivery after Phase 0 approval
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:** Follow phases in `roadmap.md`. Phase 0 docs on `main` first; Phase 1 on a separate branch/PR. Do not mix full Phase 1 implementation into Phase 0 PR.
- **Owner review:** Complete

### ADR-014 — Monorepo layout
- **Status:** APPROVED WITH STRUCTURE GUIDANCE (Maryke Farrell, 2026-08-10)
- **Decision:** Top-level:
  ```text
  apps/mobile/
  apps/api/
  packages/…
  conductor/
  ```
- **Eventual packages (create only when Phase responsibility is real — no empty-folder forest):**
  - contracts, domain, design-system, interaction-runtime, scene-engine, auth, entitlements, config, testing
- **Phase 1 shared packages only when they have real responsibility** (e.g. contracts, config, domain foundation, design-system, testing helpers, authz contracts).
- **Owner review:** Complete

### ADR-015 — README + gitignore hygiene
- **Status:** APPROVED
- **Decision:** Official tagline in README; stack-appropriate gitignore in Phase 1.
- **Owner review:** Complete

### ADR-016 — MFA / privileged access
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:**
  - Architecture MFA-capable from Phase 1
  - Launch baseline: MFA **required** for Owner, Admin, Moderator, Support before production privileged access
  - Ordinary user MFA architecturally supported; final mandatory/optional user rule deferred
  - Owner identity server-assigned, auditable, restricted, revocable — never `if email == ownerEmail` in mobile/browser
- **Owner review:** Complete

### ADR-017 — Voice / continuous listening
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:** Continuous listening / wake-word **not** in V1. Mic activates via legitimate user action; visible listening state; proper OS permissions; stop appropriately; never simulate listening on permission failure. Architecture may remain capable of later wake-word after separate approval.
- **Owner review:** Complete

### ADR-018 — Lip sync
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:** Preferred = viseme/phoneme timing when speech provider supplies it. Permitted fallback = audio-amplitude mouth movement. Architecture must allow visemes from the beginning. Do not use purely random mouth animation when real speech timing exists.
- **Owner review:** Complete

### ADR-019 — Deferred product decisions policy
- **Status:** APPROVED (Maryke Farrell, 2026-08-10)
- **Decision:** Many commercial/product formulas do **not** block Phase 1. Mark them `DEFERRED — OWNER DECISION REQUIRED BEFORE RELEVANT IMPLEMENTATION PHASE`. Build interfaces/extension points; do not invent answers. Full list in `open-questions.md`.
- **Owner review:** Complete

### ADR-020 — One-time Owner bootstrap (Phase 1 closeout)
- **Status:** APPROVED (Maryke Farrell, 2026-08-10 closeout)
- **Decision:** Owner bootstrap requires configured identity + secret + registered user; persists completion in DB; rejects if already completed or active OWNER exists; constant-time secret compare; no secret leakage; not reusable via env token alone after completion.
- **Owner review:** Complete

### ADR-021 — Privileged MFA Phase 1 vs Phase 2
- **Status:** APPROVED (Maryke Farrell, 2026-08-10 closeout)
- **Decision:** Phase 1 is **MFA-READY, NOT YET PRODUCTION-ENFORCED**. Phase 2 must implement real privileged MFA enrollment/challenge before privileged production access.
- **Owner review:** Complete

### ADR-022 — Copyright vs third-party licences
- **Status:** APPROVED (Maryke Farrell, 2026-08-10 closeout)
- **Decision:** Voxora product copyright © Maryke Farrell. All rights reserved. Expo template MIT preserved only as third-party attribution (`apps/mobile/THIRD_PARTY_NOTICES.md`). Do not present Voxora as MIT. Public OSS licence for Voxora-owned code requires **OWNER / LEGAL DECISION**.
- **Owner review:** Complete

### ADR-023 — CURRENT PRIVILEGED IDENTITY POLICY: SINGLE OWNER — MARYKE FARRELL
- **Status:** APPROVED (Maryke Farrell, 2026-08-10 Phase 2 closeout)
- **Decision:**
  - Maryke Farrell is the **only** privileged human account at this product stage
  - One OWNER via one-time bootstrap; do **not** also assign ADMIN to Owner merely to duplicate authority
  - ADMIN / MODERATOR / SUPPORT remain in RBAC architecture for future authorised use
  - No additional privileged users/roles are assigned unless the Product Owner explicitly authorises it later
  - OWNER is the highest privileged authority
- **Owner review:** Complete

### ADR-024 — Privileged session MFA assurance (no stale elevation)
- **Status:** APPROVED (Maryke Farrell, 2026-08-10 Phase 2 closeout)
- **Decision:**
  - Server `Session` records carry authoritative `authenticationAssurance` + `mfaVerifiedAt`
  - Privileged sessions may be issued only after successful MFA challenge
  - Refresh of privileged accounts requires existing MFA-assured session; otherwise reject and require fresh MFA login
  - Never silently upgrade an ordinary USER refresh into an OWNER session
  - Owner bootstrap revokes all pre-elevation sessions and does **not** return privileged tokens
  - Granting/revoking privileged roles invalidates existing sessions
  - MFA reset revokes sessions so stale MFA assurance cannot continue
  - Client-provided MFA flags are never trusted
- **Owner review:** Complete

### ADR-025 — White Wolf Moon Dash Phase 2.5 vertical slice
- **Status:** APPROVED (Maryke Farrell, 2026-08-13)
- **Decision:** White Wolf Moon Dash is formally recorded as **Phase 2.5 — Early Game Vertical Slice** inside Voxora.
- **Scope boundary:** This is not authorisation for the full Voxora Games Platform. Full Games remains Phase 13; do not build additional games from this approval.
- **Rules locked:** 10 tries per user per UTC day; server-created attempt reservation before gameplay; server-owned daily attempt count, high score, leaderboard position, and prize states; tied scores rank by earliest authoritative server completion timestamp.
- **Prize posture:** First and Second leaderboard positions are provisional until Owner review. Legendary Avatar redeem codes are manually issued by the Voxora team and must ultimately grant ownership through the real Avatar Catalogue / Avatar Ownership system, not a Moon Dash-specific avatar system.
- **Security posture:** The server validates reservation, ownership, single-use finalization, score bounds, plausible duration, and replay/duplicate submission. Complete deterministic server replay is not yet implemented and must not be represented as cheat-proof.
- **Integration note:** Originally numbered ADR-023 on the Moon Dash branch; renumbered to ADR-025 on integration to preserve Phase 2 ADR-023/024 numbering.
- **Owner review:** Complete for Phase 2.5 slice; public promotional terms still require owner/legal review.

### ADR-026 — Phase 3 Avatar Catalogue and ownership foundation
- **Status:** INTEGRATED FOR OWNER REVIEW (2026-08-14)
- **Decision:** Avatar is modelled as catalogue template + server ownership + inventory + equipped layers + runtime state. It is not a flat profile image.
- **Rive:** Rive remains the primary runtime target. Phase 3 stores Rive asset references; placeholder mobile layers are temporary until production `.riv` files and real runtime validation are completed on the final-integration branch.
- **Legendary prizes:** Future Moon Dash Legendary prizes must grant through the same avatar ownership system. No separate MoonDashAvatarSystem is approved.
- **Boundary:** No pets, no Alpha, no Phase 4, no additional games beyond Moon Dash.
- **Integration note:** Originally numbered ADR-023 on the Phase 3 branch; renumbered to ADR-026 on integration.

### ADR-027 — Authoritative Games & Rewards Addendum
- **Status:** APPROVED REQUIREMENTS RECORDED (Maryke Farrell) — documentation only; do not implement prematurely
- **Integration note:** Originally numbered ADR-024 on the Games & Rewards addendum branch; renumbered to ADR-027 on integration to preserve Phase 2 ADR-024.
- **Decision:**
  - Confirmed future games/mechanics: **Rock Paper Scissors** (10 tries/user/UTC day; server UTC day) and **Spinning Wheel** (server-authoritative outcomes)
  - White Wolf Moon Dash remains the approved Phase 2.5 vertical slice; do not redesign it for this addendum
  - Full modular Games Platform remains **Phase 13**; RPS/Wheel do not authorise skipping phases
  - Rock Paper Scissors contributes **server-approved** progression points toward pet skill development (client never mutates skills/awards)
  - Spinning Wheel may award: Pet Skill-Up Shards; Voxora Diamonds; Voxora Coins; Avatar Skin redeem code — as separate reward types
  - Coins and Diamonds remain separate ledger-backed currencies; no invented commercial rules
  - Central Reward Service / Reward Ledger is mandatory for games/rewards; prevent duplicate grants
  - Shared redeem-code architecture for Moon Dash prizes, Wheel skins, promotions — no parallel incompatible systems; no separate WheelAvatarSystem
  - Prefer reusable UTC play-limit/attempt policy component where appropriate; do not assume every game is 10/day
  - Spinning Wheel attempt/probability/quantity rules are **OWNER DECISION REQUIRED BEFORE SPINNING WHEEL IMPLEMENTATION**
  - Phase 3/4 must only record requirements and avoid architectural dead ends — do not build RPS, Wheel, currencies, or shard economies now
- **Documents:** `game-system.md`, `moon-dash.md`, `pet-system.md`, `avatar-system.md`, `open-questions.md`
- **Owner review:** Requirements approved for recording

### ADR-028 — Voxora Pet Card Race (card-driven pet race slice)
- **Status:** IMPLEMENTED FOR OWNER REVIEW (owner request, 2026-08-17)
- **Decision:** Voxora Pet Card Race is recorded as a second early game slice: a card game in which pets are the racers. One attempt is a **three-race meet** and each race requires a **different pet**.
- **Rules locked:** 10 meets per user per UTC server day; **every player opens every race with the same mixed deal of 8 cards** (6 run cards, 2 tactic cards); four card stations per race then deal extra cards (3 each, **4 at the final station**) for 21 cards a race; unplayed cards stay in hand; **five seconds between card selections**, enforced by the server; 10/J/Q/K run faster than other cards; pairs, two pair, three of a kind, run of four, three pair, full house, and four of a kind advance further; two jokers act as wild cards; the five tactic cards are trail chaser, heavy paws, mud stretch, moon shield, and star sprint; rivals advance one run card per server tick.
- **Server authority:** the shuffle, every deal, rival advances, the cooldown, combination rulings, finishing order, race score, and meet score are server-owned. The client has no score field to submit and never receives the draw pile, the rival deck, or the seed. In-progress state persists in a new nullable `GameAttempt.progressState` column, reusing the existing attempt and daily-counter tables rather than a game-specific schema.
- **Reward posture:** **no** prizes, redeem codes, Coins, Diamonds, Pet Skill-Up Shards, or pet progression are awarded, and nothing is written to a reward ledger. Reward status is reported as `REWARD_RULES_PENDING_OWNER_DECISION`. Any future reward must route through the central Reward Service / Reward Ledger and the shared redeem-code architecture of ADR-027 — never a Pet-Card-Race-specific reward system.
- **Pet boundary:** the four racers are race-local definitions, not `pet_species` records, catalogue templates, or user-owned pets. Phase 4 Pet Foundation remains the owner of real pets and may later map these racers onto real species.
- **Scope boundary:** this does not authorise the full Games Platform (Phase 13), Rock Paper Scissors, the Spinning Wheel, currencies, shard economies, or starting Phase 4.
- **Shared rules package:** card combination and race-score rules live in the ADR-014 approved `packages/domain` package so the client preview and the server ruling cannot drift; the server still evaluates every play independently.
- **Owner review:** pending. Provisional balance values (track length, station steps, the split inside the opening deal, tick rate, score weights) are recorded as open questions rather than settled product rules.
- **Document:** `pet-card-race.md`

---

## Process gate

| Gate | Status |
|------|--------|
| Phase 0 architecture approved with amendments | **YES** (2026-08-10) |
| Phase 0 on `main` | **YES** |
| Phase 1 Core Foundation + closeout | **MERGED** (PR #2) |
| Phase 2 | **INTEGRATED** (source PR #3) |
| Phase 2.5 White Wolf Moon Dash vertical slice | **INTEGRATED** (source PR #4) — full Games still Phase 13 |
| Phase 3 Scene Engine and living avatar foundation | **INTEGRATED** (source PR #5) — Rive native validation + final Owner review pending |
| Games & Rewards Addendum | **INTEGRATED / DOCUMENTED ONLY** (source PR #6 / ADR-027) — RPS, Wheel, currencies NOT implemented; do not start Phase 4 |
| Voxora Pet Card Race slice | **IMPLEMENTED FOR OWNER REVIEW** (ADR-028) — server-authoritative game and leaderboard only; no rewards, no pets, full Games still Phase 13 |
