# Voxora Implementation Roadmap — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Constraint:** Phase 1 must not begin until Phase 0 is reviewed and approved by Maryke Farrell.  
**Method:** Vertical slices after approval — not 50 disconnected UI pages.

---

## Phase 0 — Architecture & audit (THIS PHASE)

Deliverables: `conductor/*` documents, repository audit, check results, open questions, proposed architecture.

**Stop for owner review.**

---

## Phase 1 — Core foundation

- Mobile application skeleton (Expo RN Android/iOS) — independent app, not WebView wrapper  
- Backend modular monolith  
- Database + migrations foundation  
- API versioning  
- Authentication sessions  
- Roles / permissions (server-side owner bootstrap)  
- Security baselines  
- Design system tokens/components  
- Logging + audit skeleton  
- CI checks (lint/type/test/build)

**Exit criteria:** App launches to authenticated shell against API in staging; no fake feature success states.

---

## Phase 2 — Account and commercial foundation

- Resumable onboarding  
- Email verification  
- Phone OTP  
- Settings + privacy defaults  
- Products, prices (server)  
- Subscriptions + store receipt validation path  
- Entitlements engine  
- Trials structure (Wellness trial wiring later)

**Exit criteria:** User can register, verify, subscribe (sandbox), receive entitlements; prices not hard-coded in UI.

---

## Phase 3 — Scene and avatar

- Scene Engine  
- Avatar catalogue + instance  
- Clothing layers  
- Avatar state machine  
- Animation playback  
- Performance profiles

**Exit criteria:** Equipped avatar renders consistently on Home + at least one secondary surface.

---

## Phase 4 — Pet foundation

- Species + catalogue + owned pet  
- Clothing/equipment  
- Growth stage plumbing  
- Basic interactions (validate → persist → animate)

**Exit criteria:** One real species end-to-end with server persistence.

---

## Phase 5 — Living interaction

- Interaction Runtime  
- Event catalogue wiring  
- Avatar/pet reactions + priorities  
- Voice states: listening/thinking/speaking  
- Lip sync path (viseme or amplitude fallback)

**Exit criteria:** Automated reaction tests pass; Home coming-alive does not loop on rerender.

---

## Phase 6 — Alpha foundation

- Alpha orchestration service  
- Model provider abstraction  
- Tool registry + permissions  
- Memory subsystem + user controls

**Exit criteria:** One toolled action succeeds only after real confirmation; failure paths honest.

---

## Phase 7 — Alpha Bondfire

- Text conversation + streaming  
- Voice in Bondfire  
- Avatar/pet presence  
- Files/workspace foundation hooks  
- Server quota enforcement (rules per owner decisions)

**Exit criteria:** Bondfire usable under quota; spelling Bondfire everywhere.

---

## Phase 8 — Notifications and reminders

- Local + push  
- Scheduling  
- Alpha/avatar/pet attention coordination  
- Preference/mute respect

---

## Phase 9 — Calendar

- Provider connection  
- Sync  
- Create/read/update where supported  
- Meeting reminders

---

## Phase 10 — Mail and contacts

- Mail adapter capabilities as truly available  
- Contacts with separate consent  
- Alpha assistance  
- Notifications for new mail where permitted

---

## Phase 11 — Unified communications

- Voxora-owned messaging  
- External integrations **only** with verified official APIs  
- Reactions, voice, read aloud, quick replies  
- Capability enforcement; no fakes

---

## Phase 12 — Pet training

- Categories, progression, species training, mini-games  
- Server-approved rewards

---

## Phase 13 — Games

- Game Runtime  
- Initial games  
- Score validation  
- Rewards + achievements

---

## Phase 14 — Pet battles

- Battle engine  
- Skills  
- Battle UI + animation from server events  
- Rewards + history  
- Fairness model per owner-approved balancing option

---

## Phase 15 — Files, documents, workspaces

- Files, project work, document capabilities, creation tools

---

## Phase 16 — Wellness

- Requires detailed Wellness specification from owner  
- Alpha Wellness mode  
- Reminders  
- Permitted device integration  
- Privacy hardening  
- No invented diagnosis

---

## Phase 17 — Production hardening

Not “convert to mobile” — mobile exists from Phase 1.

- Android hardening  
- iOS hardening  
- Performance  
- Store requirements  
- Production monitoring  
- Security review  
- Accessibility review  
- Release preparation  

---

## Sequencing risk notes

1. Art/rig pipeline is on the critical path for Phases 3–5.  
2. Store billing decisions block complete Phase 2.  
3. Provider API eligibility gates Phases 9–11.  
4. Battle/game numbers gate Phases 12–14 polish, not engine scaffolding.  
5. Wellness blocked on separate specification.
