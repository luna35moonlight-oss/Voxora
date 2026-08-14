# Phase 3 Notes — Scene Engine and Living Avatar Foundation

**Document status:** PHASE 3 IMPLEMENTATION NOTES  
**Authorisation:** Maryke Farrell, 2026-08-13  
**Boundary:** Do not start Phase 4 pets, Alpha, or the full Games Platform.

---

## Implemented foundation

- Server-authoritative Avatar Catalogue with minimal proof entries.
- Server-authoritative user avatar ownership.
- Server-authoritative avatar item inventory.
- Server-validated current avatar selection.
- Server-validated equip/unequip with rig and ownership checks.
- Persistent equipment configuration restored from API state.
- Asset metadata with Rive references instead of hard-coded filenames in components.
- Typed mobile avatar runtime state model with priorities, reduced-motion fallback, and return-to-idle behavior.
- Mobile proof scene with layered base, hair, outfit, accessory, runtime state controls, locked Legendary display, loading/error states, and accurate no-microphone/no-Alpha copy.

## Rive posture

Rive remains the approved primary living-character runtime. Phase 3 stores Rive asset references and state names, but production `.riv` files have not been supplied in this repository. The mobile proof renders React Native placeholder layers from server metadata until real Rive assets are provided.

Do not treat this placeholder as the permanent renderer.

## Moon Dash prize compatibility

The catalogue includes a locked `Moon Dash Legendary` avatar reference. It is not granted automatically. A future valid Moon Dash prize redemption must grant ownership through the same `UserAvatarOwnership` / inventory path as normal avatars.

## Games & Rewards Addendum (documentation only)

Owner-approved requirements are recorded in `game-system.md`, `moon-dash.md`, `pet-system.md`, `avatar-system.md`, `roadmap.md`, `decisions.md` (ADR-027), `open-questions.md`, and `requirements-matrix.md`.

Confirmed for **future** phases (not Phase 3 implementation):

- Rock Paper Scissors — 10 attempts/user/UTC day; server-approved pet skill progression points  
- Spinning Wheel — may award Pet Skill-Up Shards, Voxora Diamonds, Voxora Coins, Avatar Skin redeem codes  
- Central Reward Ledger; shared redeem-code architecture; UTC server day for attempt limits  

**Do not** build Rock Paper Scissors, Spinning Wheel, Coins, Diamonds, shard economies, or Phase 13 during this Phase 3 closeout. Do not invent unresolved formulas or Wheel probabilities.

## Explicit non-goals

- No pets.
- No Alpha provider, reasoning, voice capture, or Alpha Bondfire chat.
- No Rock Paper Scissors, Spinning Wheel, or full Games Platform implementation.
- No mass art generation.
- No hard-coded special avatar grant in a profile field.
