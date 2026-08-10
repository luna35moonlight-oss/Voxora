# Voxora Phase 2 — Account & Commercial Foundation

**Document status:** IMPLEMENTED — OWNER REVIEW REQUIRED BEFORE PHASE 3  
**Product owner:** Maryke Farrell  
**Branch:** `cursor/phase-2-account-commercial-9cb3`  
**Last updated:** 2026-08-10  

---

## Objective

Build Voxora’s genuine account, onboarding, privacy, verification, security, subscription and entitlement foundation — server-authoritative and resumable. No demonstration-only success paths. No Phase 3 avatar/pet production systems.

---

## Delivered

### Onboarding state machine

Authoritative stages (server-owned `OnboardingState`):

1. Account creation  
2. Email verification  
3. Username  
4. Privacy  
5. Region / locale / time zone / display currency  
6. Contact number  
7. Phone verification  
8. Application/provider interests (`INTEREST_SELECTED` ≠ `CONNECTED`)  
9. Age gate (18+, `age-gate-v1`)  
10. Legal consents (versioned, separate records)  
11. Subscription selection (intent / store readiness)  
12. Handoff to future avatar/pet phase (`AVATAR_PET_HANDOFF`) — **no owned avatars/pets created**

Manual stage skipping is rejected (`403`).

### Verification providers

- `EmailDeliveryProvider` — `none` → `NOT_CONFIGURED`; `dev` → isolated capture (not a production send claim)
- `PhoneVerificationProvider` — same honesty model; OTP never logged; verified only after provider success

### Commercial / entitlements

- Server product catalogue Levels 1–4 with versioned ZAR commercial intention amounts  
- Prices are **not** used as entitlement branching logic  
- Apple/Google store adapters return `NOT_CONFIGURED` until credentials exist  
- Central `EntitlementsService` — feature flags ≠ entitlements  
- Level 3 Wellness **trial architecture only** (`ARCHITECTURE_ONLY`) — no Wellness product start  
- Level 4 Bondfire quota **not invented** (open question)

### Privileged MFA

Phase 1 “MFA-READY, NOT YET PRODUCTION-ENFORCED” is closed for privileged roles.

OWNER / ADMIN / MODERATOR / SUPPORT:

1. Primary auth  
2. Enrollment required if MFA disabled  
3. TOTP secret encrypted at rest  
4. Enable only after valid code  
5. Challenge required on subsequent privileged login  
6. No full privileged session before MFA success  

Audit events: enrollment, enable, challenge success/failure, reset.

### Settings

`GET /v1/settings` exposes username, privacy, region, phone verification state, consents, security/MFA flag, subscription state, entitlements — never secrets/tokens.

### Mobile

Real onboarding screens + settings surface using the Voxora design tokens (premium dark / pink / purple / blue).

---

## Explicitly out of Phase 2

Scene Engine, living avatars/pets, Interaction Runtime production, Alpha Bondfire conversations, Wellness product, games, battles, mail/calendar/contacts, external social messaging, fake store Paid/Active.

---

## Deferred owner decisions

Remain in `conductor/open-questions.md` with **OWNER DECISION REQUIRED BEFORE RELEVANT IMPLEMENTATION** (quota reset, Level 4 Bondfire quota, cancellation/grace/upgrade/downgrade/refund, Wellness trial start/reset, package/add-on prices, etc.).

---

# OWNER REVIEW REQUIRED BEFORE PHASE 3
