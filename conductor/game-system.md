# Voxora Game System — Games & Rewards Architecture

**Document status:** OWNER APPROVED REQUIREMENTS (Games & Rewards Addendum, Maryke Farrell)  
**Rule:** Do not hard-code every game directly into Home. Games run inside Voxora.  
**Phase boundary:** Full modular Games Platform remains **Phase 13**. White Wolf Moon Dash is the approved early Phase 2.5 vertical slice only.

**Do NOT implement Rock Paper Scissors or the Spinning Wheel during Phase 3 or Phase 4.**

---

## 1. Confirmed Voxora game / reward set

| Experience | Status | Notes |
|------------|--------|-------|
| **White Wolf Moon Dash** | Approved Phase 2.5 vertical slice | 10 tries/user/UTC day; server attempt reservation; high score; leaderboard; First/Second prize-position support; manual Legendary Avatar redeem-code process. See `moon-dash.md`. Do not redesign Moon Dash because of this addendum. |
| **Voxora Pet Card Race** | Implemented for owner review (ADR-028) | Card game with pets as racers: 10 meets/user/UTC day; three races per meet with a different pet each race; four card stations (3 cards, 4 at the final station); five seconds between selections; combinations, jokers, and fast 10/J/Q/K cards; five tactic cards. Server owns shuffle, deal, rival advances, and score. **No rewards, currencies, redeem codes, or pet progression.** See `pet-card-race.md`. |
| **Rock Paper Scissors** | Confirmed **future** game | 10 tries/user/UTC day (UTC server day). Progression purpose includes **server-approved points toward pet skill development**. Implementation belongs with Phase 13 (not Phase 3/4). |
| **Spinning Wheel** | Confirmed **future** reward/game mechanic | Server-authoritative outcomes. May award Pet Skill-Up Shards, Voxora Diamonds, Voxora Coins, Avatar Skin redeem codes. Attempt/spin rules **not yet defined**. |
| Future Voxora games | Placeholder | Game Runtime must not be hard-coded around Moon Dash only. |

---

## 2. Phase order (do not change)

Current roadmap remains:

- Phase 3 — Scene Engine & Avatar Foundation  
- Phase 4 — Pet Foundation  
- …  
- Phase 12 — Pet Training  
- **Phase 13 — Games**  
- Phase 14 — Pet Battles  

White Wolf Moon Dash remains the approved early exception/vertical slice.  
Rock Paper Scissors and Spinning Wheel do **not** authorise skipping to Phase 13.

---

## 3. Game Module contract (must support game-type differences)

Do not force every game into a score-only model.

### Moon Dash
- run; score; high score; attempt; leaderboard

### Pet Card Race
- meet of three races; per-race champion selection; server-held card deal; selection cooldown; combination ruling; race score; meet score; leaderboard

### Rock Paper Scissors
- match/round; user choice; server/opponent outcome; result; pet-skill reward/progression (via Reward Ledger)

### Spinning Wheel
- spin; eligibility; server-approved outcome; reward type; reward amount/reference

Shared Game definition fields still apply (game ID, version, entitlement, platforms, assets, etc.).

---

## 4. UTC attempt / play-limit principle

Moon Dash and Rock Paper Scissors both use:

**10 TRIES PER USER PER UTC DAY**

- The **server** determines the UTC day.  
- Do **not** use device date, device clock, user-selected time zone, or local midnight as the authoritative reset boundary.  
- Changing the phone clock must never create additional attempts.

Voxora Pet Card Race follows the same principle with **10 meets per user per UTC server day**.

Architecture should prefer a reusable server-authoritative play-limit / attempt-policy component where appropriate, with **configurable per-game policy**.

Do **not** assume every future game has 10 tries per day.

### Spinning Wheel limits — NOT YET DEFINED

Record as: **OWNER DECISION REQUIRED BEFORE SPINNING WHEEL IMPLEMENTATION**

Do not copy the 10-per-day rule from Moon Dash / Rock Paper Scissors onto the Wheel. Do not invent free-spin frequency, purchase of spins, probabilities, or quantities.

---

## 5. Rock Paper Scissors purpose

Not only a standalone mini-game. Progression/reward purpose includes:

**POINTS THAT CONTRIBUTE TO PET SKILL DEVELOPMENT**

Future flow:

```text
game result
→ validated server result
→ approved reward/progression transaction
→ pet skill progression system
```

- Mobile client must **not** directly mutate pet skill values.  
- Client must **not** decide how many progression points are awarded.  
- Server remains authoritative.

Exact conversion formulas remain **OWNER DECISION REQUIRED BEFORE IMPLEMENTATION**. Do not invent points per win/draw/loss, skill thresholds, maxima, or species multipliers.

---

## 6. Central Reward Service / Reward Ledger

Moon Dash, Rock Paper Scissors, Spinning Wheel, and future games must ultimately use Voxora’s central server-authoritative Reward Service / Reward Ledger.

Reward transactions should support:

- transaction ID  
- user ID  
- pet ID where applicable  
- game/source  
- source event / run / spin ID  
- reward type  
- amount  
- reason  
- timestamp  
- idempotency key  
- status  
- audit information  

Prevent duplicate rewards. Individual games must not arbitrarily update user balances.

---

## 7. Reward types (confirmed separation)

| Reward type | Notes |
|-------------|-------|
| Pet Skill-Up Shards | Distinct resource for future pet skill progression |
| Voxora Diamonds | Virtual currency/resource — ledger-backed |
| Voxora Coins | Separate virtual currency/resource — ledger-backed |
| Avatar Skin redeem code | Redeemable grant through normal Avatar ownership/inventory |
| Moon Dash Legendary Avatar redeem code | Manual Owner-issued prize path (existing); shared redeem architecture, not a separate avatar system |

Do **not** collapse Diamonds and Coins into one currency.

Commercial/economic rules (prices, exchange, expiration, transfer, gifting, cash value, withdrawal, marketplace, max balances) remain **OWNER DECISION REQUIRED**. Do not imply real-world money redeemability unless explicitly approved later.

---

## 8. Server-authoritative Spinning Wheel

Conceptual future flow:

```text
user requests spin
→ server verifies eligibility
→ server reserves/accepts spin
→ server determines or securely validates outcome
→ reward transaction created
→ Reward Service/Ledger records award
→ mobile animates the approved result
```

The visual wheel animation does **not** determine the reward.  
Client must not be able to submit `I won 500 diamonds` without authoritative server validation.

Reward probabilities and quantities: **OWNER DECISION REQUIRED**. Do not invent chances for Coins, Diamonds, Skill-Up Shards, or Avatar Skin codes. Future reward tables must be configurable and auditable.

---

## 9. Redeem-code architecture (shared)

Voxora already has a redeem-code concept for Moon Dash Legendary Avatar prizes. Future design must support multiple sources without incompatible parallel systems:

- Moon Dash prize  
- Spinning Wheel Avatar Skin  
- promotions  
- future authorised rewards  

Capable of enforcing: uniqueness; reward reference; issuance state; expiry where applicable; eligible user where applicable; single-use redemption; redemption timestamp; ownership grant; audit.

Do not invent expiry rules unless defined.  
Do not automatically issue Moon Dash competition codes merely because a shared redeem-code architecture exists.

Avatar Skin codes must integrate with Phase 3 Avatar Catalogue / ownership / inventory — **not** a separate `WheelAvatarSystem`.

---

## 10. Fairness and security

Protect against: replayed submissions; duplicate reward grants; modified clients; forged scores/results/spin outcomes; forged currencies/shard balances/redeem codes; concurrency abuse; changing device time; daily-limit bypass.

Server state remains authoritative.

---

## 11. Phase 3 / Phase 4 responsibility

| Allowed now | Forbidden now |
|-------------|----------------|
| Record these requirements in architecture docs | Build Rock Paper Scissors |
| Ensure Avatar ownership/redeem paths do not conflict | Build Spinning Wheel |
| Ensure future Pet foundation can consume game/reward events later | Implement pet skill formulas, Coins, Diamonds, shard economy, marketplace |
| Preserve Phase 13 as full Games Platform | Expand into full Phase 13 |

---

## 12. Open owner decisions (see also `open-questions.md`)

- Exact RPS progression point formulas  
- Exact pet skill thresholds / maxima / species multipliers  
- Spinning Wheel attempt/eligibility/purchase rules  
- Spinning Wheel reward probabilities and quantities  
- Currency commercial rules  
- Shard economy details  
- Leaderboard / competition legal terms for public launches
