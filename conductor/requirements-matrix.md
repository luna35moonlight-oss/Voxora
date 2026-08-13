# Voxora Requirements Matrix — Phase 1 closeout

**Document status:** Phase 1 closeout complete — awaiting owner merge  
**Last updated:** 2026-08-10

---

## Architecture gates

| ID | Status |
|----|--------|
| REQ-000 … REQ-000i, REQ-200 | APPROVED |

---

## Phase 1 foundation

| ID | Description | Status | Evidence |
|----|-------------|--------|----------|
| REQ-P1 | Phase 1 core foundation | IMPLEMENTED / TESTED | PR #2 |
| REQ-001 | Brand identity | IMPLEMENTED | Mobile shell + README |
| REQ-002 | Bondfire spelling policy | APPROVED | docs + disabled flag key |
| REQ-023 | Feature flags foundation | IMPLEMENTED | FeatureFlagsModule |
| REQ-011 | Email verification architecture | IMPLEMENTED (delivery vendor deferred) | VerificationRecord |
| REQ-150 | RBAC + audited owner bootstrap | IMPLEMENTED / TESTED | one-time bootstrap e2e |
| REQ-150a | Owner bootstrap genuinely one-time | IMPLEMENTED / TESTED | `OwnerBootstrapCompletion` + e2e suite |
| REQ-151 | MFA readiness | IMPLEMENTED as **MFA-READY, NOT YET PRODUCTION-ENFORCED** | schema + audit; Phase 2 must enforce |
| REQ-152 | Secure mobile token storage | IMPLEMENTED | expo-secure-store |
| REQ-160 | Audit logging | IMPLEMENTED | AuditService |
| REQ-161 | Observability foundation | IMPLEMENTED | correlation + health |
| REQ-100 | Notification interface | IMPLEMENTED (interface only) | notificationArchitecture |
| REQ-LEG-NOTICE | Copyright vs third-party notices | IMPLEMENTED | NOTICE.md + THIRD_PARTY_NOTICES.md |
| REQ-LEG-OSS | Public OSS licence for Voxora-owned code | OWNER / LEGAL DECISION REQUIRED | open-questions OQ-LEG-003 |
| REQ-P2-MFA | Privileged MFA production enforcement | NOT STARTED — **required in Phase 2** | roadmap + security.md |
| REQ-090 | Alpha Bondfire | NOT STARTED (correct) | — |
| REQ-032/033 | Interaction Runtime / Scene Engine production | NOT STARTED (correct) | — |

Deferred commercial/product formulas remain in `open-questions.md`.

---

## Phase 2.5 — White Wolf Moon Dash early game vertical slice

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P25-001 | White Wolf Moon Dash runs inside Voxora only | Mobile home game card | — | — | Mobile game logic tests | IMPLEMENTED |
| REQ-P25-002 | Server reserves attempt before gameplay | Start daily try control | `POST /v1/games/white-wolf-moon-dash/attempts/start` | `GameAttempt`, `GameDailyCounter` | API typecheck + service tests | IMPLEMENTED |
| REQ-P25-003 | 10 tries per user per UTC day | Attempts remaining display | Atomic server daily counter | `GameDailyCounter` unique user/game/day | Regression required before public launch | IMPLEMENTED |
| REQ-P25-004 | Score submission single-use and user-bound | Automatic end/forfeit submission | `POST /attempts/:attemptId/complete` | `GameAttempt.status`, `validationStatus` | API service tests cover ranking; broader e2e pending | IMPLEMENTED |
| REQ-P25-005 | High score and leaderboard server-side | Best score/rank display | `GET /me` status | completed `GameAttempt` rows | Tie-rule service test | IMPLEMENTED |
| REQ-P25-006 | Tie rule: highest score, then earliest server completion | Prize positions display | Service ranking | `completedAt` server timestamp | Tie-rule service test | IMPLEMENTED |
| REQ-P25-007 | Prize position is not verified winner | Clear prize status copy | Typed reward states | `GamePrizeAward` lifecycle model | Contract tests | IMPLEMENTED |
| REQ-P25-008 | Legendary Avatar code manual only | Honest mobile copy | No code generation endpoint | Prize award model has issuance fields only | Regression required before public launch | IMPLEMENTED |
| REQ-P25-009 | Public promotional rules not invented | — | — | — | Documentation review | OWNER / LEGAL REVIEW REQUIRED |

---

## Phase 3 — Scene Engine and living avatar foundation

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P3-001 | Scene Engine foundation | Pending Phase 3 branch | Pending | Pending | Pending | AUTHORISED / NOT STARTED IN PHASE 2.5 |
| REQ-P3-002 | Avatar Catalogue | Pending Phase 3 branch | Pending | Pending | Pending | AUTHORISED / NOT STARTED IN PHASE 2.5 |
| REQ-P3-003 | Avatar Ownership / Inventory / Equipment | Pending Phase 3 branch | Pending | Pending | Pending | AUTHORISED / NOT STARTED IN PHASE 2.5 |
| REQ-P3-004 | Rive primary runtime proof | Pending Phase 3 branch | Pending | Pending | Pending | AUTHORISED / NOT STARTED IN PHASE 2.5 |
| REQ-P3-005 | Moon Dash Legendary prize compatibility with real avatar ownership | Pending Phase 3 branch | Pending | Pending | Pending | AUTHORISED / NOT STARTED IN PHASE 2.5 |
