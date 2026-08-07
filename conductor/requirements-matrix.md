# Voxora Requirements Matrix — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Status legend:** `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `TESTED` · `BLOCKED` · `OWNER REVIEW REQUIRED`  
**Rule:** A UI mock-up is not `IMPLEMENTED`.

---

## Matrix

| ID | Description | Product area | UI | Service | API | DB entities | Impl location | Tests | Status | Limitation | Owner decision |
|----|-------------|--------------|----|---------|-----|-------------|---------------|-------|--------|------------|----------------|
| REQ-000 | Independent Android + iOS app (not WebView product) | Platform | Mobile shell | — | — | — | `apps/mobile` (future) | E2E smoke | NOT STARTED | None | Approve mobile stack |
| REQ-001 | Official identity/tagline/copyright/support | Brand | Splash/settings | — | — | — | design tokens + copy | snapshot/copy | NOT STARTED | README currently outdated | Confirm brand assets |
| REQ-002 | Terminology Bondfire (not Bonfire) | Brand | All copy | Analytics labels | — | display values | i18n keys | lint/copy tests | NOT STARTED | — | — |
| REQ-010 | Resumable onboarding steps 1–12 | Account | Onboarding | Identity/Profile/Billing | `/v1/onboarding/*` | users, profiles, consents, verifications, subscriptions | future | API+E2E | NOT STARTED | — | IdP list for launch |
| REQ-011 | Email verification hashed/expiring/single-use/throttled | Account | Verify screens | Auth | verify endpoints | verification_records | future | unit/API | NOT STARTED | — | Email provider |
| REQ-012 | Unique username server-side | Account | Username step | Profile | username check | profiles | future | API | NOT STARTED | — | Reserved names list |
| REQ-013 | Privacy defaults private email/phone | Privacy | Privacy step | Profile | settings | privacy_settings | future | API | NOT STARTED | — | — |
| REQ-014 | Region/locale/timezone/currency | Profile | Region step | Profile | profile | profiles | future | API | NOT STARTED | — | Supported countries |
| REQ-015 | Phone OTP real verification for paid tiers | Account | Phone step | Auth/SMS | otp | verification_records | future | API | NOT STARTED | SMS cost/provider | OTP vendor |
| REQ-016 | App interest ≠ Connected | Integrations | Interests | Providers | connections | provider_connections | future | API | NOT STARTED | — | Launch providers |
| REQ-017 | Real OAuth + capability verification | Integrations | Connect flows | Provider adapters | oauth/callback | provider_connections, tokens | future | contract | NOT STARTED | Provider API limits | Priority providers |
| REQ-018 | Age gate 18+ initial launch | Legal | Age step | Identity | signup | users/consents | future | API | NOT STARTED | Minors deferred | Confirm legal copy |
| REQ-019 | Versioned consents | Legal | Legal step | Consent | consents | consents | future | API | NOT STARTED | — | Terms/Privacy versions |
| REQ-020 | Server-configurable subscription prices | Commercial | Paywall | Products | products/prices | products, product_prices | future | API | NOT STARTED | Store billing rules | Store vs web billing |
| REQ-021 | Level 1–4 packages per spec | Commercial | Paywall/catalogue | Entitlements | entitlements | subscriptions, grants | future | domain | NOT STARTED | Edge commercial rules open | Downgrade/ownership rules |
| REQ-022 | Central Entitlement Service | Commercial | Lock states | Entitlement | entitlements | entitlement_grants | future | unit/API | NOT STARTED | — | Capability final list |
| REQ-023 | Feature flags separate from entitlements | Platform | — | Flags | flags | feature_flags | future | unit | NOT STARTED | — | — |
| REQ-030 | Voxora Home digital home (not dashboard) | Home | Home | Home aggregate | home summary | multiple | future | E2E | NOT STARTED | Art not available | Art direction |
| REQ-031 | Coming-alive sequence once per entry | Home | Home scene | Interaction Runtime | — | — | future client | unit | NOT STARTED | — | Approved welcome animations |
| REQ-032 | Interaction Runtime mandatory | Runtime | — | Client runtime | events optional | — | future package | unit | NOT STARTED | — | Approve event list |
| REQ-033 | Scene Engine layered rendering | Scene | Scene surfaces | Client + assets | asset APIs | assets, equipment | future | unit | NOT STARTED | Needs art pipeline | Rive approval |
| REQ-040 | Living avatar system + clothing slots | Avatar | Wardrobe/Home | Avatar | avatar/* | avatar_* | future | unit/API | NOT STARTED | — | Launch catalogue |
| REQ-041 | Lip sync / listen / talk states | Avatar/Voice | Scene | Voice+Runtime | — | animation_definitions | future | unit | NOT STARTED | Viseme provider-dependent | TTS vendor |
| REQ-050 | Species-based living pets | Pet | Pet surfaces | Pet | pets/* | pet_* | future | unit/API | NOT STARTED | — | Launch species |
| REQ-051 | Growth stages server-authoritative | Pet | Pet profile | Progression | pets/progress | pets | future | domain | NOT STARTED | Formulas undefined | XP/evolution rules |
| REQ-052 | Pet interactions validate+persist | Pet | Pet actions | Pet | pets/actions | pets, inventory | future | API | NOT STARTED | Energy rules open | Energy rules |
| REQ-053 | Species-specific playful reactions | Pet | Scene | Runtime | — | reaction defs | future | unit | NOT STARTED | — | Approve reaction set |
| REQ-054 | Training separate from battle | Pet | Training | Training | training/* | pet_training_* | future | API | NOT STARTED | — | Categories/rewards |
| REQ-060 | Modular games inside Voxora | Games | Game shell | Game Runtime | games/* | game_* | future | API | NOT STARTED | — | Launch games list |
| REQ-061 | Server-validated scores/rewards | Games | Results | Reward | rewards | reward_ledger | future | domain | NOT STARTED | — | Reward values |
| REQ-070 | Server-authoritative pet battles | Battles | Battle UI | Battle engine | battles/* | battles, battle_events | future | domain | NOT STARTED | Balance open | Balancing choice |
| REQ-071 | Animation separated from calculation | Battles | Battle VFX | Client presenters | — | battle_events | future | unit | NOT STARTED | — | — |
| REQ-072 | Subscription does not auto-win | Battles | — | Matchmaking/engine | — | — | future | domain | NOT STARTED | — | Fairness model |
| REQ-080 | One Alpha service + tool permissions | Alpha | Bondfire + background | Alpha | alpha/* | tool_invocations | future | unit/API | NOT STARTED | Model vendor TBD | Model providers |
| REQ-081 | Provider-independent model router | Alpha | — | AlphaModelRouter | — | — | future | unit | NOT STARTED | — | Routing policy |
| REQ-082 | No success claim before confirmation | Alpha | Bondfire | Tool executor | tools | tool_invocations | future | unit | NOT STARTED | — | — |
| REQ-083 | User-controlled memory subsystem | Alpha | Memory settings | Memory | memory/* | memory_items | future | API | NOT STARTED | Retention defaults open | Retention policy |
| REQ-090 | Alpha Bondfire complete environment | Bondfire | Bondfire UI | Bondfire+Alpha | bondfire/* | threads, messages, quota | future | E2E | NOT STARTED | Quota rules open | Quota reset/counting |
| REQ-091 | Streaming responses | Bondfire | Stream UI | Alpha | ws/sse | — | future | integration | NOT STARTED | — | — |
| REQ-092 | Bondfire quotas server-enforced | Bondfire | Quota UX | Entitlement/Quota | — | bondfire_quota_usage | future | API | OWNER REVIEW REQUIRED | Counting rules unknown | Reset period & counting |
| REQ-100 | Central notifications | Notifications | In-app/push | Notification | notifications/* | notification_requests | future | API | NOT STARTED | — | Channels at launch |
| REQ-101 | Real reminder scheduling | Reminders | Reminder UI | Reminder engine | reminders/* | reminders | future | API | NOT STARTED | OS background limits | — |
| REQ-110 | Calendar integration real | Integrations | Calendar | Calendar adapter | calendar/* | calendar_refs | future | contract | NOT STARTED | Provider limits | Launch calendars |
| REQ-111 | Mail integration real | Integrations | Mail | Mail adapter | mail/* | mail_refs | future | contract | NOT STARTED | Provider limits | Launch mail |
| REQ-112 | Contacts separate consent | Integrations | Contacts | Contacts adapter | contacts/* | — | future | API | NOT STARTED | Privacy risk | Launch necessity |
| REQ-113 | No fake social integrations | Comms | Honest unavailable states | — | — | — | policy | review | NOT STARTED | Many networks lack APIs | Which providers ever |
| REQ-120 | Offline honest pending states | Platform | Status labels | Sync | — | outbox | future | unit | NOT STARTED | — | Offline write allowlist |
| REQ-121 | Provider failure isolation | Platform | Capability errors | Adapters | — | — | future | chaos/unit | NOT STARTED | — | — |
| REQ-130 | Asset catalogue formal metadata | Assets | — | Asset service | assets/* | assets | future | API | NOT STARTED | — | CDN/storage vendor |
| REQ-140 | Performance profiles + reduced motion | A11y/Perf | Settings | Runtime | — | profile prefs | future | unit | NOT STARTED | — | Defaults |
| REQ-141 | Accessibility from first components | A11y | All | — | — | — | design system | a11y tests | NOT STARTED | — | Target standard |
| REQ-150 | RBAC + audited admin/owner | Security | Admin later | AuthZ | admin/* | roles, audit | future | API | NOT STARTED | — | Bootstrap procedure |
| REQ-151 | MFA readiness | Security | Later | Auth | — | mfa_factors (future) | future | — | NOT STARTED | Launch MFA TBD | MFA at launch? |
| REQ-152 | Secure mobile token storage | Security | — | Mobile secure store | — | — | future | manual/sec | NOT STARTED | — | — |
| REQ-160 | Audit logging critical events | Security | Admin | Audit | — | audit_events | future | API | NOT STARTED | — | Retention |
| REQ-161 | Observability without private content | Ops | — | Logging/APM | — | — | future | — | NOT STARTED | — | Vendors |
| REQ-170 | Localisation-ready architecture | i18n | UI strings | — | — | locale fields | future | i18n | NOT STARTED | — | Launch languages |
| REQ-180 | Wellness module boundary (no diagnosis) | Wellness | Later | Alpha Wellness mode | — | TBD | future | — | BLOCKED | Detailed spec missing | Wellness spec + price |
| REQ-190 | Support ticket readiness (not fake build now) | Support | Later | Support | — | support_tickets | future | — | NOT STARTED | Phase 0: design only | — |
| REQ-200 | Vertical slice development after Phase 0 | Process | — | — | — | — | roadmap | — | OWNER REVIEW REQUIRED | Phase 1 not started | Approve Phase 0 → Phase 1 |

---

## Summary counts (Phase 0)

| Status | Count (approx.) |
|--------|-----------------|
| NOT STARTED | Majority — greenfield |
| OWNER REVIEW REQUIRED | Quota rules, commercial edges, stack approvals, Wellness |
| BLOCKED | Wellness detailed behaviour (awaiting owner spec) |
| IMPLEMENTED / TESTED | **0** |

---

## Maintenance

Update this matrix as implementation proceeds. Status changes require evidence (code location + tests), not screenshots alone.
