# Voxora Pet Battle System — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Rule:** Battles are server-authoritative. Animation never decides damage.

---

## 1. Phase 0 game/battle questions (§105) — battle focus

| Question | Answer (proposed) |
|----------|-------------------|
| How is battle state calculated? | Server battle engine applies actions to authoritative state using skills, stats, equipment, seed/RNG |
| How are results replayable/testable? | Persist `battle_events` + seed + start stats; replay reducer in tests |
| How are animations separated? | Server emits semantic events (`Dragon used Flame Burst`, `-14 HP`); client plays attack/VFX/HP UI |
| How can future real-time PvP be supported? | Engine already turn/event based over WebSocket; lockstep or server-frame ticks later without client authority |
| How is cheating reduced? | Client inputs intents only; server validates energy/cooldowns/ownership/entitlements; rewards via ledger idempotency |
| How are rewards protected? | Reward Service only; duplicate source_event_id rejected |

---

## 2. Battle record support

battle ID, players, pets, levels, start stats, equipment, skills, battle seed, turn order, actions, damage, healing, effects, status effects, winner, loser, rewards, XP, battle log, timestamps.

---

## 3. Baseline attributes (potential)

Health, Attack, Defence, Speed, Energy, Special.

Skills: ID, name, power, energy cost, cooldown, target, status effect, duration, compatible species, compatible growth stage.

**Exact balancing is owner-controlled and open until defined.**

---

## 4. Fairness principle

Subscription price must **not** automatically decide the winner.

Subscriptions may unlock modes, catalogue, species, training opportunities, cosmetics, features — not auto-victory.

### Balancing options for owner review (not selected)

1. **Stat caps by species/level only** — equipment provides limited bounded modifiers  
2. **Matchmaking by pet level / MMR** — not by subscription tier  
3. **Mode separation** — cosmetic-rich exhibition vs ranked with stricter gear rules  
4. **Diminishing returns** on paid equipment power  
5. **Entry requirements** by training milestones rather than spend  

Phase 0 records options; does **not** pick permanent balancing.

---

## 5. Presentation pipeline example

Server:

1. `Dragon used Flame Burst.`  
2. `Opponent lost 14 health.`  

Client:

1. play Dragon attack  
2. display flame  
3. play opponent reaction  
4. update health display  

---

## 6. Entitlement & feature flags

- Capability: `pet.battle`  
- Feature flag: may disable battles globally for beta control  
- Both required conceptually: flag = offered; entitlement = user may access  

---

## 7. Open owner decisions

- Damage formulas, status effects list, energy regen  
- Matchmaking rules  
- Ranked vs casual  
- Rewards per win/loss  
- Whether PvP is launch-critical or post-launch  
- Spectator rules  
