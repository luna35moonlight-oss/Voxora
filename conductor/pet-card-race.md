# Voxora Pet Card Race — card-driven pet race slice

**Document status:** IMPLEMENTED FOR OWNER REVIEW  
**Product owner:** Maryke Farrell  
**ADR:** ADR-028  
**Owner request (2026-08-17):** a second game "using cards to race, using the pets as the racers".

**Scope boundary:** this does **not** authorise the full Voxora Games Platform (Phase 13), Rock
Paper Scissors, the Spinning Wheel, currencies, shard economies, or Phase 4 Pet Foundation. It also
does **not** create a second avatar, pet, or reward system.

---

## 1. What the game is

Four pets race along a 14-step track. The player picks one pet as their champion; the other three
run as rivals. Cards do the running:

- every race opens with the same **mixed deal of 8 cards**, and four stations deal more along the way;
- the player's champion advances only when the player plays cards;
- rivals advance one run card per **server** tick (every 1.3 s), shared between the three of them, so standing still costs ground;
- one attempt is a **meet of three races** and each race needs a **different pet**.

Meet score is the sum of the three race scores, and the daily leaderboard uses the best meet score.

---

## 2. Authoritative rules

- Game id: `voxora-pet-card-race`.
- **10 meets per user per UTC day.** The **server** owns the UTC day boundary, exactly as Moon Dash
  and future Rock Paper Scissors do. Changing the device clock must never create attempts.
- The server reserves the meet before the first race starts; a reserved meet is consumed even if it
  is abandoned or forfeited.
- **3 races per meet, a different pet each race.** The server rejects a repeated pet.
- **Every player opens every race with a mixed deal of 8 cards:** 6 run cards and 2 tactic cards, so
  nobody opens on eight tactic cards or on none at all. The deal shape is identical for every player.
- Each race then has **four card stations**, opened when the leading racer reaches steps 3, 6, 9, and
  12. Stations one to three deal **3 extra cards**; the **final station deals 4** — 21 cards per race.
- Unplayed cards stay in hand, so combinations can be assembled across stations.
- **Five seconds between card selections.** The server enforces the wait (250 ms latency
  allowance) and the client shows the countdown.
- Rival racers advance on the server clock, one run card every 1.3 s, drawn from a shuffled deck
  that holds an equal number of cards per rival. No racer has better odds than another.
- A race ends when the champion crosses the line, or when all three rivals have crossed.
- The meet ends after the third race, on forfeit, or on attempt expiry (45 minutes).

The device is never authoritative for the shuffle, the deal, rival positions, the cooldown, the
finishing order, the score, the leaderboard, or anything a reward would ever depend on.

---

## 3. The deck

Each race is dealt from its own shuffled 64-card deck:

| Cards | Count | Purpose |
|-------|-------|---------|
| Rank cards A, 2–10, J, Q, K in four Voxora suits (Moon, Star, Crystal, Flame) | 52 | run the champion |
| Jokers | 2 | wild — stand in for whichever rank helps the selection most |
| Tactic cards, two copies each of Trail chaser, Heavy paws, Mud stretch, Moon shield, Star sprint | 10 | interfere with the race |

**10, J, Q, and K run faster than the rest of the deck:** every high card in a played selection adds
one step to that selection, whether it is played alone or inside a combination, up to two extra steps
per selection. A joker that stands in for a high rank counts as a high card.

### Combination values

| Selection | Base steps |
|-----------|-----------|
| Single card | 1 |
| Pair | 2 |
| Two pair (for example 2 2 3 3) | 3 |
| Three of a kind (2 2 2) | 3 |
| Run of four (A 2 3 4) | 4 |
| Three pair (2 2 3 3 4 4) | 4 |
| Full house | 5 |
| Four of a kind (2 2 2 2) | 6 |

Steps = base steps + one per high card, and the high-card bonus is capped at two, so four kings is the
jackpot play at 8 steps on a 14-step track rather than an instant win. Any selection that is not one
of the combinations above is rejected, and the client shows why before the player commits.

### Tactic cards

| Card | Effect |
|------|--------|
| **Trail chaser** | A wild animal chases one chosen rival off the path: that rival drops back a step and loses its next two steps. |
| **Heavy paws** | Weights settle on every rival's feet: each rival loses its next two steps. |
| **Mud stretch** | Mud floods the track two steps ahead of your champion: every rival that reaches it loses two steps slogging through. |
| **Moon shield** | Blocks the next rival tactic aimed at your champion. |
| **Star sprint** | Your champion sprints two extra steps immediately. |

A tactic card is played on its own, never as part of a rank combination, and it still costs the
five-second wait. Rival trainers answer the **second, third, and final stations** with one
server-chosen tactic aimed at the champion, which is what the moon shield exists to block. The first
station is a free refill.

---

## 4. Race score (server-computed)

| Component | Value |
|-----------|-------|
| Finishing position | 40 / 25 / 12 / 5 |
| Combinations of a pair or better | 3 each, capped at 30 |
| Tactic cards that had an effect | 4 each, capped at 16 |
| Winning margin over the runner-up | 2 per step, capped at 10 (winner only) |
| Photo finish (won by one step or less) | 4 |

A race is capped at 100 points and a meet at 300. The client never submits a score: it has no score
field to submit. Forfeited meets are recorded with a zero score and never reach the leaderboard.

---

## 5. The racers are not pets yet

The four racers — Nyx the shadow panther, Nova the star kitten, Lumi the moonlit wolf, and Kai the
aurora dragon — are **race-local racer definitions inside this game**. They are deliberately not:

- `pet_species` records,
- catalogue templates,
- user-owned pet instances,
- avatar catalogue entries.

Phase 4 Pet Foundation remains the owner of real pets. When it lands, these racers may be mapped
onto real species records; until then no ownership, XP, bond, skill, or shard value is written by
this game. Lumi shares a name with the Moon Dash wolf on purpose; it shares no system with it.

---

## 6. Rewards — not defined

Pet Card Race records a server-owned score and a daily leaderboard. It deliberately awards **no**
prizes, redeem codes, Coins, Diamonds, Pet Skill-Up Shards, or pet progression, and it writes nothing
to a reward ledger. `rewardStatus` is reported honestly as
`REWARD_RULES_PENDING_OWNER_DECISION`.

When rewards are approved they must route through the central Reward Service / Reward Ledger and the
shared redeem-code architecture in `game-system.md` — never a Pet-Card-Race-specific reward system.

**OWNER DECISION REQUIRED BEFORE ANY PET CARD RACE REWARD, PRIZE, OR COMPETITION.**

---

## 7. Provisional balance values an owner may want to change

The owner-stated rules are fixed: three races, a different pet each race, the 8-card opening deal,
four stations dealing 3/3/3/4 extra cards, five seconds between selections, fast 10/J/Q/K cards, the
combination list, two jokers, and the five tactic cards. Everything below was chosen to make those
rules play well and is recorded as a question rather than a settled product rule (see
`open-questions.md`): track length 14, station steps 3/6/9/12, the 6-run-card and 2-tactic-card split
inside the opening deal, the 1.3 s rival tick, the combination step values and the two-step cap on the
high-card bonus, the two-step cost of a slow effect, the score weights, and the rule that rivals
answer the second, third, and final stations.

**How the numbers were reached.** Scripted playthroughs against a running API measured the real rates
rather than guessing them. A race deals 21 cards, of which about four are tactic cards, and a player
spending them sensibly produces roughly 20 steps of movement across ten to twelve plays — a little
over a minute at five seconds a selection. The tactics rivals aim at the champion take about four to
six steps back off that. A 14-step track sits inside what those 21 cards can cover while leaving the
rival tactics room to hurt, and at a 1.3 s tick the leading rival arrives at about the same time as a
player spending cards steadily.

Earlier attempts show why this needed measuring rather than guessing: a 14-step track with only 13
cards a race left the player stranded short of the line every time, an 11-step track with the 8-card
opening deal turned every race into a walkover finished in three plays, and a 20-step track with a
one-second tick made the rivals unbeatable.

---

## 8. Server authority and fairness

| Protection | Mechanism |
|-----------|-----------|
| Daily limit bypass | Conditional counter increment inside a transaction, same pattern as Moon Dash |
| Forged score | The client has no score field; the engine scores from its own state |
| Forged progress | Lane positions, hand contents, and the deal live in server state (`GameAttempt.progressState`) |
| Card that was never dealt | Every played card id must be in the server-held hand |
| Opening deal manipulation | The opening mix is dealt by the server from its own shuffled pile |
| Illegal combination | The server re-evaluates the selection with the shared rules and rejects anything invalid |
| Cooldown bypass | The server compares against its own last-play timestamp |
| Peeking at the deck | The client is sent the hand only, never the draw pile, the rival deck, or the seed |
| Replay / double finalisation | Finalisation is a conditional update guarded on the reserved status |
| Clock tampering | Rival advances and the UTC day come from the server clock |

Each race is reproducible from the server-held seed for audit. Delivered animation events are
best-effort detail; the lane snapshot in every response is authoritative, so a dropped response
cannot desynchronise a race.

**Known limitation:** the client polls the sync endpoint on the rival tick interval to observe rival
advances. A push transport is the natural improvement when the Phase 13 Games Platform is built.

---

## 9. Runtime validation (2026-08-17)

Verified against a real PostgreSQL database and a running API, not only unit tests.

| Check | Result |
|-------|--------|
| Migration `20260817203000_game_attempt_progress_state` applied by `prisma migrate deploy` | pass |
| API end-to-end suite (`petCardRace.e2e.spec.ts`, 8 cases) plus the existing 26 e2e cases | pass |
| Opening deal is always 8 cards: 6 run cards and 2 tactic cards | pass |
| Draw pile, rival schedule, and shuffle seed absent from every response payload | pass |
| Ten meets reserved per UTC day, eleventh rejected with 409 | pass |
| Five second cooldown rejected with 409 and an honest message | pass |
| Card that was never dealt rejected with 400 | pass |
| Another player's meet rejected with 403 | pass |
| Rivals advanced on the server clock while the client only synced | pass |
| Full three-race meets played through HTTP by a scripted player | 27 races across 9 meets while tuning |

The final settings were confirmed over nine consecutive races: **three firsts, three seconds, one
third, two fourths, and one photo finish**, with meet scores of 56, 122, and 144. Races ran ten to
twelve plays, about a minute each, and the scripted player used most of its 21 cards. That spread —
winnable, losable, and scored differently each time — is the outcome the balance was tuned for.

---

## 10. Implementation map

| Concern | Location |
|---------|----------|
| Shared contract (ids, limits, roster, card and view schemas) | `packages/contracts/src/index.ts` |
| Shared pure rules (deck, combinations, jokers, fast cards, race score) | `packages/domain/src/petCardRace.ts` |
| Authoritative state machine | `apps/api/src/games/pet-card-race/pet-card-race.engine.ts` |
| Reservation, persistence, finalisation, leaderboard | `apps/api/src/games/pet-card-race/pet-card-race.service.ts` |
| Endpoints under `/v1/games/pet-card-race` | `apps/api/src/games/pet-card-race/pet-card-race.controller.ts` |
| Mobile card, lanes, hand, pet figures | `apps/mobile/src/games/PetCardRaceCard.tsx`, `petCardRace.ts`, `PetRacerFigure.tsx` |
| Server-owned in-progress state column | `GameAttempt.progressState` (nullable JSON) |

The combination rules live in one shared module so the client preview and the server ruling can
never drift apart, while the server still evaluates every play independently.
