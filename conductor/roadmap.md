# Voxora Implementation Roadmap — Phase 0 / Baseline

**Document status:** OWNER APPROVED (2026-08-10) with Phase 1 authorised after docs baseline  
**Method:** Vertical slices — not 50 disconnected UI pages.  
**Process:** Phase 0 PR = documentation only → merge to `main` → Phase 1 on a **new** branch/PR.

---

## Phase 0 — Architecture & audit — COMPLETE PENDING DOCS MERGE

Deliverables: `conductor/*` documents, repository audit, check results, open questions, approved architecture decisions.

Owner review: **approved with amendments** (2026-08-10).  
Documentation update incorporates those decisions.  
**Do not mix full Phase 1 application implementation into the Phase 0 PR.**

---

## Phase 1 — Core foundation — AUTHORISED AFTER PHASE 0 DOCS ON MAIN

Scope (only):

- monorepo foundation (`apps/mobile`, `apps/api`, real `packages/*` only when needed)
- mobile application skeleton (Expo RN stable SDK, Android API 29+, iOS 16.4+)
- API/backend skeleton (NestJS modular monolith)
- PostgreSQL foundation + Prisma migrations (Phase 1 entities only)
- Redis/job infrastructure foundation (BullMQ or equivalent)
- environment configuration structure
- shared contracts / config / design-system / testing helpers as needed
- authentication foundation
- RBAC foundation + permission architecture
- MFA capability foundation (privileged roles policy documented)
- security controls
- feature flags foundation
- audit foundation
- structured logging + error handling + health checks
- testing infrastructure + CI checks + development tooling

**Explicitly out of Phase 1:**

- Phase 2 onboarding/commercial product behaviour
- Bondfire UI/functionality
- pets, battles, games, Wellness
- fake Connected/Verified provider screens
- mass screen generation
- permanent AI/STT/TTS vendor selection
- inventing deferred commercial formulas

**Exit / completion report required** (see owner Phase 1 checklist), then:

# OWNER REVIEW REQUIRED BEFORE PHASE 2

---

## Phase 2 — Account and commercial foundation

- Resumable onboarding  
- Email verification (full product flows)  
- Phone OTP  
- Settings + privacy defaults  
- Products, prices (server)  
- Subscriptions + Apple/Google receipt validation  
- Entitlements engine  
- Trials structure (Wellness trial wiring later)

**Exit criteria:** User can register, verify, subscribe (sandbox), receive entitlements; prices not hard-coded in UI.

**Not started until Phase 1 owner approval.**

---

## Phase 3 — Scene and avatar

- Scene Engine (Rive primary; Skia/native may supplement)  
- Art-pipeline PoC gate before mass assets (ADR-004)  
- Avatar catalogue + instance + clothing + state machine  

---

## Phase 4 — Pet foundation

- Species + catalogue + owned pet  
- Clothing/equipment  
- Growth plumbing  
- Basic interactions  

---

## Phase 5 — Living interaction

- Interaction Runtime  
- Event catalogue wiring  
- Reactions + priorities  
- Voice states + lip sync (viseme preferred / amplitude fallback)  

---

## Phase 6 — Alpha foundation

- Alpha orchestration  
- Model provider **abstraction** (vendor selection still owner-deferred)  
- Tools + permissions  
- Memory subsystem  

---

## Phase 7 — Alpha Bondfire

- Text + streaming + voice  
- Avatar/pet presence  
- Quota enforcement per owner decisions (still deferred until then)  

Spelling: **Bondfire** only.

---

## Phase 8 — Notifications and reminders

---

## Phase 9 — Calendar

---

## Phase 10 — Mail and contacts

---

## Phase 11 — Unified communications

Official APIs only; no fakes.

---

## Phase 12 — Pet training

---

## Phase 13 — Games

---

## Phase 14 — Pet battles

Server calculation; animation separate; fairness model per owner decision.

---

## Phase 15 — Files, documents, workspaces

---

## Phase 16 — Wellness

Requires detailed owner Wellness specification + pricing. Uses same Alpha. No invented diagnosis.

---

## Phase 17 — Production hardening

Android/iOS hardening, performance, store requirements, monitoring, security/a11y review, release prep.  
**Not** “convert to mobile” — mobile exists from Phase 1.

---

## Sequencing notes

1. Art/rig PoC gates mass character production.  
2. Store billing architecture approved; full product wiring in commercial phases.  
3. Deferred formulas must not be invented early.  
4. Provider API eligibility gates integrations phases.  
5. Wellness blocked on separate specification.
