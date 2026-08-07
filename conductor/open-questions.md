# Voxora Open Questions — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Product owner:** Maryke Farrell  
**Rule:** Cursor must not invent answers to these product/commercial rules.

Each item is marked **OWNER REVIEW REQUIRED**.

---

## A. Commercial & subscriptions

| ID | Question | Why it blocks / matters |
|----|----------|-------------------------|
| OQ-COM-001 | Wellness final price? | Level 3 trial then paid Wellness entitlement |
| OQ-COM-002 | Add-on pricing catalogue? | Entitlement grants beyond base levels |
| OQ-COM-003 | Package pricing (avatar/pet packages)? | Catalogue ownership |
| OQ-COM-004 | Avatar package ownership rules? | What “owns” means across tiers |
| OQ-COM-005 | Pet package ownership rules? | Same for pets |
| OQ-COM-006 | Cancellation rules? | Access end behaviour |
| OQ-COM-007 | Failed payment rules? | Dunning, retries |
| OQ-COM-008 | Grace periods? | Entitlement during grace |
| OQ-COM-009 | Upgrade rules (proration, immediate entitlements)? | Billing + access |
| OQ-COM-010 | Downgrade rules? | Immediate vs period-end |
| OQ-COM-011 | Reactivation rules? | Returning subscribers |
| OQ-COM-012 | Trial reset rules? | Wellness and any other trials |
| OQ-COM-013 | Purchased cosmetics after downgrade? | Keep unequippable vs lose vs keep |
| OQ-COM-014 | Pet ownership after downgrade? | Keep pet vs lock vs transfer |
| OQ-COM-015 | Progression after downgrade? | Retain XP/level visibility vs freeze |
| OQ-COM-016 | Promotional access rules? | Grants, expiry, stacking |
| OQ-COM-017 | Refunds policy? | Ledger + store interactions |
| OQ-COM-018 | Bondfire quota reset period? | Daily/monthly/billing-period? |
| OQ-COM-019 | Apple IAP / Google Play Billing as mandatory path for digital entitlements? | Store compliance vs web ZAR pricing |
| OQ-COM-020 | How are R15/R25/R99/R125 mapped across storefront currencies? | Product IDs + display |

---

## B. Bondfire quota counting

| ID | Question |
|----|----------|
| OQ-BF-001 | Do failed Alpha requests count against quota? |
| OQ-BF-002 | Do retries count? |
| OQ-BF-003 | How do voice requests count (per utterance, per turn)? |
| OQ-BF-004 | Do tool invocations count separately from user messages? |
| OQ-BF-005 | How does streaming count (one message vs chunks)? |
| OQ-BF-006 | Level 4 Bondfire quota / unlimited? (Do not invent) |

---

## C. Pets, training, battles, games

| ID | Question |
|----|----------|
| OQ-PET-001 | Exact XP levels / thresholds? |
| OQ-PET-002 | Exact evolution rules? |
| OQ-PET-003 | Exact pet energy rules? |
| OQ-PET-004 | Exact battle balancing formulas? |
| OQ-PET-005 | Exact matchmaking rules? |
| OQ-PET-006 | Which fairness option (see pet-battle-system.md §4) is approved? |
| OQ-PET-007 | Exact game scores and rewards? |
| OQ-PET-008 | Exact achievement list and reward values? |
| OQ-PET-009 | Leaderboard rules? |
| OQ-PET-010 | Marketplace rules (if any)? |
| OQ-PET-011 | Launch species list and art priority? |
| OQ-PET-012 | Is PvP required for first public launch or later? |

---

## D. Avatar & art pipeline

| ID | Question |
|----|----------|
| OQ-AV-001 | Approve Rive as character pipeline? |
| OQ-AV-002 | Launch avatar bases and clothing package set? |
| OQ-AV-003 | Who produces rigs/animations (internal/external)? |
| OQ-AV-004 | Lip sync: required visemes at launch, or amplitude fallback acceptable initially? |

---

## E. Mobile & platform

| ID | Question |
|----|----------|
| OQ-MOB-001 | Approve Expo React Native shared codebase? |
| OQ-MOB-002 | Minimum Android version (API 26 vs 29+)? |
| OQ-MOB-003 | Minimum iOS version (proposed 16+)? |
| OQ-MOB-004 | Are tablets launch-blocking or best-effort? |
| OQ-MOB-005 | Continuous listening / wake-word in scope for v1? (Default recommendation: no) |

---

## F. Backend & infrastructure

| ID | Question |
|----|----------|
| OQ-BE-001 | Approve NestJS/TS modular monolith + Postgres + Redis? Or prefer .NET? |
| OQ-BE-002 | Preferred cloud host / region / data residency? |
| OQ-BE-003 | Object storage vendor? |
| OQ-BE-004 | Email delivery vendor? |
| OQ-BE-005 | SMS OTP vendor? |

---

## G. Alpha & providers

| ID | Question |
|----|----------|
| OQ-AL-001 | Initial AI model provider(s)? |
| OQ-AL-002 | STT/TTS vendor vs OS speech APIs? |
| OQ-AL-003 | Launch order for Google vs Microsoft mail/calendar? |
| OQ-AL-004 | Are contacts launch-critical? |
| OQ-AL-005 | Which messaging networks should be investigated first, knowing fakes are forbidden? |
| OQ-AL-006 | Memory / transcript retention defaults? |

---

## H. Security, legal, Wellness

| ID | Question |
|----|----------|
| OQ-SEC-001 | MFA required at launch? |
| OQ-SEC-002 | Account deletion & retention policy details? |
| OQ-SEC-003 | Owner bootstrap / break-glass procedure approval? |
| OQ-LEG-001 | Final Terms / Privacy versions for recording? |
| OQ-LEG-002 | Communications preference defaults? |
| OQ-WEL-001 | Deliver detailed Wellness specification (content, crisis, device integrations, privacy)? |
| OQ-WEL-002 | Wellness pricing (also OQ-COM-001) |

---

## I. Technical limitations already anticipated (closest valid implementation TBD)

These are not product inventions; they are likely constraints to confirm:

| ID | Topic | Limitation type | Note |
|----|-------|-----------------|------|
| OQ-LIM-001 | Unified inbox for WhatsApp/Instagram/etc. | Provider / legal | Official APIs may not allow intended behaviour; must verify per provider before promising UI |
| OQ-LIM-002 | Web payment for digital unlocks | Platform / store policy | May be restricted; IAP/Play Billing likely required |
| OQ-LIM-003 | Background processing on iOS/Android | Platform | OS limits; server-side jobs + push, not unbounded device daemons |
| OQ-LIM-004 | Perfect viseme lip sync | Provider | Depends on TTS timing APIs; amplitude fallback may be Phase 5 launch path |
| OQ-LIM-005 | Always-on mic wake word | Privacy / platform | Requires explicit future approval; not default |

When a limitation forces a difference from the master specification, Cursor will retain the original requirement, propose the closest valid implementation, and wait for approval before permanently changing the requirement.

---

## J. Phase 0 process gate

| ID | Question |
|----|----------|
| OQ-PROC-001 | Does Maryke Farrell approve Phase 0 architecture & roadmap so Phase 1 may begin? |
| OQ-PROC-002 | Which PROPOSED ADRs in `decisions.md` are approved, amended, or rejected? |

**Until OQ-PROC-001 is answered affirmatively, Phase 1 must not start.**
