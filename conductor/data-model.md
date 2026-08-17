# Voxora Data Model — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Database recommendation:** PostgreSQL  
**Principle:** Do not create one huge User table. Propose schemas; do not generate all tables blindly in Phase 0.

---

## 1. Modelling rules

1. UUID primary keys for public entities.  
2. `created_at` / `updated_at` timestamps (UTC).  
3. Soft-delete only where legally/product required; prefer explicit status enums.  
4. PII columns minimized; encryption at rest via platform; field-level encryption for highly sensitive tokens.  
5. Provider secrets/tokens stored server-side encrypted, never in mobile DB.  
6. Catalogue data separated from per-user instance data.  
7. Ledger tables append-only where money/rewards/audit matter.

---

## 2. Proposed entity groups (not auto-migrated yet)

### 2.1 Identity & access
- `users` — id, status, created_at, deleted_at  
- `auth_identities` — user_id, type (`password`|`oidc`), provider, subject, password_hash (argon2id),  
- `sessions` — user_id, refresh_token_hash, device, expires_at, revoked_at  
- `verification_records` — user_id, channel (`email`|`phone`), purpose, token_hash, expires_at, used_at, attempt_count  
- `consents` — user_id, consent_type, version, accepted_at, meta  
- `roles`, `role_assignments` — no client hard-coded owner email checks  

### 2.2 Profile & privacy
- `profiles` — user_id, username (unique), display fields, country, region, locale, timezone, display_currency  
- `privacy_settings` — show_email (default false), show_phone (default false), profile visibility  

### 2.3 Commercial
- `products` — code (`level_1`…), name, active  
- `product_prices` — product_id, currency, amount_minor, version, effective_from, effective_to  
- `subscriptions` — user_id, product_id, status, current_period_*, store (`apple`|`google`|`web_tbd`), external_ref  
- `entitlement_grants` — user_id, capability_key, source, limit_value, expires_at  
- `package_ownerships` — user_id, package_id, acquired_at, source  
- `store_transactions` — receipt validation audit  

### 2.4 Feature flags
- `feature_flags` — key, enabled, targeting rules JSON  
Distinct from entitlements.

### 2.5 Avatar
- `avatar_bases` — catalogue  
- `avatar_items` — slot, rarity, entitlement, package, asset_ref, compatibility  
- `user_avatars` — user_id, base_id, name, active  
- `avatar_inventory` — user_avatar_id / user_id, item_id  
- `avatar_equipment` — user_avatar_id, slot, item_id  
- `animation_definitions` — metadata for runtime  

### 2.6 Pets
- `pet_species` — code, rig_family, rules JSON  
- `pet_catalogue` — species_id, variant, entitlement tier, package  
- `pets` — owner_id, species_id, catalogue_id, name, growth_stage, level, xp, bond, energy, battle_stats JSON, last_interaction_at  
- `pet_inventory`, `pet_equipment`  
- `pet_skills`, `pet_training_progress`  
- `pet_achievements`  

### 2.7 Assets
- `assets` — asset_id, type, version, species/rig/growth/animation compatibility, storage locator, thumbnail, entitlement, package, performance_tier, fallback_asset_id, active  

### 2.8 Alpha / Bondfire / Memory
- `bondfire_threads` — user_id, title, mode (`standard`|`wellness`), created_at  
- `bondfire_messages` — thread_id, role, content_ref, token_usage, status  
- `bondfire_quota_usage` — user_id, period_start, period_end, count (reset rules TBD)  
- `alpha_tool_invocations` — request_id, tool, permission_snapshot, status, result_ref  
- `memory_items` — owner_id, category, content/ref, source, scope, retention, visibility, enabled, sensitivity  

### 2.9 Providers
- `provider_connections` — user_id, provider, state, scopes, capability_set, external_account_ref, created_at  
- `provider_tokens` — connection_id, encrypted refresh/access, expiry (restricted access table)  
- `calendar_refs`, `mail_refs` — provider object ids + sync cursors  

### 2.10 Notifications & reminders
- `reminders` — owner_id, content, trigger_at, timezone, recurrence, channels, source, status, deep_link  
- `notification_requests` — recipient, type, source, priority, content, channel, schedule, expiry, deep_link, dedupe_key, status  

### 2.11 Games / battles / rewards
- `game_definitions` — metadata contract fields (must support Moon Dash / RPS / Wheel differences — not score-only)  
- `game_sessions`, `game_results`  
- `play_limit_policies` / attempt counters — reusable UTC-day policies where appropriate (configurable per game; do not assume every game is 10/day)  
- attempt records carry a nullable server-owned `progressState` for multi-step games (Pet Card Race meets hold their deck, deal, hand, lanes, and rival schedule there). Never accepted from a client; never returned in full to a client  
- `battles` — players, pets, seed, start_stats, winner, status  
- `battle_events` — append-only action/damage/effect log  
- `reward_ledger` — tx id, user, pet?, source, source_event_id, reward_type, amount, reason, idempotency_key UNIQUE, status, audit  
- Reward types include (at least): progression points, Pet Skill-Up Shards, Voxora Coins, Voxora Diamonds, redeem-code references — **separate types**; Coins ≠ Diamonds  
- `currency_balances` / ledger postings for Coins and Diamonds (future; commercial rules OWNER DECISION REQUIRED)  
- `redeem_codes` — shared architecture for Moon Dash prizes, Wheel Avatar Skins, promotions (uniqueness, reward ref, issuance, optional expiry, eligible user, single-use, redemption timestamp, ownership grant, audit)  
- `achievements`, `user_achievements`  

Do not invent prices, exchange rates, Wheel probabilities, or RPS→skill conversion formulas in schema seeds.  

### 2.12 Files / workspaces
- `files` — owner_id, storage_key, mime, size, hash, visibility  
- `workspaces` — owner_id, title, members later  
- `workspace_files`  

### 2.13 Wellness (boundary)
- Tables deferred until Wellness specification arrives; likely private journals/settings with stricter ACL. No diagnosis fields invented.

### 2.14 Admin / support / audit
- `audit_events` — actor, action, subject, payload redacted, ip/device hash, created_at  
- `support_tickets` — readiness only; not fake-built in Phase 0  

---

## 3. Example pet instance fields

`pets` row supports:

- pet ID, owner ID, species, variant/breed, pet name  
- growth stage, level, XP, bond, energy  
- training summary, skills (distinct from XP / shards / game scores)  
- skill-up shard inventory / consumption hooks (future; economy deferred)  
- equipment, cosmetics, appearance refs  
- battle statistics, achievements, evolution markers  
- last interaction, timestamps  

Growth/evolution **server-authoritative**. Do not merge game score, reward points, XP, skill progression, shards, level, and bond into one generic field.

---

## 4. Indexing & isolation notes

- Unique indexes: `profiles.username`, active email identities, idempotency keys  
- Composite indexes: `(user_id, created_at)` on messages, notifications  
- Row access always filtered by authz layer (`owner_id` / membership)  
- Admin access audited  

---

## 5. Migration strategy

1. Introduce schema modules incrementally with vertical slices.  
2. Do **not** create every table on day one.  
3. Phase 1: identity, roles, audit, feature flags skeleton.  
4. Phase 2: products, subscriptions, entitlements, verification.  
5. Later phases add avatar/pet/bondfire/battle tables as slices land.

---

## 6. Data authority quick map

| Data | Writer of truth |
|------|-----------------|
| Password hash | Auth service |
| Subscription status | Billing reconcile job + store webhooks |
| Entitlements | Entitlement service |
| Pet XP/level | Progression service after validated events |
| Battle outcome | Battle engine |
| Reward balance changes | Reward ledger only |
| Equipped cosmetics display cache | Client cache of server equipment |
| Current animation | Client only |

---

## 7. Open schema decisions

See `open-questions.md` for package ownership after downgrade, quota period fields, Wellness tables, and marketplace (if any).
