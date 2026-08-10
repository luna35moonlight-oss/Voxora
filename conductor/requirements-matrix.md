# Voxora Requirements Matrix — Phase 0 / Baseline

**Document status:** OWNER APPROVED BASELINE (2026-08-10)  
**Status legend:** `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `TESTED` · `BLOCKED` · `OWNER REVIEW REQUIRED` · `DEFERRED` · `APPROVED`  
**Rule:** A UI mock-up is not `IMPLEMENTED`.

---

## Architecture / process gates

| ID | Description | Status | Owner decision |
|----|-------------|--------|----------------|
| REQ-000 | Independent Android + iOS app (not WebView) | APPROVED (architecture) / NOT STARTED (impl) | Expo RN + TS APPROVED |
| REQ-000a | Android min API 29; iOS min 16.4; phones launch-critical; tablets adaptive | APPROVED | 2026-08-10 |
| REQ-000b | Stable Expo SDK only (scaffold: SDK 57) | APPROVED | 2026-08-10 |
| REQ-000c | Rive primary characters + safeguards; PoC before mass assets | APPROVED | 2026-08-10 |
| REQ-000d | NestJS + Postgres + Redis + BullMQ modular monolith | APPROVED | 2026-08-10 |
| REQ-000e | One Alpha; Bondfire spelling; Bondfire not Phase 1 build | APPROVED | 2026-08-10 |
| REQ-000f | StoreKit + Play Billing; server entitlement authority; no hard-coded ZAR access | APPROVED | 2026-08-10 |
| REQ-000g | MFA-ready Phase 1; MFA mandatory privileged roles; user MFA final rule deferred | APPROVED / DEFERRED (user mandate) | 2026-08-10 |
| REQ-000h | No continuous listening V1 | APPROVED | 2026-08-10 |
| REQ-000i | Viseme preferred + amplitude fallback; architecture allows visemes | APPROVED | 2026-08-10 |
| REQ-200 | Vertical slices; Phase 0 docs then Phase 1 separate PR | APPROVED | Phase 1 authorised after docs on main |

---

## Matrix (implementation tracking)

| ID | Description | Product area | Status | Limitation | Owner decision |
|----|-------------|--------------|--------|------------|----------------|
| REQ-001 | Official identity/tagline/copyright/support | Brand | IN PROGRESS (README) | — | — |
| REQ-002 | Terminology Bondfire (not Bonfire) | Brand | APPROVED policy | — | — |
| REQ-010 | Resumable onboarding steps 1–12 | Account | NOT STARTED | Phase 2 | — |
| REQ-011 | Email verification architecture | Account | Phase 1 foundation / Phase 2 full UX | — | Email vendor deferred |
| REQ-012 | Unique username server-side | Account | NOT STARTED | Phase 2 | — |
| REQ-013 | Privacy defaults private | Privacy | NOT STARTED | Phase 2 | — |
| REQ-014 | Region/locale/timezone/currency | Profile | NOT STARTED | Phase 2 | — |
| REQ-015 | Phone OTP | Account | NOT STARTED | Phase 2 | OTP vendor deferred |
| REQ-016 | App interest ≠ Connected | Integrations | NOT STARTED | later | — |
| REQ-017 | Real OAuth + capability verification | Integrations | NOT STARTED | later | Providers deferred |
| REQ-018 | Age gate 18+ | Legal | NOT STARTED | Phase 2 | — |
| REQ-019 | Versioned consents | Legal | NOT STARTED | Phase 2 | — |
| REQ-020 | Server-configurable subscription prices | Commercial | NOT STARTED | Phase 2 | Store mapping |
| REQ-021 | Level 1–4 packages per spec | Commercial | DEFERRED edge rules | Phase 2+ | Downgrade etc. deferred |
| REQ-022 | Central Entitlement Service | Commercial | NOT STARTED | Phase 2 | — |
| REQ-023 | Feature flags separate from entitlements | Platform | Phase 1 foundation | — | — |
| REQ-030 | Voxora Home | Home | NOT STARTED | later | — |
| REQ-031 | Coming-alive sequence | Home | NOT STARTED | Phase 5 | — |
| REQ-032 | Interaction Runtime | Runtime | NOT STARTED (Phase 1: no full impl) | Phase 5 | Confirmed mandatory |
| REQ-033 | Scene Engine | Scene | NOT STARTED (Phase 1: no full impl) | Phase 3 | Rive+safeguards |
| REQ-040 | Living avatar system | Avatar | NOT STARTED | Phase 3 | Catalogue deferred |
| REQ-041 | Lip sync / listen / talk | Avatar/Voice | NOT STARTED | Phase 5 | Viseme arch required |
| REQ-050 | Species-based living pets | Pet | NOT STARTED | Phase 4 | Catalogue deferred |
| REQ-051 | Growth stages | Pet | DEFERRED formulas | Phase 4+ | XP/evolution deferred |
| REQ-052 | Pet interactions | Pet | NOT STARTED | Phase 4 | Energy deferred |
| REQ-053 | Species-specific reactions | Pet | NOT STARTED | Phase 5 | — |
| REQ-054 | Training | Pet | NOT STARTED | Phase 12 | — |
| REQ-060 | Modular games | Games | NOT STARTED | Phase 13 | Scoring deferred |
| REQ-061 | Server-validated rewards | Games | NOT STARTED | Phase 13 | Rewards deferred |
| REQ-070 | Server-authoritative battles | Battles | NOT STARTED | Phase 14 | Balance deferred |
| REQ-071 | Animation ≠ calculation | Battles | APPROVED principle | Phase 14 | — |
| REQ-072 | Subscription does not auto-win | Battles | APPROVED principle | Phase 14 | Fairness model deferred |
| REQ-080 | One Alpha service | Alpha | APPROVED / NOT STARTED impl | Phase 6 | Vendor deferred |
| REQ-081 | Provider-independent model router | Alpha | NOT STARTED | Phase 6 | — |
| REQ-082 | No success before confirmation | Alpha | APPROVED policy | — | — |
| REQ-083 | Memory subsystem | Alpha | NOT STARTED | Phase 6 | Retention deferred |
| REQ-090 | Alpha Bondfire environment | Bondfire | NOT STARTED | Phase 7 | Not Phase 1 |
| REQ-091 | Streaming responses | Bondfire | NOT STARTED | Phase 7 | — |
| REQ-092 | Bondfire quotas | Bondfire | DEFERRED rules | Phase 7 | Counting/reset deferred |
| REQ-100 | Central notifications | Notifications | Phase 1 interface only | Phase 8 | — |
| REQ-101 | Real reminders | Reminders | NOT STARTED | Phase 8 | — |
| REQ-110 | Calendar | Integrations | NOT STARTED | Phase 9 | Order deferred |
| REQ-111 | Mail | Integrations | NOT STARTED | Phase 10 | Order deferred |
| REQ-112 | Contacts | Integrations | NOT STARTED | Phase 10 | Necessity deferred |
| REQ-113 | No fake social integrations | Comms | APPROVED policy | Phase 11 | Providers deferred |
| REQ-120 | Offline honest pending | Platform | Phase 1 awareness foundation | — | — |
| REQ-121 | Provider failure isolation | Platform | NOT STARTED | later | — |
| REQ-130 | Asset catalogue | Assets | NOT STARTED | Phase 3+ | — |
| REQ-140 | Performance profiles | A11y/Perf | NOT STARTED | later | — |
| REQ-141 | Accessibility baseline | A11y | Phase 1 foundation | — | — |
| REQ-150 | RBAC + audited owner | Security | Phase 1 foundation | — | Server bootstrap |
| REQ-151 | MFA readiness | Security | Phase 1 foundation | User mandate deferred | Privileged MFA required |
| REQ-152 | Secure mobile token storage | Security | Phase 1 | — | — |
| REQ-160 | Audit logging | Security | Phase 1 foundation | — | — |
| REQ-161 | Observability | Ops | Phase 1 foundation | — | Vendors deferred |
| REQ-170 | Localisation-ready | i18n | Phase 1 awareness | — | Languages deferred |
| REQ-180 | Wellness boundary | Wellness | DEFERRED content | Phase 16 | Spec+price deferred |
| REQ-190 | Support ticket readiness | Support | NOT STARTED | later | Design only early |
| REQ-P1 | Phase 1 core foundation delivery | Process | AUTHORISED after docs merge | Stop before Phase 2 | — |

---

## Summary

| Bucket | Notes |
|--------|-------|
| Architecture ADRs | Approved with amendments 2026-08-10 |
| Deferred product formulas | Remain visible in `open-questions.md` — do not invent |
| Phase 1 implementation | Separate branch after Phase 0 on `main` |
| IMPLEMENTED / TESTED application features | Still 0 until Phase 1 lands |
