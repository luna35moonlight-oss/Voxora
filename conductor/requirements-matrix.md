# Voxora Requirements Matrix

**Document status:** Phase 2 + Phase 2.5 integrated — Phase 3 integration in progress  
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
| REQ-032/033 | Scene Engine / Interaction Runtime production | PENDING Phase 3 integration | — |

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

## Phase 3 — Scene Engine and living avatar foundation

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P3-001 | Scene Engine foundation | Pending Phase 3 merge | Pending | Pending | Pending | AUTHORISED / INTEGRATION IN PROGRESS |
| REQ-P3-002 | Avatar Catalogue | Pending Phase 3 merge | Pending | Pending | Pending | AUTHORISED / INTEGRATION IN PROGRESS |
| REQ-P3-003 | Avatar Ownership / Inventory / Equipment | Pending Phase 3 merge | Pending | Pending | Pending | AUTHORISED / INTEGRATION IN PROGRESS |
| REQ-P3-004 | Rive primary runtime proof | Pending Phase 3 merge | Pending | Pending | Pending | AUTHORISED / INTEGRATION IN PROGRESS |
| REQ-P3-005 | Moon Dash Legendary prize compatibility with real avatar ownership | Pending Phase 3 merge | Pending | Pending | Pending | AUTHORISED / INTEGRATION IN PROGRESS |
