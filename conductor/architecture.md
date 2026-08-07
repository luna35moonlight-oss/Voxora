# Voxora Architecture — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Product:** Voxora — independent Android & iOS application  
**Tagline:** Your Voice. Your Avatar. Your Companion. Your World. All in One.

---

## 1. Architectural intent

Voxora is the user’s digital home.

- **Voxora** = the independent installed application
- **Alpha** = the single intelligence inside Voxora
- **Alpha Bondfire** = the intentional conversational environment where the user meets Alpha

External providers supply technology (AI models, mail, calendar, payments, push). They do **not** become the product surface. Users must not open ChatGPT, Claude, Copilot, or another consumer AI app to use Alpha.

---

## 2. Recommended system shape

### 2.1 High-level topology

```text
┌────────────────────────────────────────────────────────────┐
│                 Voxora Mobile App (Android / iOS)          │
│  Expo React Native + TypeScript                            │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Home UI  │ │ Bondfire   │ │ Games /  │ │ Integrations│  │
│  │ Onboarding│ │ Wellness   │ │ Battles  │ │ Settings    │  │
│  └─────┬────┘ └─────┬──────┘ └────┬─────┘ └──────┬──────┘  │
│        │            │             │              │         │
│  ┌─────▼────────────▼─────────────▼──────────────▼──────┐  │
│  │         Client Domain Services / Stores               │  │
│  │  User · Entitlements · Avatar · Pet · Presence        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │ Interaction Runtime  │  Scene Engine (Rive-based)     │  │
│  └──────────────────────┬───────────────────────────────┘  │
│  Native bridges: mic, TTS/STT, secure store, push, files   │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTPS + WebSocket
┌──────────────────────────▼─────────────────────────────────┐
│                 Voxora API Platform (TypeScript)           │
│  Modular monolith (NestJS recommended)                     │
│  Auth · Entitlements · Alpha · Bondfire · Pets · Avatars   │
│  Battles · Games · Rewards · Providers · Notifications     │
│  Reminders · Memory · Files · Wellness · Admin · Audit     │
└───────┬──────────────┬──────────────┬──────────────┬───────┘
        │              │              │              │
   PostgreSQL        Redis         Object Store    Provider APIs
   (system of        (jobs,        (assets,        (AI, mail,
    record)           pub/sub,      media)          calendar,
                      sessions)                     payments, SMS)
```

### 2.2 Why modular monolith first

| Option | Verdict | Reason |
|--------|---------|--------|
| Many microservices from day 1 | Reject for Phase 1 | Operational complexity before product existence |
| Modular monolith with clear domain modules | **Recommend** | Matches pillar architecture; extract later if needed |
| Serverless-only | Reject as sole approach | Long-lived battles, websockets, jobs, and provider webhooks need durable process model |

---

## 3. Backend architecture answers (Phase 0 §101)

| Question | Recommendation | Owner review? |
|----------|----------------|---------------|
| Backend architecture | TypeScript modular monolith (NestJS) exposing versioned REST + WebSocket gateway | Yes — alternative: .NET given VS gitignore history |
| Required services (logical modules) | Auth, Users/Profiles, Products/Subscriptions/Entitlements, Alpha, Bondfire, Memory, Avatar, Pet, Scene assets, Interaction events, Games, Battles, Rewards, Providers, Calendar/Mail/Contacts adapters, Notifications, Reminders, Files/Workspaces, Wellness, Admin/RBAC, Audit, Feature Flags, Support (later) | No (structure); Yes for Wellness scope |
| Database | PostgreSQL 16+ as system of record | Yes if owner prefers managed alternative |
| ORM / data layer | Prisma or Drizzle; recommend **Prisma** for migrations + typed client initially | Yes |
| Migrations | Versioned SQL migrations via ORM migrate tool; no blind auto-sync in production | No |
| Background jobs | Redis + BullMQ (or equivalent) with retry, idempotency keys, dead-letter | No |
| Scheduled jobs | Same queue with cron producers (reminders, token refresh, cleanup, subscription reconcile) | No |
| Real-time events | WebSocket gateway + Redis pub/sub fan-out; server pushes Alpha tokens, battle ticks, notifications, presence | No |
| Provider webhooks | Dedicated verified ingress endpoints; signature validation; enqueue for async processing | No |
| Secrets | Cloud secret manager / env injected at runtime; never in client; never committed | No |
| Env separation | `development` / `staging` / `production` projects, DBs, keys, bundle IDs, callback URLs | No |

Supporting website (`voxora.co.za`) may later host marketing, support, docs, and admin — **not** the primary consumer product.

---

## 4. Central domain contracts

Authoritative server contracts (clients cache, never invent authority):

- User, Profile, Subscription, Entitlements
- Alpha, Bondfire, Memory
- Avatar, Pet, Scene, Reactions, Animation metadata
- Voice session coordination metadata
- Messaging, Notifications, Reminders
- Calendar, Mail, Contacts, Providers
- Games, Battles, Rewards, Files, Workspaces, Wellness

Clients own ephemeral presentation:

- Current animation
- Temporary VFX
- Local draft UI state
- Optimistic pending markers (must show Pending, never fake Sent)

---

## 5. Independent application constraint

| Forbidden | Required |
|-----------|----------|
| ChatGPT/Claude/Copilot extension | Installed Voxora app |
| Browser-only product as primary | Android + iOS primary |
| WebView wrapper around website as “the app” | Native shell with real permissions, push, secure storage, mic/camera |
| Separate Alpha bots per feature | One Alpha service with capability tools |

If web tech is used inside the app (e.g. Expo), Phase docs must keep native capability matrix honest — see `mobile-strategy.md`.

---

## 6. Cross-cutting runtime platforms

### 6.1 Interaction Runtime

Single coordinator for avatar/pet/Alpha/sound/effect responses to catalogue events. Components emit events; they do not each embed reaction logic. Details: `interaction-runtime.md`.

### 6.2 Scene Engine

Reusable layered renderer for avatar + pet + environment. Details: `scene-engine.md`.

### 6.3 Entitlement Engine

Server evaluates capabilities (`bondfire.messageQuota`, `pet.battle`, etc.). UI never trusts label text. Details: `entitlements.md`.

### 6.4 Reward Ledger

All progression rewards write immutable ledger entries with idempotency. Details: `pet-battle-system.md`, `game-system.md`.

### 6.5 Provider Adapter Layer

Uniform connection states and capability declarations. Details: `integrations.md`.

---

## 7. Data authority (summary)

| Concern | Authority |
|---------|-----------|
| Subscription / entitlements | Server + payment provider webhooks |
| Owned pet / level / equipment / battle result / rewards | Server |
| Avatar config | Server (local cache for display) |
| Provider connection state | Server after real OAuth + capability check |
| Current animation / temporary VFX | Client runtime |
| Memory contents | Server; user-controllable |

Full matrix: `domain-model.md` / `data-model.md`.

---

## 8. Real-time & background

**Real-time channels (examples):** Alpha streaming tokens; Bondfire updates; battle action results; reminder triggers; provider inbox events; presence; pet/avatar directed reaction cues.

**Background jobs (examples):** OAuth refresh; provider sync; reminder fan-out; media processing; AI long jobs; subscription reconciliation; cleanup; webhook retries.

A single provider failure must degrade only that capability.

---

## 9. Offline / poor connectivity

Cache: avatar, pet, wardrobe metadata, settings, drafts, recent safe state, selected assets.

Honest states only:

- Offline send → **Pending**
- Offline calendar write → **Waiting to sync**
- Never **Sent** / **Synced** without confirmation

---

## 10. Proposed monorepo layout (Phase 1+, not created in Phase 0)

```text
apps/
  mobile/                 # Expo React Native (Android + iOS)
  api/                    # NestJS modular monolith
  admin-web/              # later; not primary product
packages/
  shared-contracts/       # Zod/OpenAPI types, event IDs, entitlement keys
  scene-core/             # scene/interaction pure logic testable without UI
  design-tokens/          # colours, type, spacing
conductor/                # product & engineering docs (this folder)
infra/                    # later: IaC, pipelines
```

Phase 0 does **not** scaffold this tree into runnable code.

---

## 11. Blocking architectural risks

1. Character art pipeline (Rive/rigs) not yet defined by owner/art team.
2. App Store / Play billing model may force store-mediated subscriptions.
3. Some “unified communications” providers may lack official APIs for the desired behaviour.
4. Wellness crisis/safety content not yet supplied.
5. Commercial downgrade/ownership rules undefined.

---

## 12. What Phase 0 deliberately does not do

- Does not create production app code
- Does not create fake Connected/Verified UI
- Does not invent Wellness medical behaviour
- Does not invent battle balance numbers
- Does not begin Phase 1
