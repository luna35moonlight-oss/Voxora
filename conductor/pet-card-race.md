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

Four pets race along an 11-step track. The player picks one pet as their champion; the other three
run as rivals. Cards do the running:

- the player's champion advances only when the player plays cards;
- rivals advance one run card per **server** tick (every 2.5 s), so standing still costs ground;
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
- Each race has **four card stations**, opened when the leading racer reaches steps 0, 4, 7, and 9.
  Stations one to three deal **3 cards**; the **final station deals 4** — 13 cards per race.
- Unplayed cards stay in hand, so combinations can be assembled across stations.
- **Five seconds between card selections.** The server enforces the wait (250 ms latency
  allowance) and the client shows the countdown.
- Rival racers advance on the server clock, one run card every 2.5 s, drawn from a shuffled deck
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
one step to that selection, whether it is played alone or inside a combination. A joker that stands
in for a high rank counts as a high card.

### Combination values

| Selection | Base steps |
|-----------|-----------|
| Single card | 1 |
| Pair | 3 |
| Two pair (for example 2 2 3 3) | 4 |
| Three of a kind (2 2 2) | 5 |
| Run of four (A 2 3 4) | 6 |
| Three pair (2 2 3 3 4 4) | 6 |
| Full house | 7 |
| Four of a kind (2 2 2 2) | 8 |

Steps = base steps + one per high card. Four kings is therefore the jackpot play at 12 steps. Any
selection that is not one of the combinations above is rejected, and the client shows why before the
player commits.

### Tactic cards

| Card | Effect |
|------|--------|
| **Trail chaser** | A wild animal chases one chosen rival off the path: that rival drops back a step and loses its next run card. |
| **Heavy paws** | Weights settle on every rival's feet: each rival loses its next run card. |
| **Mud stretch** | Mud floods the track two steps ahead of your champion: every rival that reaches it loses a step slogging through. |
| **Moon shield** | Blocks the next rival tactic aimed at your champion. |
| **Star sprint** | Your champion sprints one extra step immediately. |

A tactic card is played on its own, never as part of a rank combination, and it still costs the
five-second wait. Rival trainers answer **every station after the first** with one server-chosen
tactic aimed at the champion, which is what the moon shield exists to block.

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

The owner-stated rules are fixed: three races, a different pet each race, four stations dealing
3/3/3/4 cards, five seconds between selections, fast 10/J/Q/K cards, the combination list, two
jokers, and the five tactic cards. Everything below was chosen to make those rules play well and is
recorded as a question rather than a settled product rule (see `open-questions.md`): track length 11,
station steps 0/4/7/9, the 2 s rival tick, the combination step values, the score weights, and the
rule that rival trainers answer each station with one tactic.

**Why the track is 11 steps.** A race deals 13 cards. Roughly two of them are tactic cards, and the
rank cards average a little over one step each when spent as singles, so a player who spends their
hand sensibly has about 14 to 18 steps of movement available. Rival tactics take about three steps
back off the champion. A 14-step track left an average player stranded one step short of the line
with an empty hand; 11 steps leaves room to absorb the rival tactics and still reward good play.

**Why rivals tick every 2 seconds.** The three rivals share one run-card stream, so each advances on
roughly every third tick. At two seconds the leading rival reaches the line at about the same time as
a player spending cards steadily, which is what makes slowing rivals down worth a play.

---

## 8. Server authority and fairness

| Protection | Mechanism |
|-----------|-----------|
| Daily limit bypass | Conditional counter increment inside a transaction, same pattern as Moon Dash |
| Forged score | The client has no score field; the engine scores from its own state |
| Forged progress | Lane positions, hand contents, and the deal live in server state (`GameAttempt.progressState`) |
| Card that was never dealt | Every played card id must be in the server-held hand |
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
| Draw pile, rival schedule, and shuffle seed absent from every response payload | pass |
| Ten meets reserved per UTC day, eleventh rejected with 409 | pass |
| Five second cooldown rejected with 409 and an honest message | pass |
| Card that was never dealt rejected with 400 | pass |
| Another player's meet rejected with 403 | pass |
| Rivals advanced on the server clock while the client only synced | pass |
| Full three-race meets played through HTTP by a scripted player | 4 meets, 12 races completed; meets scored 43–167 |

The scripted playthroughs are what retuned the balance: on a 14-step track an average player ran out
of cards one step short of the line and lost every race, so the track is now 11 steps and rivals tick
every 2 s. The last two playthroughs won 5 of 6 races, including one photo finish and one second
place, with race scores spread across 29–59 — a race that can be lost, and a score worth improving.

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
