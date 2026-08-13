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

## Phase 3 — Scene Engine and living avatar foundation

| ID | Requirement | UI | Service/API | Database | Tests | Status |
|----|-------------|----|-------------|----------|-------|--------|
| REQ-P3-001 | Avatar Catalogue | Avatar Foundation card catalogue list | `GET /v1/avatars/me` | `AvatarCatalogue`, `AvatarAsset` | Contracts + API typecheck | IMPLEMENTED FOR REVIEW |
| REQ-P3-002 | Avatar ownership | Locked/owned labels | Ownership validation in `AvatarsService` | `UserAvatarOwnership` | Contracts locked Legendary test | IMPLEMENTED FOR REVIEW |
| REQ-P3-003 | Avatar inventory | Wardrobe proof list | Inventory validation in `AvatarsService` | `AvatarItem`, `UserAvatarItemOwnership` | Contracts equipment test | IMPLEMENTED FOR REVIEW |
| REQ-P3-004 | Equip/unequip persistence | Equip/unequip controls | `POST /avatars/equip`, `POST /avatars/unequip` | `UserAvatarEquipment` | API typecheck, mobile typecheck | IMPLEMENTED FOR REVIEW |
| REQ-P3-005 | Compatibility rules | Locked/incompatible errors | Rig/ownership/conflict checks | Item rig + conflict metadata | API typecheck | IMPLEMENTED FOR REVIEW |
| REQ-P3-006 | Runtime state model | Idle/Listen/Think/Speak/Smile controls | Client runtime foundation | — | `avatarRuntime.test.ts` | IMPLEMENTED FOR REVIEW |
| REQ-P3-007 | Reduced motion | Toggle in avatar card | Client runtime fallback | — | Reduced-motion runtime test | IMPLEMENTED FOR REVIEW |
| REQ-P3-008 | Rive primary runtime metadata | Rive reference shown | Catalogue stores Rive refs | `riveAssetRef`, `AvatarAsset.storageRef` | Documentation | IMPLEMENTED WITH PLACEHOLDER RENDERER |
| REQ-P3-009 | Moon Dash Legendary prize compatibility | Locked Legendary avatar reference | Future ownership grant path uses same ownership model | `UserAvatarOwnership` | Contract locked Legendary test | IMPLEMENTED FOUNDATION |
| REQ-P3-010 | No pets / no Alpha / no additional games | Honest mobile copy | No pet/Alpha/game APIs added | — | Documentation review | IMPLEMENTED |
