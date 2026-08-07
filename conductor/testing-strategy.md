# Voxora Testing Strategy — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Current repo reality:** No test runner, no tests. Strategy only.

---

## 1. Required test categories (eventually)

- unit  
- domain  
- API  
- database  
- authentication  
- authorisation  
- entitlements  
- provider adapters  
- Interaction Runtime  
- avatar states  
- pet states  
- Scene Engine (logic)  
- voice state transitions  
- games  
- training  
- battle engine  
- rewards  
- notifications  
- integration  
- end-to-end  

---

## 2. Reaction test example (mandatory pattern)

**Given:** Avatar = Idle  
**Event:** `ALPHA_STARTED_SPEAKING`  
**Expect:** Avatar = Speaking; pet receives eligible contextual event  

**When:** `ALPHA_FINISHED_SPEAKING`  
**Expect:** Avatar returns naturally to appropriate idle/conversation state  

Must be testable **without** manually watching the screen (pure runtime tests).

---

## 3. Recommended tooling (proposed)

| Layer | Proposal |
|-------|----------|
| Shared logic / runtime | Vitest or Jest |
| API | Nest/Jest + supertest; Testcontainers for Postgres/Redis where feasible |
| Mobile | Jest for logic; Detox/Maestro for critical E2E later |
| Battle engine | Deterministic seed replay tests |
| Provider adapters | Contract tests with recorded fixtures; no live credentials in CI |

---

## 4. Definition of done (testing slice)

A vertical slice is not done until applicable automated tests cover:

- happy path  
- authz denial  
- entitlement denial  
- dishonest-success prevention (e.g. cannot mark Sent without provider success)  
- key runtime state transitions  

UI mock-ups alone are never `IMPLEMENTED` / `TESTED`.

---

## 5. Phase 0 check execution note

Because the repository has no installable project, lint/typecheck/unit/e2e **cannot** be run yet. See `repository-audit.md` for executed commands and NOT APPLICABLE results.

---

## 6. Fake success tests (policy)

Add negative tests ensuring UI/API cannot return Connected/Verified/Sent/Paid/Synced without underlying success signals.
