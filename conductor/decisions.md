# Voxora Architecture Decisions — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Note:** Items marked PROPOSED are recommendations for Maryke Farrell’s approval. Nothing here authorises Phase 1 coding until Phase 0 review completes.

---

## Decision log

### ADR-001 — Fresh greenfield build
- **Status:** ACCEPTED (factual)
- **Context:** Repository contains only README + Visual Studio gitignore.
- **Decision:** Treat as fresh build; no runtime code to KEEP beyond identity seeds.
- **Consequences:** All systems designed before implementation; Phase 0 docs required.

### ADR-002 — Primary product is native-installed mobile apps
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Android + iOS independent applications; website supporting only.
- **Consequences:** Mobile architecture drives Phase 1; WebView wrapper forbidden as product.

### ADR-003 — Shared mobile codebase via Expo React Native + TypeScript
- **Status:** PROPOSED
- **Decision:** One shared app targeting Android/iOS with prebuild/dev client.
- **Alternatives:** Flutter; fully native; .NET MAUI.
- **Why:** Cross-platform speed, device capability modules, shared contracts with TS API, Rive support.
- **Trade-off:** Some game/battle performance edges may need native/Skia care; dual-native fidelity lower than pure Kotlin/Swift.
- **Owner review:** Required before Phase 1 scaffold.

### ADR-004 — Character rendering with Rive inside Scene Engine
- **Status:** PROPOSED
- **Decision:** Avatars/pets/clothing layers via Rive state machines + asset catalogue.
- **Trade-off:** Requires Rive art pipeline/skills; alternative engines (Spine/custom) possible if owner prefers.
- **Owner review:** Required.

### ADR-005 — Backend as TypeScript modular monolith (NestJS) + PostgreSQL + Redis
- **Status:** PROPOSED
- **Decision:** Modular monolith first; Postgres system of record; Redis for jobs/pubsub; BullMQ jobs.
- **Alternatives:** .NET API (suggested by leftover VS gitignore); microservices-first.
- **Trade-off:** Nest/TS aligns with mobile TS contracts; .NET may be preferred if owner/.NET ecosystem is strategic — must be an explicit choice, not ignore-file inertia.
- **Owner review:** Required.

### ADR-006 — One Alpha service; Bondfire is a client surface
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Single Alpha orchestration with tools/memory; no per-feature bots.
- **Consequences:** Shared permission model; Bondfire spelling preserved.

### ADR-007 — Server authority for commercial, pets, battles, rewards
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Entitlements, progression, battle outcomes, rewards validated server-side.
- **Consequences:** Clients animate/display; never authorise durable grants alone.

### ADR-008 — Central Interaction Runtime + Scene Engine
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Mandatory shared runtimes; no per-screen reaction logic.
- **Consequences:** Early package for testable pure logic.

### ADR-009 — Provider adapter layer with honest connection states
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** Real OAuth + capability verification; no fake Connected.
- **Consequences:** Some social networks may remain Unavailable if APIs insufficient.

### ADR-010 — Store-compliant billing path for digital entitlements
- **Status:** PROPOSED / BLOCKED ON OWNER + LEGAL
- **Decision:** Plan Apple IAP + Google Play Billing receipt validation as default for digital unlocks; web pricing remains product-configured but may be constrained by stores.
- **Trade-off:** ZAR marketing prices must map to store products/currencies; external payment may be limited.
- **Owner review:** Critical.

### ADR-011 — Initial public launch 18+
- **Status:** ACCEPTED (spec-mandated)
- **Decision:** No minor accounts in initial version.
- **Consequences:** Age gate in onboarding; future guardian design separate.

### ADR-012 — Wellness uses Alpha; detailed behaviour waits for owner spec
- **Status:** ACCEPTED (spec-mandated boundary)
- **Decision:** Architect module boundary only in Phase 0; no medical diagnosis invention.
- **Consequences:** Phase 16 blocked until specification arrives.

### ADR-013 — Vertical slice delivery after Phase 0 approval
- **Status:** PROPOSED
- **Decision:** Follow phases 1–17 in `roadmap.md` with complete slices.
- **Owner review:** Approve roadmap sequencing / any re-ordering needs.

### ADR-014 — Monorepo layout apps/mobile + apps/api + packages/*
- **Status:** PROPOSED
- **Decision:** Structure documented in `architecture.md`; not scaffolded in Phase 0.
- **Owner review:** Approve before Phase 1.

### ADR-015 — Replace README tagline; refactor gitignore in Phase 1
- **Status:** PROPOSED
- **Decision:** Official tagline replaces “Voice to Avatar”; stack-appropriate gitignore.
- **Owner review:** Minor; can approve with Phase 1.

---

## Explicit non-decisions (cannot be made by Cursor alone)

See `open-questions.md` for commercial numbers, battle balance, quota counting, provider launch set, MFA launch requirement, and Wellness content/pricing.
