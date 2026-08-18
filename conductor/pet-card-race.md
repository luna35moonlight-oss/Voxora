# Voxora Pet Card Race — live race, cards as influence

**Document status:** CORRECTED PER OWNER DIRECTION (2026-08-18) — IMPLEMENTED FOR OWNER REVIEW
**Product owner:** Maryke Farrell
**ADR:** ADR-028 (with the 2026-08-18 corrections recorded there)

**Owner corrections applied:** the pets run continuously and cards influence the running race; the
Voxora avatar enters a pet and stays associated with it; four normal checkpoints of three cards then a
separate final checkpoint of four; the opening deal of eight follows the chosen pet's race profile;
movement is continuous rather than tile-based; tactics are visible race events; the player always
chooses their own combination.

**Reference material:** the Owner supplied a reference gameplay presentation to explain the *experience*
only. No reference artwork, characters, environment, card art, icons, names, branding, or interface
graphics are reproduced. Every racer, avatar, effect, and symbol here is Voxora's own.

---

## 1. The race

Four competitors line up. Each is a **Voxora avatar** (the trainer) paired with the **Voxora pet** that
runs for them. A countdown runs 3 → 2 → 1 → GO and then **all four pets run continuously** under
server-authoritative simulation until they cross the finish line.

The player's cards do not create the movement. They influence it:

- combinations make your pet run faster for a while;
- a sprint gives an immediate burst;
- heavy paws slow every rival;
- mud puts an obstacle on the course;
- a trail chaser breaks one named rival's stride;
- a shield blocks the next tactic aimed at your pet.

The race continues while the player is deciding, which is where the urgency comes from. A player who
hesitates keeps running but loses ground to rivals who never stop.

One attempt is a **meet of three races**, and each race needs a different pet.

---

## 2. Structure of a race

| Stage | What happens |
|-------|--------------|
| Pet selection | The player picks the pet to enter. The opening deal follows that pet's race profile. |
| Starting grid | The four teams are shown: avatar, trainer name, and the pet running for them. |
| Countdown | 3 → 2 → 1 → GO. Nothing moves until GO, and cards cannot be committed yet. |
| Race | All four pets run. Cards are played from the hand at the bottom of the screen. |
| Checkpoints | **Checkpoint 1 +3 cards → checkpoint 2 +3 → checkpoint 3 +3 → checkpoint 4 +3 → FINAL checkpoint +4** |
| Finish | Pets cross a real finish line; placements are recorded as each one crosses. |
| Race result | Finishing order, race score, and updated meet standings. |
| Next race | Back to pet selection for a pet that has not raced in this meet. |

Cards per race: **8 opening + 4 × 3 + 4 = 24.** The final checkpoint is separate from the four normal
checkpoints, exactly as instructed.

Unplayed cards stay in hand, so combinations can be assembled as the race develops.

---

## 3. Authoritative rules

- Game id: `voxora-pet-card-race`.
- **10 meets per user per UTC day**, with the **server** owning the UTC boundary. Changing the device
  clock can never create attempts.
- The meet is reserved before the first race starts and is consumed even if abandoned.
- **3 races per meet, a different pet each race.** The server rejects a repeated pet.
- **Opening deal of 8 cards**, composed from the selected pet's race profile.
- **Four normal checkpoints of 3 cards, then a final checkpoint of 4.** Cards arrive in the hand while
  the race keeps running; the race is never interrupted by another screen.
- **Five seconds between committed plays.** Selecting several cards for one combination costs nothing:
  the wait starts when the whole play is accepted by the server.
- Positions come from authoritative race progress, never from card scores.
- A race ends when the pets have crossed the line; remaining placements settle by distance once the
  first pet is home.

The device is never authoritative for the shuffle, the deal, any pet's position, the cooldown, the
finishing order, the score, or the leaderboard.

---

## 4. Cards

Each race is dealt from its own shuffled pool: 52 rank cards (A, 2–10, J, Q, K in Moon, Star, Crystal
and Flame), **two jokers**, and two copies of each of the five tactic cards.

**Combinations make the pet run faster** — they never teleport it:

| Selection | Effect |
|-----------|--------|
| Single card | small, short pace increase |
| Pair | larger pace increase |
| Two pair | larger again |
| Three of a kind | strong |
| Sequence of four (for example A 2 3 4) | strong, longer |
| Three pairs (22 33 44) | strong, longer |
| Full house | very strong |
| Four of a kind | strongest |

Every 10, J, Q, or K in the played selection adds a little more pace, up to a capped bonus. A **joker**
stands in for whichever rank completes the combination the player selected, and the server rules on
the resolved value.

The exact multipliers and durations are **not owner-approved**; they live in one balance table (§8) and
are reported for approval.

The player always selects their own cards. The app does not choose combinations for them.

### Tactic cards

| Card | Race effect |
|------|-------------|
| **Trail chaser** | A trail animal bursts into the race and chases one chosen rival, breaking its stride. |
| **Heavy paws** | Weights drag at every rival: their run turns heavy and laboured. |
| **Mud stretch** | A mud section appears on the course ahead; rivals that reach it slog through and lose pace. |
| **Moon shield** | A guarding field around your pet blocks the next rival tactic aimed at it. |
| **Star sprint** | Your pet surges into an immediate sprint. |

Each is a visible race event, not a hidden number: mud exists on the track, the shield shows as a ring,
sprints leave a trail, and slowed pets carry a status. House trainers answer from the second checkpoint
onward with one tactic aimed at the player's pet — which is what the shield is for.

---

## 5. Avatar and pet

Each competitor is an avatar plus a pet:

```text
Player / Voxora avatar → selected Voxora pet → the race
```

- The player's avatar is read from the single avatar selection the Avatar Foundation owns
  (`UserAvatarSelection`, falling back to the owned starter avatar exactly as the avatar card does).
  This game stores no avatar state and creates no second avatar concept.
- The reserved meet records `trainerAvatarId`, so a meet is attributable to the avatar that entered it.
- Every lane shows the pet's name with its trainer beneath, so it is always clear which pet belongs to
  which competitor.
- The three rivals are **Voxora house trainers**, reported as `trainerKind: 'HOUSE'`. They are not
  presented as other people. Racing against real players is a later phase.

---

## 6. The pets

The racers are the four pets the Owner supplied as visual direction: a black panther, a small mystic
pastel creature, a white wolf, and a teal dragon-lizard. They are:

- **the actual racers** — the pet runs, the avatar trains;
- **visually distinct** — each has its own silhouette (`PANTHER`, `SMALL_MYSTIC`, `WOLF`, `DRAGON`),
  body proportions, palette, and gait, so a panther never runs as a wolf;
- **development placeholders** — every pet is reported to the client as
  `source: 'DEVELOPMENT_PLACEHOLDER'` and the status response carries `petFoundationIntegrated: false`.

**Pet Foundation is the destination.** The race consumes a pet identity (`petId`, appearance,
silhouette, palette, race profile) rather than owning a permanent race-pet set. When Phase 4 Pet
Foundation exists, the same interface receives real pets — with animation, effects, skills, and
progression — and these placeholders are retired. Nothing here writes pet ownership or progression.

### Pet → race profile → opening hand

The chosen pet decides the shape of the opening deal through a data-driven profile
(`PET_CARD_RACE_RACE_PROFILES`). Today every pet points at one neutral profile marked
`approved: false`, and the client says so honestly, because per-pet weightings are not defined.

The structure already supports later per-pet racing personalities — starting-card tendencies, card
affinity, speed or defensive tendency, sprint characteristics, resistance, special skills, progression
bonuses — without rewriting the game. **Those characteristics are capability, not permission:** none of
them are invented here.

---

## 7. Presentation

- The race screen is the game: the pets are the largest moving thing on it, and cards sit at the bottom
  without covering them.
- Positions 1–4 update live as pets overtake each other.
- A progress rail across the top shows START → four checkpoints → final checkpoint → FINISH, with a
  marker per racer.
- Movement is **continuous**: the server simulates in small steps and reports each pet's position *and
  current speed*, and the client interpolates between snapshots so pets accelerate, close gaps, and
  overtake smoothly instead of hopping between tiles.
- Selected cards lift out of the row so the intended play is obvious before it is committed.
- The five second wait is shown as a countdown on the commit button.

**Still to come, and honestly not built:** produced 3D or Rive pets, a camera that follows the action,
and full per-species animation sets (idle, prepare, launch, sprint, mud reaction, chased, shielded,
win, lose). Those are art-pipeline work behind the ADR-004 gate. The current lanes and figures are
placeholder presentation of the correct model, not the final look. The reference presentation also
included a rewards rail, which is **not** built because rewards are undefined (§9).

---

## 8. Balance values — OWNER APPROVAL REQUIRED

Every number below sits in `PET_CARD_RACE_BALANCE` in `packages/contracts` so it can be reviewed and
changed in one place. **None of these is an owner rule.** They were chosen only so the corrected race
could be played and reviewed.

| Value | Current | Purpose |
|-------|---------|---------|
| `courseMetres` | 700 | Race distance |
| `baseSpeedMetresPerSecond` | 8 | Pace before any card or effect |
| `housePaceAmplitude` / `housePacePeriodMs` | 0.12 / 9000 | How much house racers breathe around the base pace so the pack shuffles |
| `countdownMs` | 3200 | Length of 3 → 2 → 1 → GO |
| `simulationStepMs` | 100 | Server simulation resolution |
| `checkpointFractions` | 0.18 / 0.36 / 0.54 / 0.72 / 0.88 | Where the four checkpoints and the final checkpoint sit |
| `comboBoosts` | single 1.06×3s → four of a kind 1.65×6.5s | Speed multiplier and duration per combination |
| `fastCardBonusPerCard` / `fastCardBonusCap` | 0.04 / 0.12 | Extra pace per 10/J/Q/K, and its ceiling |
| `tactics.SPRINT` | 1.6× for 3.5s | Sprint burst |
| `tactics.WEIGHTS` | 0.74× for 4.5s | Rival slowdown |
| `tactics.CHASER` | 0.62× for 4s | Chased rival slowdown |
| `tactics.MUD` | 0.55×, 55 m long, 70 m ahead | Mud obstacle |
| `tactics.SHIELD` | blocks one tactic | Shield behaviour (a charge, not a timer) |
| `scoring.*` | 40/25/12/5 position points, 3/combo (cap 30), 4/tactic (cap 16), 1 per 10 m margin (cap 10), 4 photo finish, 100 race cap | Race score weights |
| Race-end grace | 6 s after the first pet finishes | How long remaining placements are resolved before settling by distance |
| House trainers answer from checkpoint 2 | provisional | Whether rivals should use tactics at all, and how often |

Owner-approved and **not** in question: 10 meets per UTC day; 3 races per meet with a different pet
each race; the 8-card opening deal; four normal checkpoints of 3 cards and a final checkpoint of 4; the
five second wait between committed plays; 10/J/Q/K running faster; the combination list; two jokers;
the five tactic cards; pets running continuously with cards as influence.

---

## 9. Rewards — not defined

Pet Card Race records a server-owned score, race standings, and a daily leaderboard. It awards **no**
prizes, redeem codes, Coins, Diamonds, Pet Skill-Up Shards, or pet progression, and writes nothing to a
reward ledger. `rewardStatus` is reported as `REWARD_RULES_PENDING_OWNER_DECISION`.

When rewards are approved they must route through the central Reward Service / Reward Ledger and the
shared redeem-code architecture in `game-system.md`.

**OWNER DECISION REQUIRED BEFORE ANY PET CARD RACE REWARD, PRIZE, OR COMPETITION.**

---

## 10. Server authority and fairness

| Protection | Mechanism |
|-----------|-----------|
| Daily limit bypass | Conditional counter increment inside a transaction, as Moon Dash does |
| Forged score | The client has no score field; the engine scores from its own simulation |
| Forged position | Every pet's position comes from the server simulation in `GameAttempt.progressState` |
| Card that was never dealt | Every played card id must be in the server-held hand |
| Illegal combination | The server re-evaluates the selection with the shared rules and rejects anything invalid |
| Cooldown bypass | The server compares against its own last-play timestamp |
| Playing before GO | Rejected until the countdown has elapsed on the server clock |
| Peeking | The client receives its hand only — never the draw pile, the house pace offsets, or the seed |
| Replay / double finalisation | Finalisation is a conditional update guarded on the reserved status |
| Clock tampering | The simulation and the UTC day come from the server clock |

A race is reproducible from its server-held seed for audit. Delivered events are animation detail; the
competitor snapshot in every response is authoritative, so a dropped response cannot desynchronise a
race.

**Known limitation:** the client polls a sync endpoint (1.5 s) and interpolates between snapshots. A
push transport belongs with the Phase 13 Games Platform.

---

## 11. Runtime validation

Verified against a real PostgreSQL database and a running API, and by playing the real mobile card in
a browser through react-native-web.

| Check | Result |
|-------|--------|
| Migration `20260817203000_game_attempt_progress_state` applied by `prisma migrate deploy` | pass |
| API end-to-end suite (`petCardRace.e2e.spec.ts`, 10 cases) plus the existing 26 e2e cases | pass |
| All four pets advance on the server clock with no card played | pass |
| Player pet runs at base pace without cards; a combination raises pace rather than moving the pet | pass |
| Plays rejected before GO; five second cooldown rejected with an honest message | pass |
| Checkpoints deliver 3/3/3/3 then 4 cards into the hand while the race runs | pass |
| Mud exists on the course, shield blocks a house tactic, chaser needs a named rival | pass |
| Placements recorded as pets cross the line; race then meet results and standings | pass |
| Race events delivered exactly once | pass (see fix below) |
| Draw pile, house pace offsets, and shuffle seed absent from every response | pass |
| Pets reported as development placeholders with four distinct silhouettes | pass |
| Live browser play: countdown, four pets running, live positions, checkpoint deals, effects | pass |

### Defects the play-testing found and fixed

| Defect | Fix |
|--------|-----|
| Countdown showed "4" first, because a 3.2 s countdown ceilings to four seconds | Countdown is exactly 3 s, so it reads 3 → 2 → 1 → GO |
| Queued race events were re-delivered on the next request, duplicating log lines | The view is drained **before** the state is persisted, so each event ships once |
| The winning margin always measured 0 m, because distances are equal once every pet is home | The gap is snapshotted at the moment the player crosses the line |
| The lane finish line sat short of the lane end, so pets appeared to stop before it | The lane rail is inset by exactly one figure width; a pet at 100% has its nose on the line |
| Pets were dwarfed by the interface | Taller lanes, larger figures, one scrollable row of cards, shorter event log |

### Balance measurement — OWNER DECISION

The same scripted player was run at different deliberation speeds, which is the clearest read on how
the pacing feels:

| Time to choose and commit a play | Plays per race | Result |
|----------------------------------|----------------|--------|
| ~3.5 s (decisive) | 11 | Won all three races, meet score 206 |
| ~3 s (decisive) | 11–12 | Won two of three races, meet score 187 |
| ~6 s (deliberate) | 8–9 | Finished fourth in all three races, meet score 81 |

That is the intended shape — hesitating costs ground because the pets never stop — but the penalty is
currently steep: a player who takes about six seconds a play loses every race. Whether that is the
right difficulty is a balance decision, and `baseSpeedMetresPerSecond`, `comboBoosts`, and
`courseMetres` are the levers. **OWNER DECISION REQUESTED** (recorded as OQ-PCR-002).

---

## 12. Implementation map

| Concern | Location |
|---------|----------|
| Shared contract, pet identities, race profiles, and the balance table | `packages/contracts/src/index.ts` |
| Shared pure card rules (pool, combinations, jokers, fast cards, race score) | `packages/domain/src/petCardRace.ts` |
| Continuous race simulation, effects, obstacles, checkpoints, placements | `apps/api/src/games/pet-card-race/pet-card-race.engine.ts` |
| Reservation, persistence, finalisation, avatar linkage, leaderboard | `apps/api/src/games/pet-card-race/pet-card-race.service.ts` |
| Endpoints under `/v1/games/pet-card-race` | `apps/api/src/games/pet-card-race/pet-card-race.controller.ts` |
| Live race screen, progress rail, hand, interpolation | `apps/mobile/src/games/PetCardRaceCard.tsx`, `petCardRace.ts` |
| Per-species pet figures | `apps/mobile/src/games/PetRacerFigure.tsx` |
| Server-owned in-progress state | `GameAttempt.progressState` (nullable JSON) |
