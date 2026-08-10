# Voxora Requirements Matrix — Phase 2

**Document status:** Phase 2 implemented — OWNER REVIEW REQUIRED BEFORE PHASE 3  
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
| REQ-032/033 | Scene Engine / Interaction Runtime production | NOT STARTED (correct) | — |

Deferred commercial formulas remain in `open-questions.md`.
