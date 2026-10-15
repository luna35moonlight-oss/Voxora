# Modules 23–40: Everything Buddy ecosystem

15 October 2026 · Requirements reconciled with current source. The [original request](blueprint/everything-buddy-request.txt) is preserved verbatim. No Teams, Microsoft Graph, Google or messaging connection is active.

## First demonstration target

Upload a consented Teams recording or transcript; preserve the original; transcribe supported languages with uncertainty marked; prepare professional minutes with source references; update a reviewed action register; prepare the follow-up email; obtain approval before sending; verify the outcome. This is the acceptance target, not a claim of current functionality.

Three meeting inputs: authorised post-meeting retrieval, direct upload and technically permitted live assistance. Direct upload must remain usable when an organisation refuses third-party Microsoft access. Platform permissions, tenant/admin policies, meeting type and recording/transcript availability govern retrieval. Microsoft Graph subscription and transcript capabilities in the supplied request need current official documentation review before implementation. ChatGPT-connected apps do not supply Voxora with its own OAuth registration or permissions.

## Module map

| Module                     | Requirements                                                                             | Current state and dependency                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23 Meeting Assistant       | Teams/Zoom/Meet/upload, transcription, evidence-based minutes, actions, approval/archive | Local TXT/VTT/SRT import and structural evidence review implemented; no recording transcription, AI summary, service persistence or Graph retrieval |
| 24 Professional Standards  | Clear, Concise, Concrete, Correct, Coherent, Complete, Courteous                         | Source-quote/missing-field checks only; full 7C quality/semantic validation remains unimplemented                                                   |
| 25 Microsoft 365 Hub       | Teams, Outlook, Office documents, OneDrive, SharePoint, To Do, Planner                   | Requires Voxora OAuth app, least-privilege scopes, tenant consent and adapters                                                                      |
| 26 Google Workspace Hub    | Gmail, Calendar, Drive, Docs, Sheets, Slides, Meet, Tasks                                | OAuth lifecycle, scoped adapters and contract tests absent                                                                                          |
| 27 Apple & Device Hub      | Calendar, reminders, files, photos and supported iCloud/device workflows                 | Native permissions and platform-specific implementations absent                                                                                     |
| 28 Communication Hub       | Permitted WhatsApp Business, Slack, Discord, Telegram and email                          | Draft/read/send capabilities must be separately authorised; no adapters                                                                             |
| 29 Storage & Knowledge Hub | Drive, OneDrive, Dropbox, Box, local files, GitHub, company sources                      | Requires owner-scoped file storage/retrieval/version references; local CLI import is not a cloud file service                                       |
| 30 Universal Task Hub      | To Do, Planner, Trello, Asana, Notion, ClickUp, Jira, native tasks                       | Canonical task IDs, conflict policy, idempotency, permissions and sync absent                                                                       |
| 31 File Brain              | Talk to Your Files, source-backed reconciliation and Project Memory Folder               | Narrow transcript importer only; universal upload/render/edit pipeline absent                                                                       |
| 32 Screen Companion        | Consented screen context and approved supported actions                                  | Screen-sharing permissions and action engine absent                                                                                                 |
| 33 Relationship/Contacts   | Approved birthdays, commitments, contact/follow-up history                               | Consent-controlled memory absent; no background monitoring                                                                                          |
| 34 Life & Money            | Budgets, bills, subscriptions, savings and reminders                                     | Share domain with Module 48; no duplicate ledger or connected banking                                                                               |
| 35 Home & Family           | Shopping, maintenance, shared chores/calendars, optional smart home                      | Shared-space permission model and provider adapters absent                                                                                          |
| 36 Learning & Career       | Education, vocational skills, qualifications and Career Agent                            | Reuse Module 22; no learning implementation                                                                                                         |
| 37 Safety Guardian         | Scam/link/correspondence checks, privacy checks and emergency shortcuts                  | Proposed; do not claim emergency-service coverage or guaranteed detection                                                                           |
| 38 Entertainment Studio    | Music, fiction, karaoke, podcasts and existing studio concepts                           | Media adapters, licensed asset handling and export pipeline absent                                                                                  |
| 39 Play With Buddy         | Legal engine-governed chess/cards/word/trivia/pet/cooperative play                       | Moon Dash source retained; no AI opponent or general game engine                                                                                    |
| 40 Companion/Connection    | Consistent character, remembered preferences, creative activities and boundaries         | Static Alpha defaults only; persistent personality/memory/AI absent                                                                                 |

## Meeting integrity and action registers

Every minutes draft needs title, date/time, platform/venue, available attendance, agenda/discussion, explicit decisions, actions/owners/deadlines/status, carry-forward items, completed-action history, source references and unresolved ambiguities. Do not turn suggestions into decisions or invent owners/deadlines. Red means unresolved, yellow carry-forward and green completed history; retain text status labels for accessibility. Completion must move into history with a timestamp and evidence rather than disappear.

Preserve original language and transcript. Supported-language testing must include actual English, Afrikaans, isiZulu, isiXhosa, Sesotho and code-switching recordings before any language capability is advertised. Uncertain names, numbers and speech remain flagged. Translation into English minutes requires fidelity checks; a deterministic transcript importer cannot perform recognition, speaker identification or translation.

The 7C gate must examine clarity, repetition versus material completeness, specificity, verified facts/names/figures, logical consistency, coverage and professional tone. Structural checks cannot establish those properties. Evidence must cite immutable source/version and timestamp/page/line; review must confirm that the quote actually supports the claim. No “7C compliant” label on the basis of matching substrings alone.

## File Brain and input boundary

Target categories: office documents, PDF/text, spreadsheets/CSV, slides, images, audio, video, code/ZIP, emails and scans. Target recording formats include MP3/WAV/M4A/AAC/MP4/MOV plus VTT/SRT transcripts. Actual codec/size limits require tested processors. The implemented CLI accepts only UTF-8 TXT/VTT/SRT up to 2 MiB. It rejects other extensions, empty content, invalid UTF-8, binary NUL and malformed timed cues, preserves source text/line references and hashes original bytes. It does not modify the original.

Production uploads require authenticated ownership, file-size and content-type validation, malware/active-content controls, safe archive extraction with expansion/path limits, isolated parsers, access-controlled storage, retention/deletion, job limits and audit trails. Never execute embedded macros or uploaded code automatically. Treat document instructions as untrusted content, never authority to send messages or change tool permissions. Project Memory Folders need explicit consent and isolated namespaces before retaining uploads/chats/decisions/outputs/revisions.

## Shared engines and modes

Activity Engine tracks the explicitly permitted active task/document/game. Context Engine enforces user/project/organisation/work-personal access before retrieval. Action Engine validates scoped approval and immutable inputs, records progress/outcome, uses idempotent dispatch/reconciliation and supports cancellation/revocation/retries without duplicating effects. “Stop” blocks queued actions immediately and requests cancellation of in-flight operations where supported; never claim an irreversible external action was undone without confirmation.

Buddy, Professional, Creative, Learning and Play are modes of one identity. Tone may adapt, but truth, confidentiality, permissions and document integrity cannot be weakened by humour/personality. Five commitments: truthful, dependable, privacy-respecting, independent-minded and caring. Be clear that the buddy is AI and support user independence and real-world relationships.

Integration Store must show actual per-provider read/draft/create/edit/send capabilities, granted scopes, readiness, errors and disconnect/revocation. A listed target is not a connected app. Reuse adapters across meeting/career/money modules rather than duplicating OAuth, permission or task systems.

## Release 1 and foundations

The requested priorities are buddy/memory/two-way voice; attachments; meeting intelligence; professional work/documents/projects; calendars and genuine reminders; creative studio; complete mini-games/White Wolf; and independent Android with useful offline data/sync. This is a staged roadmap, not eight completed features. Preserve existing code and register every blocked requirement.

Account security, encryption, user-controlled memory, work/personal isolation, offline conflict handling, backups/recovery, notifications when the app is closed, accessible controls/captions, usage costs, cross-device continuity and organisation admin/retention are release gates. Design workplace recordings, recruitment and employee data with POPIA-aware information governance; require recording consent and age-appropriate controls. Verify those properties with tests and operational evidence.

## Executable local slice

From the repository root with Node >=22.13:

```sh
node --test scripts/meetings/*.test.mjs
node scripts/meeting-import.mjs /path/to/meeting.vtt > /path/to/private-review.json
# Populate the minutes fields and exact segmentId/quote evidence in the private JSON.
node scripts/meeting-review.mjs /path/to/private-review.json
```

The importer outputs original source segments, SHA-256 and an empty draft template. It does not infer minutes. The reviewer flags missing metadata/owners/deadlines and absent or mismatched quotes. Even a passing structural check returns `human_review_required`; it never finalises, updates a persistent action register or sends email. Keep private JSON outside the repository and protect it with local file permissions.

Next implementation dependencies: secure upload/persistence, model/transcription providers, complete 7C review, action register, follow-up draft generation, OAuth and verified sending. Each needs focused integration and failure tests before the demonstration target is described as complete.
