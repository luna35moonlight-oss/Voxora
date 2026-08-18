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

## Phase 1 — Core foundation — MERGED

Delivered and merged to `main` (PR #2):

- monorepo foundation (`apps/mobile`, `apps/api`, real `packages/*`)
- Expo SDK 57 skeleton (Android API 29 / iOS 16.4)
- NestJS + PostgreSQL + Prisma + Redis/BullMQ foundation
- auth / RBAC / audit / feature flags / health / CI
- **one-time Owner bootstrap** (DB-persisted completion)
- MFA schema readiness (enforcement completed in Phase 2)
- copyright vs third-party licence notices

---

## Phase 2 — Account and commercial foundation — INTEGRATED

Authorised by Maryke Farrell after Phase 1 merge. Source: `cursor/phase-2-account-commercial-9cb3` (PR #3). Integrated into Phase 3 final-integration working branch. **Complete per 2026-08-13 owner instruction for product status.**

Delivered:

- Resumable server-authoritative onboarding state machine  
- Email verification via `EmailDeliveryProvider`  
- Phone OTP via `PhoneVerificationProvider`  
- Username / privacy defaults / region-locale  
- Versioned consents + 18+ age gate  
- Product catalogue + subscription intent entities  
- Apple/Google store adapters (`NOT_CONFIGURED` until credentials)  
- Central Entitlement Service (flags kept separate)  
- Wellness trial **architecture only**  
- **Privileged MFA TOTP enrollment/challenge enforcement**  
- Settings + mobile onboarding surfaces  
- Avatar/pet **handoff only** (no fake owned avatars/pets)

**Explicitly out of Phase 2:** Scene Engine, living avatars/pets, Bondfire conversations, Wellness product, games/battles, mail/calendar/contacts, fake Paid/Active billing.

# PHASE 2 READY FOR OWNER MERGE REVIEW — DO NOT BEGIN PHASE 3 WITHOUT APPROVAL

---

## Phase 2.5 — White Wolf Moon Dash early game vertical slice — APPROVED / FROZEN

White Wolf Moon Dash is a controlled early gameplay vertical slice:

mobile gameplay -> API -> server-owned attempt reservation -> result submission -> persistence -> leaderboard position -> manual promotional prize handling.

Rules:

- 10 tries per user per UTC day.
- Server reserves attempts before gameplay.
- Server owns daily attempt count, high score, leaderboard position, and prize status.
- Tie rule: highest verified score first; tied score ranks by earliest server completion timestamp.
- First and Second positions are provisional prize positions, not automatically verified winners.
- Legendary Avatar redeem codes are manually issued by the Voxora team after Owner review.
- Full Games Platform remains **Phase 13**.

See `moon-dash.md`.

---

## Voxora Pet Card Race — owner-requested card race slice — IMPLEMENTED FOR OWNER REVIEW

A live race in which pets are the racers, requested by the Product Owner on 2026-08-17 and corrected
on 2026-08-18. All four pets run continuously under server simulation and the player's cards influence
the race. One attempt is a three-race meet with a different pet per race; the server owns the
simulation, the shuffle, the checkpoint deals, the five-second play cooldown, and the score.

This slice awards nothing (no prizes, currencies, redeem codes, or pet progression), creates no pet
or avatar records, and does **not** change the phase order below. Rock Paper Scissors and the
Spinning Wheel remain unbuilt, and the full Games Platform remains **Phase 13**.

See `pet-card-race.md`.

---

## Phase 3 — Scene Engine and living avatar foundation — INTEGRATED FOR OWNER REVIEW

- Scene Engine (Rive primary; Skia/native may supplement)  
- Art-pipeline PoC gate before mass assets (ADR-004)  
- Avatar catalogue + instance + clothing + state machine  
- Avatar ownership, inventory, equipment, persistence, compatibility rules, reduced motion, and Legendary Moon Dash prize compatibility foundation
- Real Rive runtime validation outstanding on final-integration branch

Do not start pets, Alpha, Phase 4, or the full Games Platform until owner review authorises the next phase.

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
