# Voxora Arcade: video reference and first playable slice

15 October 2026. User request: “I want to create games like this.” Five supplied clips were inspected through sampled frames across each recording, not a complete audio/transcript analysis. The attached [broader mobile instruction](blueprint/alpha-first-mobile-reference.txt) is retained as reference material, not treated as an instruction to execute the entire roadmap or release the app.

| Reference filename time     | Observed gameplay                                                    | Voxora direction                                                                                            |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 12.45.15 (about 38 seconds) | Marble/peg-drop board, reward progression and purchase screens       | Original physics-based moon-marble challenge; economy and paid progression need separate design, not copied |
| 12.45.07 (about 69 seconds) | Target-ball lane, scored rings, turn-taking and round totals         | Original lunar target-roll arcade with gesture-controlled shots                                             |
| 14.23.46 (about 28 seconds) | Ten-pin bowling lane, ball delivery, remaining pins and frame scores | Original bowling game with validated physics and scoring                                                    |
| 14.23.22 (about 44 seconds) | Five dice, held dice, rerolls, category scorecards and opponents     | Moon Dice: first implemented local practice game                                                            |
| 14.23.41 (about 86 seconds) | Colour/number card matching, draw effects, turns and hands           | Original colour-card game with explicit rules, not copied branding/art                                      |

The clips show short mobile rounds, visible outcomes, opponent identity and social presentation. Some frames show Plato branding. Earlier blueprint uncertainty about “PLATI” is clarified only to this extent: these supplied references visibly include Plato interfaces. Do not infer API access, asset licences or every game rule from sampled frames. Do not copy commercial assets, logos, animations or exact layouts.

## Implemented: Moon Dice

A React Native scorecard and rules engine live alongside existing Moon Dash. In Play, users can roll five dice up to three times, hold dice between rolls, and bank one unused category. Alpha takes a separate rules-based turn, keeps the most frequent face for rerolls, then selects the highest immediate available score. This is an ordinary local bot, not an AI model or human opponent. Both players complete 13 categories; upper totals of 63 receive 35 bonus points. Full house requires a three plus a pair; extra five-of-a-kind bonuses are excluded. Final totals determine winner/draw and unlock rematch. Zero-point sacrifices are legal.

No game-server calls, reward/currency issuance, purchases, paid randomness, network rooms or persistent progression were added. State is in memory and resets when the component unmounts/app closes; switching away from Play resets this practice game. Existing authentication/onboarding still guards the home, so this is not a claim of cold-start offline account access. Moon Dash and its server-authorised attempts remain unchanged. The new game's random sampling is casual local practice, not suitable for competitive rewards or anti-cheat claims.

## Next playable slices

1. Validate Moon Dice touch interaction, scorecard readability and responsiveness on Android; add explicit, owner-scoped local persistence and resume before claiming durable progress.
2. Build target-roll with a tested aiming/physics model, gesture input, trajectory/pin or ring resolution and accessible controls. Do not replace physics outcomes with random invented scores.
3. Build colour-card and bowling engines with complete rules tests before animations/social expansion.
4. Build marble physics as a skill/practice mode first; any reward economy or paid mechanics require separate approval and transparent rules.
5. Add invitation-based multiplayer only after backend room membership, turn authority, move validation, disconnect/rejoin, idempotency and cross-user privacy tests exist. Reuse current auth and future shared-room infrastructure; do not create duplicate reward ledgers.

Alpha commentary may describe engine-confirmed results, never choose winners outside the rules. Native rendering, animation polish and multiplayer are distinct acceptance gates; TypeScript and rules tests alone do not establish a polished mobile release.

## Files and evidence

- apps/mobile/src/games/moonDice.ts: scoring, turns, holds, bot and match lifecycle.
- apps/mobile/src/games/MoonDiceCard.tsx: playable local UI with explicit availability/persistence limits, labelled controls and result announcements.
- apps/mobile/src/games/moonDice.test.ts: pattern/bonus/hold/roll/duplicate-category tests and a complete 13-round match.
- Home screen mounts the new game in Play before the preserved Moon Dash card; space description reflects local versus server-backed play.

No uploaded videos were copied into application assets or committed to the product. Reference names and observations are sufficient for this design record. The broader attachment's Modules 76–87 remain reference requirements, not implemented capabilities or authorisation for unrelated phases/releases.
