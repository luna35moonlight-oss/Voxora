# Voxora: Alpha’s home

Version 1.0 · 15 October 2026 · Product direction authorised by the owner’s Master Blueprint request.

**Your Voice. Your Avatar. Your Companion. Your World. All in One.**

Voxora is an independent downloadable companion application, Android first, then iOS and desktop, with a web companion. Alpha is its central intelligence; Alpha Bondfire is the conversation space. A Buddy is a personalised AI identity, distinct from optional avatar and pet layers. White Wolf remains the signature pet; Vixi remains an optional character. Wellness, health and games are retained product pillars.

## Source of truth and migration scope

The supplied [capability requirements](blueprint/memory-and-capabilities.txt) and [navigation and delivery requirements](blueprint/navigation-and-delivery.txt) are preserved verbatim. They are requirements, not implementation evidence. This specification reconciles them with commit `ba7c44091b237b2a2dae486697e15d772a04bdff`. This request authorises the new direction over the previous phase ordering, but does not authorise pretending later systems exist.

The current repository is React Native/Expo + TypeScript, NestJS (Express adapter), PostgreSQL/Prisma, Redis/BullMQ and pnpm shared packages. No Vite web app, standalone Express/Drizzle application, desktop app or previous three-year conversation archive is present. Keep the working stack; switching ORM is a separate evidence-backed migration. Preserve accounts, permissions, audit, schema, migrations, contracts and game dependencies. No account or database data is deleted by this change.

The previous technical showcase home is replaced. Avatar previews, subscription catalogue and infrastructure diagnostics leave the default home. Their source remains recoverable and available for careful later migration. This implements “remove everything” at the product-home level, consistently with the accompanying requirement not to destroy working code. Existing wellness is entitlement scaffolding only; `/health` is API operational health, not a medical feature. No exercise programmes or body-map implementation was found.

## Experience

Six spaces: Buddy, Work, Create, Play, Plan and My World. Buddy is the default and is reachable from every space. Prioritise conversations, projects, files, coding and daily work. Avatar and pet overlays are optional. Current navigation changes the selected space, Play retains Moon Dash, and settings/sign-out retain real account actions. Proposed tools display availability honestly rather than fake send/save/generate buttons.

Alpha defaults: name Alpha; humour 70%; independent judgement 85%; balanced conversation; warm expressive voice preference. These are design defaults, not model parameters or a connected voice. Required behaviour: truthful, non-mirroring, privacy-aware, helpful, respectfully challenging errors; consistent user-editable identity, language and style; sensitive responses without claiming human feelings. Distinguish facts, estimates, opinions and unavailable information. Initiative must be permission-scoped and nonintrusive.

## Brain, memory and permissions

Use provider-neutral model adapters and a capability router for conversation, coding, research, images, video, voice and supported local inference. Select providers by capability, consent, latency, cost and availability; never silently send private workspace data to an unapproved provider. Display live retrieval/offline/no-live-data status and retain source dates where relevant. No AI provider is currently connected.

Memory classes: identity, user-approved personal context, projects, relevant conversation summaries/search and an encrypted private vault. Work and personal namespaces remain separate, scoped by authenticated owner. Never turn every conversation into permanent memory. Future records require provenance, consent, namespace, timestamps, retention policy and correction/deletion history. Retrieval must enforce ownership before ranking, including semantic search. Users must view, correct, export, delete and disable memory; disabling prevents new collection, and deletion removes retrieval entries and propagates through sync. Define backup expiry and disclose it. Sensitive vault keys and connector credentials never enter prompts or ordinary memory. Implement and test those controls before enabling collection. No persistent memory is implemented by this home redesign.

External actions (send, share, delete, pay, publish) require scoped permissions, an appropriate confirmation showing the action and destination, and a verifiable execution result. Do not confuse a draft with a sent message. Import only supplied/accessible history and licensed assets; do not claim transfer of ChatGPT weights, hidden instructions or private memory.

## Capabilities and release acceptance

- Conversation: streaming text, attachments, editing/search/history; live speech with VAD, turn-taking, interruptions and optional transcripts; multilingual communication and Talk While Working. Wake phrases remain a platform-dependent exploration. Require consent, visible microphone indicators and interruption tests.
- Work/Plan: files, projects, coding, research, minutes plus separate decisions/actions, documents/spreadsheets/presentations, approved communication, calendar adapters (Google, Outlook, Apple/device), tasks, reminders and Morning Brief. Verify actual access and OS background delivery; never imply these are connected today.
- Create: separate preserve-original, transform and animate workflows; originals remain intact, outputs are versioned, previews distinguish source/output, undo/masks and identity constraints are explicit. Avatar/Voice/Video Studio support licensed voices/media, consent and transparent exports. Validate identity preservation rather than promising precision the provider cannot deliver.
- Play: retain Moon Dash server attempts and scoring. Future RPS has the supplied 10 attempts per UTC day requirement; Wheel probabilities/economy need approval. Pet Arena, Bondfire Adventures, Trivia, Code Quest, Mystery Files, Word Duel, Moon Match, Wolf & Phoenix, Build-a-World and engine-enforced Buddy Chess remain proposed. PLATI has undefined mechanics. Require fair non-paying progression, anti-cheat and appropriate age controls.
- Pets: White Wolf Pup and Baby Phoenix, species/growth/care/training/mood/exploration, optional overlays and offline persistence. Current avatar/Rive foundation is not a living-pet engine.
- My World: preserve wellness trial scaffolding without starting a trial; future exercise programmes, body maps, routines, tracking and goals require a detailed health specification. No invented diagnosis or medical capability.
- Learning and skills: age-appropriate tutoring, language practice, references, learner/educator modes and guardian controls. Buddy Skills share one identity and scoped memory. Radar, camera assistance, automations, Build Lab, travel, Teams and Guardian remain proposals.

Offline target: selected local conversations, approved local memories, notes/files, reminders, pet state and supported games. Cloud research/media/sync remain online. Current Moon Dash UI has local game logic but server-authorised attempts and submission; it is not a complete offline game. No installed on-device model or offline sync exists.

## Target repository map

Create modules only when there is working implementation to own. Do not mechanically move files or create empty packages.

| Target                                                    | Current source / migration                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| apps/mobile                                               | Existing Expo app; retain native entry and navigation                          |
| apps/api                                                  | Existing NestJS API; retain modules and Prisma migrations                      |
| apps/web, desktop, admin                                  | Absent; create only with a validated delivery slice                            |
| packages/contracts                                        | Existing Zod contracts; extend additively                                      |
| packages/ui                                               | Current packages/design-system; retain imports until deliberate migration      |
| packages/database                                         | Current apps/api/prisma; no move until generation and migrations are validated |
| packages/game-engine, rewards                             | Mobile games and API games; retain server authority                            |
| packages/avatars, pet-engine                              | Mobile scene and API avatars are foundation; pets absent                       |
| packages/permissions                                      | API auth/RBAC/audit are current source; future tool scopes separate            |
| ai-core, model-router, personality, memory, buddy         | New capability domains; only static buddy home defaults exist now              |
| voice, media-studio, calendar, integrations               | Provider boundaries planned; no connected implementation                       |
| learning, wellness, work-assistant, offline-sync          | Future domains; preserve wellness entitlement references                       |
| workers/media-generation, notifications, background-tasks | Existing API jobs foundation; dedicated workers absent                         |
| tests, docs, conductor                                    | Existing colocated tests and conductor retained; new docs reconcile direction  |

## Delivery order

0. Preserve/audit (source archive outside checkout, baseline SHA, registers).
1. Independent brain: accounts reuse, personality settings, model router, real text dialogue, permission management and consent-controlled memory with export/delete tests.
2. Live voice: streaming, interruptions, transcripts and background limits.
3. Android development/release builds, local data and tested sync; iOS follows validated platform prerequisites.
4. Work/life tools with permission and action execution evidence.
5. Creative engines with reversible originals and consent.
6. Pets/arcade expansion; retain current Moon Dash throughout.
7. Security, accessibility, performance, age-appropriate access, billing, backups, closed testing and store submission.

Launch needs privacy policy, terms, deletion/export/support, reporting, consent-based OS permissions, signing, crash/performance monitoring and recovery tests. Digital goods must use applicable store rules; PayFast is not assumed universally suitable. Preserve voxora.co.za branding and existing legal notices. Start with useful free functionality; expensive creative services need a transparent usage model.

Track actual completion in the [feature register](PRODUCT-FEATURE-REGISTER.md), [evidence register](IMPLEMENTATION-EVIDENCE-REGISTER.md) and [migration register](DECISION-MIGRATION-REGISTER.md). No store, AI, delivery, sync or health claim is complete without relevant tests and operational evidence.

## Module 22 — Career Agent

[Career Agent](CAREER-AGENT-SPECIFICATION.md) is a core Work capability: job discovery, evidence-based matching, factual CV tailoring, screening drafts, authorised submissions, Gmail alerts, recruiter relationships, interview preparation and career growth for every occupation. Settings include ZAR monthly salary, roles, location/work mode, frequency and prepare-only/individual-review/defined-batch permissions. Submission requires approval of the exact package and a supported channel, with verified outcomes and duplicate prevention. Planned targets include Gmail, LinkedIn, PNet, Indeed, CareerJunction, Job Mail and permitted company/ATS portals. No integrations are connected. The specification is defined; implementation and deployment remain pending. Delivery maps to the brain/document/permission foundations and Phase 4 Work tools, with voice interviews dependent on Phase 2.

## Modules 41–48 — Money Maker

[Money Maker](MONEY-MAKER-SPECIFICATION.md) adds Trading Agent, Freelance Income, Digital Products, Content Business, Business Launch, Opportunity Radar, Online Selling and Financial Growth. Capital preservation, realistic evidence and scoped user approval govern all actions. The first executable slice is a read-only Alpaca paper-account check, not a trading engine. See [Integration Handoff](INTEGRATION-HANDOFF.md) for commands, tests and unresolved provider prerequisites. Research/simulation precede any eligible, individually approved live trading; leveraged/speculative execution and autonomous investment management are excluded initially.

## Modules 23–40 — Everything Buddy ecosystem

[Meeting and Ecosystem Specification](MEETING-AND-ECOSYSTEM-SPECIFICATION.md) maps all 18 modules to implementation/dependencies, defines Professional Mode and shared Activity/Action/Context engines, and records Release 1 priorities. The first demonstration target is source-backed meeting minutes, action tracking and an approved follow-up email. Current executable scope is UTF-8 TXT/VTT/SRT import and structural evidence review, not transcription, AI minutes, Teams connection or email sending.

## Alpha Personality & Presence — core priority

[Personality & Presence Specification](ALPHA-PERSONALITY-PRESENCE-SPECIFICATION.md) defines one stable identity, editable communication preferences, Chat/Work isolation, private Buddy Rooms and authorised animated voice presence. Freedom of Conversation permits open adult discussion without an arbitrary topic blacklist while distinguishing harmful actionable assistance and preserving legitimate safety, consent, legal and platform obligations. Professional Mode applies the 7Cs and audience-appropriate presentation without replacing identity or forbidding subjects. Shared personality metadata and a validated preference contract exist; live AI behaviour and persistence are not implemented.

## Video-referenced arcade direction

[Arcade reference and delivery](ARCADE-REFERENCE-AND-DELIVERY.md) maps the five supplied gameplay clips to original Voxora game concepts. Moon Dice is the first playable local practice slice, alongside preserved Moon Dash. Colour cards, bowling, target-roll and marble-drop remain scoped follow-up games; online rooms, persistence and reward economies are not implied.
