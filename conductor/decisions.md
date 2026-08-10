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

---

## Process gate

| Gate | Status |
|------|--------|
| Phase 0 architecture approved with amendments | **YES** (2026-08-10) |
| Phase 0 documentation updated to reflect decisions | In progress / this document |
| Phase 0 on `main` before Phase 1 code | Required |
| Phase 1 authorised after documentation update | **YES** — Core Foundation only |
| Phase 2 | **NOT authorised** until Phase 1 owner review |
