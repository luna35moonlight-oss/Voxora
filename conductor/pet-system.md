# Voxora Pet System — Phase 0 / Future Integration Notes

**Document status:** OWNER REVIEW + Games & Rewards Addendum recorded  
**Definition:** A pet is a persistent living digital companion — not an image swap.

**Phase 4** remains Pet Foundation only. Do **not** build Rock Paper Scissors, Spinning Wheel, or final skill/shard economies during Phase 4 unless specifically authorised.

---

## 1. Phase 0 pet questions (§103)

| Question | Answer (proposed) |
|----------|-------------------|
| How are species defined? | `pet_species` records: rig/body family, movement, sounds, idle/interaction sets, clothing/equipment compatibility, growth stages, training categories, skills, battle abilities, reaction tables |
| How are rigs defined? | Versioned `rig_family` keys; assets and items declare compatibility |
| How are animations defined? | Catalogue metadata + Rive state machine names; priorities/cooldowns like avatars |
| How are growth stages defined? | Enum/stage table: Baby, Young, Adult, Advanced/Evolved, Special Evolution where applicable; may change model, animations, abilities, equipment compatibility, stats |
| How are user-owned instances stored? | `pets` table (server authority) with progression fields |
| How are clothing/equipment layers implemented? | Slot equipment → Scene Engine layers; cosmetics vs functional equipment distinguished |
| How are interactions emitted? | Validated action → server accept/reject → `PET_*` events → Interaction Runtime |
| How are reactions selected? | Runtime matches event + species + growth + screen + priority + probability + cooldown |
| How do pets appear consistently? | Shared Scene Engine + equipment state |
| How are new species added later? | Data/assets + species pack; avoid rewriting pet core |

---

## 2. Species families (potential)

dogs, cats, horses, owls, dragons, unicorns, raccoons, iguanas, birds, future fantasy species.

Architecture must allow new species without rewriting the entire pet system.

---

## 3. Data levels

1. **Species** — Dog  
2. **Catalogue template** — Brown-and-white pit bull  
3. **User-owned instance** — the individual’s pet  

---

## 4. Growth

Growth is not just changing a picture. May alter body model, animation set, abilities, equipment compatibility, training, stats, interactions. Server-authoritative.

Exact XP thresholds / evolution rules → **OWNER REVIEW** (do not invent).

---

## 5. Interactions

Pet, Feed, Play, Groom, Talk, Call, Train, Dress, Equip, Give Item, Inspect, Capture/Photograph Scene, Enter Game, Enter Battle.

Each action must:

1. validate availability (entitlement, energy, state, feature flag)  
2. emit interaction event  
3. play species behaviour  
4. update persistent data where required  
5. show failure honestly if server rejects  

---

## 6. Cosmetics vs equipment

| Type | Role |
|------|------|
| Cosmetics | Appearance |
| Equipment | May influence game/battle attributes where defined |

Potential slots: head, neck, body, back, feet, accessory, battle slot 1, battle slot 2, species-specific slot.

Compatibility: species, rig, growth stage, subscription, ownership, package, battle eligibility. Server validates changes.

---

## 7. Training

Separate from battle. Potential categories: agility, strength, speed, defence, focus, bond, species ability, special skill.

May include mini-game. Client submits performance; server approves progression/rewards via Reward Ledger.

Exact formulas → owner-defined later.

---

## 8. Progression concepts (must remain distinct)

Do **not** merge all progression into one generic number merely because that is easier to code.

Architecture must be able to distinguish appropriately between:

- game score  
- game reward points  
- pet XP  
- pet skill progression  
- pet skill-up shards  
- general pet level  
- bond  
- future species-specific progression  

### Confirmed future relationship — Rock Paper Scissors

Rock Paper Scissors (Phase 13 / future Games) contributes **server-approved progression points** toward pet skill development:

```text
validated game result → Reward Ledger / progression transaction → pet skill system
```

Mobile clients must never directly mutate pet skill values or decide award amounts.

Exact formulas remain **OWNER DECISION REQUIRED BEFORE IMPLEMENTATION**.

### Confirmed reward type — Pet Skill-Up Shards

Spinning Wheel (future) may award Pet Skill-Up Shards. Phase 4 Pet Foundation must leave clean extension points for:

- pet skills  
- skill progression  
- skill resources  
- skill-up shards  
- user/pet shard inventory  
- shard consumption  
- skill upgrades  

Do **not** implement the final shard economy in Phase 4 unless specifically authorised.  
Do **not** invent shard rarity, shards-per-level, skill-up probability, species restrictions, or conversion formulas.

---

## 9. Species-specific playful reactions

Examples intended:

- **Dragon:** harmless animated flame-style reaction for appropriate negative social reactions  
- **Cat:** cartoon swipe/scratch  
- **Dog:** affectionate positive reactions including licking/heart-style effects  

Must not realistically injure people or simulate graphic harm.

---

## 10. Entitlement mapping (product)

- Level 1: one Basic pet  
- Level 2: eligible Basic + Elite pets  
- Level 3+: eligible pets subject to package ownership  
- Battles/training gated by capabilities + flags  

Downgrade ownership rules unresolved — see `open-questions.md`.

---

## 11. Phase 4 boundary

When Phase 4 begins, Pet Foundation must anticipate later integration with pet skills, Rock Paper Scissors reward points, Skill-Up Shards, training, games, rewards, and achievements — **without** building those games or economies prematurely.
