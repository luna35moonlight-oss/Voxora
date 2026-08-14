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

## Phase 1 — Core foundation — READY FOR OWNER MERGE REVIEW

Delivered (including closeout):

- monorepo foundation (`apps/mobile`, `apps/api`, real `packages/*`)
- Expo SDK 57 skeleton (Android API 29 / iOS 16.4)
- NestJS + PostgreSQL + Prisma + Redis/BullMQ foundation
- auth / RBAC / audit / feature flags / health / CI
- **one-time Owner bootstrap** (DB-persisted completion)
- MFA schema + **MFA-READY, NOT YET PRODUCTION-ENFORCED** documentation
- copyright vs third-party licence notices

**Explicitly out of Phase 1 (confirmed):** Bondfire, Alpha providers, avatars/pets/Scene/Interaction production, games, battles, Wellness, mail/calendar, fake social/billing success.

# PHASE 1 READY FOR OWNER MERGE REVIEW

---

## Phase 2 — Account and commercial foundation

**Not authorised until Phase 1 is merged and Phase 2 is explicitly authorised.**

Must include (when authorised):

- Resumable onboarding  
- Email verification (full product flows)  
- Phone OTP  
- Settings + privacy defaults  
- Products, prices (server)  
- Subscriptions + Apple/Google receipt validation  
- Entitlements engine  
- Trials structure (Wellness trial wiring later)  
- **Full privileged MFA enrollment/challenge enforcement** (OWNER/ADMIN/MODERATOR/SUPPORT) — no audit-only bypass

**Exit criteria:** User can register, verify, subscribe (sandbox), receive entitlements; prices not hard-coded in UI; privileged MFA enforced.

---

## Phase 3 — Scene and avatar — IMPLEMENTED FOR OWNER REVIEW

- Scene Engine (Rive primary; Skia/native may supplement)  
- Art-pipeline PoC gate before mass assets (ADR-004)  
- Avatar catalogue + instance + clothing + state machine  
- Server ownership, inventory, equipment, persistence, compatibility, reduced motion, and Moon Dash Legendary prize compatibility foundation

Do not start Phase 4 until owner review is complete.

---

## Phase 4 — Pet foundation

- Species + catalogue + owned pet  
- Clothing/equipment  
- Growth plumbing  
- Basic interactions  
- Leave extension points for future pet skills, skill progression, Skill-Up Shards, and game/reward consumption (`pet-system.md`)  

Do **not** build Rock Paper Scissors, Spinning Wheel, Coins, Diamonds, or shard economies in Phase 4 unless specifically authorised.

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

Full modular Games Platform. Must be capable of hosting at least:

1. White Wolf Moon Dash (already the Phase 2.5 early vertical slice — not redesigned here)  
2. Rock Paper Scissors (confirmed; 10 tries/user/UTC day; server-approved pet skill progression points)  
3. Spinning Wheel (confirmed reward mechanic; attempt rules and probabilities **OWNER DECISION REQUIRED**)  
4. Future Voxora games  

Central Reward Service / Reward Ledger; reusable UTC play-limit policy where appropriate; game contracts that are not score-only. See `game-system.md`.

Rock Paper Scissors and Spinning Wheel do **not** authorise skipping earlier phases.

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
6. Games & Rewards Addendum recorded: RPS + Spinning Wheel are confirmed future requirements; Phase 13 remains the Games Platform; do not implement them in Phase 3/4.  
7. White Wolf Moon Dash remains the approved early exception/vertical slice (`moon-dash.md`).
