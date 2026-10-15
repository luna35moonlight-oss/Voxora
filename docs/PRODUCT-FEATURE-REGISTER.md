# Product feature register

15 October 2026. “Source present” does not mean production validated.

| Capability                                            | State                                                              | Source / blocker                                                                                   | Release phase |
| ----------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------- |
| Alpha home / six spaces                               | Implemented navigation and honest availability descriptions        | apps/mobile/src/screens/FoundationHomeScreen.tsx                                                   | 0             |
| Alpha personality                                     | Static design defaults; not model behaviour or persisted settings  | apps/mobile/src/buddy/home.ts; provider/settings absent                                            | 1             |
| Accounts / RBAC / MFA / onboarding                    | Source retained                                                    | apps/api/src/auth, rbac, mfa, onboarding; API runtime blocked by Prisma download during onboarding | 1             |
| Memory / private vault / work-personal isolation      | Requirements only                                                  | No memory repository, API or retrieval engine                                                      | 1             |
| Alpha Bondfire chat / AI router                       | Planned                                                            | No provider or conversation API                                                                    | 1             |
| Voice / Talk While Working                            | Planned                                                            | No speech integration                                                                              | 2             |
| Native Android app                                    | Expo source present; native build unverified                       | apps/mobile; no device/build evidence                                                              | 3             |
| iOS / desktop / web / admin                           | iOS config only; other apps absent                                 | Signing/platform/delivery work pending                                                             | 3+            |
| Projects/files/research/coding/documents              | Planned                                                            | No work assistant                                                                                  | 4             |
| Calendar/tasks/Morning Brief                          | Planned                                                            | No calendar integration; notification architecture is descriptive                                  | 4             |
| Avatar Studio / Vixi / Rive                           | Foundation source retained; removed from default home              | mobile scene/components, API avatars; native Rive requires validation                              | 5             |
| Voice Studio / Video Studio / photo editing           | Planned                                                            | No generation/editing services                                                                     | 5             |
| White Wolf Moon Dash                                  | Existing playable slice retained in Play                           | mobile games + API games; server required                                                          | 6 (existing)  |
| Pets / Phoenix / Arena / other arcade                 | Planned                                                            | No complete pet engine; economy decisions pending                                                  | 6             |
| Wellness and health                                   | Entitlement/trial scaffolding retained; content absent             | API catalogue/entitlements, wellness flag; detailed content specification needed                   | 4+            |
| Rewards / Store / VIP                                 | Existing backend scaffolding retained; removed catalogue from home | API catalogue/store/entitlements; no production billing claim                                      | 7             |
| Learning / Skills / Radar / Guardian / Teams / travel | Proposed                                                           | No implementation                                                                                  | Future        |
| Offline conversations/memory/sync                     | Planned                                                            | Current game logic alone is not offline persistence                                                | 3             |

Full requirements, including individual game concepts, are retained in blueprint/*.txt. Update state, blocker, test reference and release history for every delivered slice. Current release history: Master Blueprint home replaces the Phase 3 technical showcase; no production release issued.

## Module 22 addition

| Capability                              | State                                                               | Source / blocker                                                                                                          | Release phase          |
| --------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Career Agent / My Job Hunter            | Specification defined; Work description updated; not built/deployed | CAREER-AGENT-SPECIFICATION.md; career profile, research, documents, OAuth, approval and submission infrastructure pending | 1 foundations / 4 Work |
| Career Growth / Recruiter Relationships | Planned within Career Agent                                         | Sourced recommendations, consent-scoped history and email/calendar integrations pending                                   | 4                      |

Release history: Module 22 added to the working blueprint on 15 October 2026; no career searches, connections or applications executed.

## Modules 41–48 addition

Money Maker requirements are mapped individually in MONEY-MAKER-SPECIFICATION.md. Module 41 has a read-only Alpaca paper-account adapter and diagnostic CLI, with mocked contract/failure tests. No provider connection has been verified and no trading is enabled. Modules 42–48 remain specified, with shared dependencies and release gates in INTEGRATION-HANDOFF.md. Release history: 15 October 2026, local integration slice added; no financial service deployed.

## Modules 23–40 addition

The per-module feature/status/dependency map lives in MEETING-AND-ECOSYSTEM-SPECIFICATION.md. Modules 23/24/31 have a narrow local transcript import and structural evidence-review slice; 7 deterministic tests cover source preservation and failure handling. The remaining hubs, modes and engines are requirements, not connected services. Release history: 15 October 2026, local CLI slice added; demonstration workflow remains incomplete.

## Alpha Personality & Presence priority update

Core specification: ALPHA-PERSONALITY-PRESENCE-SPECIFICATION.md. Shared conversation policy and bounded Communication Agreement contract added in packages/contracts/src/personality.ts, with schema-boundary tests. Home rule label reflects open discussion. Persistent preference learning, context isolation, private shared rooms and animated voice remain planned; provider behavioural evaluations are required before readiness claims.

## Arcade update — 15 October 2026

Moon Dice: local React Native game implemented in Play with five dice, holds, three-roll limit, 13-category scoring, rules-based Alpha turns, totals/winner and rematch. No persistence/network/rewards. Five new engine tests include a complete match. Five video references are mapped in ARCADE-REFERENCE-AND-DELIVERY.md. Other referenced game types and native visual polish remain pending.

## Implemented increment: account-backed Alpha preferences

Communication Agreement now has authenticated read/save/reset API, nullable profile persistence and a mobile editor under account settings. Home reads the saved name, humour and voice preference. Persisted values and cross-account isolation validated through API e2e. This supersedes the earlier “static defaults only” status for editable preferences, but does not implement live AI, voice, automatic preference learning or memory retrieval. See WINDOWS-DEVELOPMENT.md for laptop startup.
