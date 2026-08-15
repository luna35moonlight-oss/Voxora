# Voxora Entitlements — Phase 2 implementation notes

**Document status:** Phase 2 Entitlement Service implemented — OWNER REVIEW REQUIRED BEFORE PHASE 3  
**Rule:** Server is authoritative. Never determine access from UI text labels. Do not scatter `if level === 4`.

**Implementation:** `apps/api/src/entitlements/EntitlementsService` evaluates subscription/trial/admin sources against feature flags. Intent-only subscription selection does **not** grant Active paid access. Unknown capability = no access.

---

## 1. Feature flags vs entitlements

| Concept | Question answered |
|---------|-------------------|
| Feature flag | Is Voxora currently offering this feature? |
| Entitlement | May this user access the feature? |

Both must pass for access.

---

## 2. Central Entitlement Service

Inputs may include:

- active subscription  
- trial  
- add-on  
- package ownership  
- promotion  
- expiry  
- administrative grant  
- feature availability  

Outputs: capability grants + numeric limits (e.g. message quota).

---

## 3. Capability keys (initial)

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

---

## 4. Subscription mapping (from master spec)

| Level | Price | Notable grants |
|-------|-------|----------------|
| 1 | R15/mo | Basic avatars; one Basic pet; email+phone compulsory; Bondfire quota 4 |
| 2 | R25/mo | + eligible Elite avatars/pets; verified email+phone; Bondfire quota 100 |
| 3 | R99/mo | + eligible Legendary avatars; Bondfire quota 200; Wellness 1-week trial then requires Wellness entitlement |
| 4 | R125/mo | All primary areas subject to packages/add-ons/premium assets/legal/provider/future commercial rules |

Prices must be server-configurable, versioned, currency-aware, auditable.

---

## 5. Client usage pattern

1. App refreshes entitlement snapshot on launch/resume when online  
2. UI hides/disables with honest lock states  
3. Every sensitive API re-checks server-side  
4. Prefetch/preview of locked catalogue allowed only where product permits  
5. Equip/activate of locked content rejected server-side  

---

## 6. Store billing implication

Entitlement grants for digital features will likely be driven by validated Apple/Google receipts (and/or approved web commercial model). See mobile strategy + open questions.

---

## 7. Unresolved commercial rules (do not invent)

Wellness final price; add-on/package pricing; cancellation; failed payment; grace; upgrade/downgrade; reactivation; trial reset; cosmetics/pets/progression after downgrade; promotional access; refunds; Bondfire quota reset period.

All listed in `open-questions.md`.
