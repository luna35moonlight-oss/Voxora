# Voxora Domain Model — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Principle:** Separate catalogue templates from user-owned instances. Server authority for durable state.

---

## 1. Core product concepts

| Concept | Meaning |
|---------|---------|
| Voxora | Independent digital home application |
| Alpha | Single platform intelligence |
| Alpha Bondfire | Intentional conversational environment with Alpha |
| Pet | Persistent living species-based companion (not an image) |
| Avatar | Layered living character (not a profile photo) |
| Connection | Real OAuth + capability verification success |
| Battle | Server-authoritative game process |
| Reminder | Real scheduled notification mechanism |
| Sent | Confirmed by Voxora/provider success only |

---

## 2. Bounded contexts (logical)

1. Identity & Access  
2. Profile & Privacy  
3. Commercial (Products, Subscriptions, Entitlements, Packages)  
4. Alpha & Memory  
5. Bondfire  
6. Avatar & Cosmetics  
7. Pet (Species, Ownership, Training, Equipment)  
8. Scene & Interaction Runtime (client + metadata)  
9. Voice  
10. Games  
11. Battles & Rewards  
12. Notifications & Reminders  
13. Providers (Mail, Calendar, Contacts, future messaging)  
14. Files & Workspaces  
15. Wellness (boundary only until detailed spec arrives)  
16. Admin, Audit, Support, Feature Flags  

---

## 3. Key aggregates (conceptual)

### Identity
- `User` — account root  
- `AuthIdentity` — password/idp links  
- `Session` / refresh family  
- `VerificationRecord` — email/phone tokens (hashed, expiry, single-use)  
- `ConsentRecord` — versioned legal acceptances  
- `RoleAssignment` — User/Support/Moderator/Admin/Owner/Service Account  

### Profile
- `Profile` — username, locale, timezone, currency, visibility flags  
- Privacy defaults: email/phone **Private**

### Commercial
- `Product` / `PriceVersion` — server-configurable, currency-aware  
- `Subscription` — level, status, period  
- `EntitlementGrant` — computed + explicit grants  
- `PackageOwnership` — avatar/pet packages (rules TBD by owner)

### Avatar
- `AvatarSpeciesOrBase` / catalogue template  
- `AvatarInstance` (user-owned or selected)  
- `AvatarInventoryItem`  
- `AvatarEquipment` (slots)  
- Animation definitions (metadata)

### Pet
- `PetSpecies` — rig family, movement, sounds, growth, skills  
- `PetCatalogueTemplate` — e.g. brown-and-white pit bull  
- `PetInstance` — user-owned living pet  
- Inventory, equipment, skills, training, progression  

### Alpha
- `AlphaSession` / request  
- `ToolInvocation` with permission checks  
- `MemoryItem` user-controllable  

### Bondfire
- `BondfireThread`  
- `BondfireMessage`  
- `QuotaLedger` / usage counters (reset rules TBD)

### Games & Battles
- `GameDefinition`  
- `GameSession` / `GameResult` (server validated)  
- `Battle` + `BattleEvent` log  
- `RewardLedgerEntry`

### Providers
- `ProviderConnection` (state machine)  
- `ProviderCapability`  
- External references for calendar/mail objects  

### Comms / Ops
- `Reminder`, `NotificationRequest`  
- `AuditEvent`  
- `FeatureFlag`

---

## 4. Pet data levels (mandatory distinction)

| Level | Example | Owns |
|-------|---------|------|
| Species | Dog | Rig family, movement, animation set, compatibility rules |
| Catalogue template | Brown-and-white pit bull | Default cosmetics, rarity tier, package linkage |
| User-owned instance | “Nimbus” belonging to user X | Name, growth, XP, bond, equipment, battle stats |

A horse cannot reuse dog movement solely because both are pets.

---

## 5. Entitlement capabilities (initial catalogue)

Proposed keys (server-evaluated):

- `avatar.basic` / `avatar.elite` / `avatar.legendary`
- `pet.basic` / `pet.elite` / `pet.legendary`
- `pet.training` / `pet.battle`
- `games.access`
- `bondfire.access` / `bondfire.messageQuota`
- `wellness.access`
- `voice.access`
- `mail.read` / `mail.write`
- `calendar.read` / `calendar.write`
- `contacts.read`
- `files.access` / `workspace.access`

Evaluation inputs: subscription, trial, add-on, package ownership, promotion, expiry, admin grant, feature flag availability.

**Do not** scatter `if level === 4` in UI code.

---

## 6. Subscription levels (product-defined; prices server-returned)

| Level | Price (spec) | Highlights |
|-------|--------------|------------|
| 1 | R15 / month | Basic avatar catalogue; one Basic pet; email+phone compulsory; 4 Bondfire messages/quota period |
| 2 | R25 / month | Basic + eligible Elite avatars/pets; verified email+phone; 100 Bondfire messages |
| 3 | R99 / month | + eligible Legendary avatars; 200 Bondfire messages; Wellness 1-week trial then entitlement required |
| 4 | R125 / month | Access to all primary areas subject to packages/add-ons/legal/provider limits |

Exact commercial edge cases → `open-questions.md`.

---

## 7. Onboarding domain steps (resumable)

1. Account (email/password; real IdPs only when integrated)  
2. Email verification (hashed, expiring, single-use, throttled)  
3. Unique username (server check)  
4. Privacy defaults Private  
5. Region / locale / timezone / display currency  
6. Contact number + real OTP for paid tiers  
7. App interests = **intent**, not Connected  
8. Real provider authorisation → Connected only after capability verification  
9. Age gate 18+ for initial public launch  
10. Versioned legal consents  
11. Subscription selection (prices from server)  
12. Avatar + pet selection under entitlements (preview locked content; cannot equip/activate locked)

---

## 8. Presence (lightweight, non-surveillance)

Possible states: Active, Idle, Away, Returned, Speaking, Listening, In Bondfire, In Game, In Battle.

Used to coordinate Interaction Runtime — not for invasive tracking productisation.

---

## 9. Wellness boundary (Phase 0)

Wellness is first-class and uses **the same Alpha**, with stricter privacy and entitlement gates.  
No separate Wellness bot.  
No invented medical diagnosis.  
Detailed content/crisis behaviour awaits separate owner specification.

---

## 10. Anti-patterns forbidden by domain rules

- Multiple disconnected Alpha assistants  
- Flattened avatar images per outfit combo as sole model  
- Client-authoritative battle damage  
- Fake provider Connected states  
- Entitlement checks only in UI labels  
- Public-by-default PII
