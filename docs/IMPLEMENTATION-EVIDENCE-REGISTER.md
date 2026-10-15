# Implementation evidence register

15 October 2026. Validation is against the working tree; no store release or native-device validation is claimed.

| Capability                     | Evidence                                                                                  | Verification / limits                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alpha home                     | apps/mobile/src/screens/FoundationHomeScreen.tsx; apps/mobile/src/buddy/home.ts           | Mobile TypeScript check passed; freshly started Metro served Android bundle containing the new home text. No emulator/device interaction test           |
| Six spaces / Buddy return      | Home screen local state and accessible tab buttons                                        | Compiled in fresh bundle; manual native navigation validation remains                                                                                   |
| Moon Dash retained             | apps/mobile/src/games/WhiteWolfMoonDashCard.tsx, whiteWolfMoonDash.ts; apps/api/src/games | 4 existing game logic tests passed. API-backed attempts and score submission not revalidated                                                            |
| Avatar foundation retained     | apps/mobile/src/scene; apps/api/src/avatars                                               | 3 avatar runtime and 8 Rive runtime tests passed. Native rendering unverified                                                                           |
| Honest notification status     | apps/mobile/src/foundation.test.ts                                                        | 1 existing test passed                                                                                                                                  |
| Account / settings integration | Home uses existing useAuth and onOpenSettings; apps/mobile/App.tsx unchanged              | Typechecked; full authenticated native path not exercised                                                                                               |
| Wellness preservation          | API catalogue/entitlements/feature flags and contracts unchanged                          | Source audit only; wellness content not present                                                                                                         |
| Backup                         | /workspace/.local/voxora/before-master-blueprint.tar                                      | git archive of clean baseline ba7c44091b237b2a2dae486697e15d772a04bdff; archive listing verified old home present. Source backup, not a database backup |
| Requirements / migration       | docs/VOXORA-MASTER-SPECIFICATION.md and blueprint/*.txt                                   | Both uploaded requirement files retained verbatim; target package map reconciled with actual stack                                                      |

Commands executed: pinned pnpm 10.33.3 mobile typecheck (pass); mobile test (4 files, 16 tests passed); fresh Expo Metro on port 8082 and full Android JavaScript bundle request (HTTP success, new home content confirmed); git diff --check (pass). Prettier applied to changed TypeScript and Markdown files.

Known environment limitation from onboarding: binaries.prisma.sh engine downloads were denied by the network proxy. API build, migrations, end-to-end suite and readiness remain unverified. This change does not modify backend code or database schema. AI conversation, memory, voice, calendar connections, creative generation and offline sync remain requirements, not functioning features.

## Module 22 update — 15 October 2026

Career Agent specification added at docs/CAREER-AGENT-SPECIFICATION.md and linked from the Master Specification. Product and migration registers updated. Original request preserved byte-for-byte at docs/blueprint/career-agent-request.txt (cmp passed). The mobile Work description identifies planned career features and explicitly states that accounts are not connected and applications are not submitted. Mobile typecheck and git diff --check passed. No career service, persistence, OAuth, search or submission was implemented or exercised; platform-policy statements in the uploaded request were not independently verified.

## Money Maker and Everything Buddy — 15 October 2026

Added Modules 41–48 and 23–40 specifications, original request files, integration handoff and a credential-free CI workflow. Implemented fixed-endpoint GET-only Alpaca paper-account check, readiness CLI, UTF-8 TXT/VTT/SRT transcript import with original-byte SHA-256, and structural minutes evidence review.

Validation: `node --test scripts/integrations/*.test.mjs scripts/meetings/*.test.mjs` passed all 19 tests after formatting. Tests use injected/mock broker responses, not a real broker. CLI smoke import of a synthetic VTT preserved its source sentence; reviewing the resulting empty minutes template correctly exited 1 and identified missing metadata/attendance. `node scripts/integration-readiness.mjs --probe` correctly exited 1 with missing credential names, without making an authenticated broker request. `git diff --check` passed.

No real Teams/Graph, OAuth, transcription, AI summarisation, application/email sending, live brokerage or market data connection was validated. CI configuration is saved locally but has not run on GitHub. All changes remain uncommitted/unpushed in the working tree; a laptop GitHub checkout will not contain them until publication. No production or end-to-end meeting-demo readiness is claimed.

## Personality & Presence update — 15 October 2026

Original attachment preserved byte-for-byte (cmp passed); owner’s Freedom of Conversation rule copied into the core specification and shared policy metadata. Added strict CommunicationAgreementSchema and tests for valid preferences, invalid values, and rejection of attempted client age/access/safety overrides. Mobile home rule label updated. Contracts tests: 10 passed (3 new, 7 existing). Contracts build, mobile typecheck and git diff --check passed. These checks validate configuration boundaries, not live model behaviour. No personality persistence, model integration, voice presence or shared-room service was added or validated.

## Video-reference arcade update — 15 October 2026

Inspected eight sampled frames from each of five uploaded videos using ffmpeg contact sheets; identified card matching, marble drop, bowling, five-dice scoring and target-ball gameplay. Added Moon Dice engine, native component and five tests; integrated into existing Play before Moon Dash. Mobile typecheck passed after correcting a strict array-access issue; all 21 mobile tests passed (5 new, 16 existing). A fresh Metro instance served the Android bundle successfully; bundle content checked for Moon Dice. No Android device/emulator interaction, visual rendering, persistent progress, multiplayer or reward-server verification was performed.

## Account-backed Alpha preferences — 15 October 2026

Implemented GET/PUT/DELETE /v1/settings/communication under JWT authentication, using only the authenticated user ID. Added a nullable JSONB profile column and additive migration, strict shared input validation/defaults, mobile load/edit/save/reset UI, and home display of saved preferences. Reset clears stored values, restores defaults and is idempotent. No model, voice, permission grants or conversation memory is enabled by saving style preferences.

Prisma engine access now succeeds. Generated client, applied all seven migrations to separate local development/test databases, and built the workspace successfully. Full workspace typecheck and API lint passed. All 27 API end-to-end tests passed, including a new test proving persisted reload, unauthenticated rejection, malicious userId/out-of-range rejection, reset, and isolation between two accounts. Initial suite setup failed without JWT environment values and with wrong delivery settings; reran with CI-equivalent test configuration. New test was isolated into its own file to preserve existing registration rate-limit test assumptions. Workspace unit tests passed (49 tests across six packages). Windows/device rendering remains unverified; see WINDOWS-DEVELOPMENT.md.

Fresh Metro Android bundle includes the preferences editor; HTTP bundle request succeeded. Running API GET /v1/health/ready returned ready with database and redis up. No emulator/device interaction was performed.
