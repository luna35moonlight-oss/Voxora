# Voxora Pet System — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Definition:** A pet is a persistent living digital companion — not an image swap.

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

May include mini-games. Client submits performance; server approves progression/rewards via Reward Ledger.

Exact formulas → owner-defined later.

---

## 8. Species-specific playful reactions

Examples intended:

- **Dragon:** harmless animated flame-style reaction for appropriate negative social reactions  
- **Cat:** cartoon swipe/scratch  
- **Dog:** affectionate positive reactions including licking/heart-style effects  

Must not realistically injure people or simulate graphic harm.

---

## 9. Entitlement mapping (product)

- Level 1: one Basic pet  
- Level 2: eligible Basic + Elite pets  
- Level 3+: eligible pets subject to package ownership  
- Battles/training gated by capabilities + flags  

Downgrade ownership rules unresolved — see `open-questions.md`.
