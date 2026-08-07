# Voxora Game System — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Rule:** Do not hard-code every game directly into Home. Games run inside Voxora.

---

## 1. Phase 0 questions (§105) — games focus

| Question | Answer (proposed) |
|----------|-------------------|
| How are games modular? | Game Module contract + game packages loaded by Game Runtime shell |
| How are results validated? | Client submits score/telemetry; server validates plausibility rules per game version |
| How are rewards protected? | Only Reward Ledger after validation; idempotent `source_event_id` |
| Future real-time | WebSocket sessions; authoritative server state for multiplayer-capable games |

---

## 2. Game definition contract fields

- game ID, version, name  
- entitlement  
- supported platform  
- player requirement  
- avatar requirement / pet requirement / species compatibility  
- control/input type  
- scoring, progression, save state  
- reward rules ref  
- leaderboard eligibility  
- multiplayer capability  
- assets  

---

## 3. Runtime responsibilities

| Component | Role |
|-----------|------|
| Home / navigation | Entry points only |
| Game Runtime shell | Lifecycle, pause, entitlement gate, loading, exit |
| Game module | Specific gameplay |
| Server | Validate completion, grant rewards/achievements |
| Interaction Runtime | Optional pet/avatar reactions on start/complete |

---

## 4. Anti-cheat posture (initial)

- Treat client score as claim, not truth  
- Per-game validators (max score/time bounds, action budgets)  
- Stronger anti-cheat only where competitive leaderboards require it  
- Exact leaderboard rules → owner decision  

---

## 5. Relationship to training & battles

- Training mini-games may be specialized modules under pet training  
- Pet battles are a separate authoritative engine (`pet-battle-system.md`)  
- Shared Reward Ledger and Achievement systems  

---

## 6. Open owner decisions

- Which launch games ship  
- Exact scoring and rewards  
- Leaderboard rules  
- Whether multiplayer is in initial roadmap slice or later  
