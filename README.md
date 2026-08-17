# VOXORA

**Your Voice. Your Avatar. Your Companion. Your World. All in One.**

Voxora is the user’s digital home. Alpha is the home’s intelligence. Alpha Bondfire is where the user and Alpha intentionally meet.

Primary platforms: **Android** and **Apple iOS** (independent installed application).  
Website: [voxora.co.za](https://voxora.co.za) · Support: support@voxora.co.za  
Copyright: © Maryke Farrell. All rights reserved.

See [`NOTICE.md`](./NOTICE.md) for the distinction between **Voxora-owned** materials and **third-party/open-source** dependencies.  
Expo template attribution (not a Voxora MIT grant) lives at [`apps/mobile/THIRD_PARTY_NOTICES.md`](./apps/mobile/THIRD_PARTY_NOTICES.md).  
**OWNER / LEGAL DECISION REQUIRED** before publishing any open-source licence for Voxora-owned code.

---

## Architecture baseline status

**Phase 0** architecture was reviewed and **approved with amendments** by Maryke Farrell (2026-08-10) and merged to `main`.

**Phase 1** (Core Foundation) was merged to `main` (PR #2).

**Phase 2**, **Phase 2.5 (Moon Dash)**, **Phase 3 Avatar Foundation**, and the **Games & Rewards documentation addendum** are integrated on the Phase 3 final-integration working branch for Owner review. See [`conductor/`](./conductor/).

**Voxora Pet Card Race** (ADR-028) is implemented for Owner review as a second early game slice: a card game with pets as the racers, server-authoritative and reward-free. See [`conductor/pet-card-race.md`](./conductor/pet-card-race.md).

**Do not begin Phase 4 until the Product Owner explicitly authorises it.**

Phase documents live in [`conductor/`](./conductor/):

| Document | Purpose |
|----------|---------|
| [repository-audit.md](./conductor/repository-audit.md) | Current repo reality + check results |
| [architecture.md](./conductor/architecture.md) | System architecture |
| [mobile-strategy.md](./conductor/mobile-strategy.md) | Android/iOS strategy |
| [domain-model.md](./conductor/domain-model.md) | Domain concepts |
| [data-model.md](./conductor/data-model.md) | Proposed data model |
| [event-catalog.md](./conductor/event-catalog.md) | Interaction events |
| [interaction-runtime.md](./conductor/interaction-runtime.md) | Central interaction runtime |
| [scene-engine.md](./conductor/scene-engine.md) | Scene / layered rendering |
| [avatar-system.md](./conductor/avatar-system.md) | Living avatars |
| [pet-system.md](./conductor/pet-system.md) | Living species-based pets |
| [pet-battle-system.md](./conductor/pet-battle-system.md) | Server-authoritative battles |
| [game-system.md](./conductor/game-system.md) | Modular games & rewards architecture |
| [moon-dash.md](./conductor/moon-dash.md) | White Wolf Moon Dash Phase 2.5 vertical slice |
| [pet-card-race.md](./conductor/pet-card-race.md) | Voxora Pet Card Race — card-driven pet race slice |
| [alpha-architecture.md](./conductor/alpha-architecture.md) | One Alpha intelligence |
| [bondfire.md](./conductor/bondfire.md) | Alpha Bondfire |
| [integrations.md](./conductor/integrations.md) | Provider adapters |
| [notifications.md](./conductor/notifications.md) | Notifications & reminders |
| [entitlements.md](./conductor/entitlements.md) | Subscriptions & entitlements |
| [security.md](./conductor/security.md) | Auth, privacy, RBAC |
| [testing-strategy.md](./conductor/testing-strategy.md) | Test approach |
| [requirements-matrix.md](./conductor/requirements-matrix.md) | Requirements tracking |
| [roadmap.md](./conductor/roadmap.md) | Phases 0–17 |
| [decisions.md](./conductor/decisions.md) | Architecture decisions |
| [open-questions.md](./conductor/open-questions.md) | Owner decisions required |
| [phase-3-notes.md](./conductor/phase-3-notes.md) | Phase 3 integration + Rive validation notes |
| [rive-production-asset-contract.md](./conductor/rive-production-asset-contract.md) | Production `.riv` asset contract |

Official spelling: **Bondfire** (not Bonfire). Feature name: **Alpha Bondfire**.
