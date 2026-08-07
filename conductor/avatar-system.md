# Voxora Avatar System — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Definition:** An avatar is a layered living character — not a profile photo.

---

## 1. Phase 0 avatar questions (§104)

| Question | Answer (proposed) |
|----------|-------------------|
| Rendering technology | Rive in Expo React Native Scene Engine |
| Rig system | Versioned avatar rig families; clothing items declare rig compatibility |
| Asset format | Rive (`.riv`) + catalogue metadata; thumbnails separate |
| Clothing layers | Slot-based equipment applied as layered artboards/inputs |
| State persistence | Server stores base + owned + equipped + customisation; client caches |
| Lip sync | Visemes/timings from TTS when available; amplitude fallback |
| Listening | Explicit Listening animation state when mic active & permitted |
| Talking | Speaking state driven by Alpha/TTS playback |
| Animation transitions | Priority + interruptibility + cooldown metadata |
| Reduced motion | Pose/fade equivalents; identity preserved |

---

## 2. Animation states (minimum set)

Idle, Blink, Look Left, Look Right, Listen, Think, Talk, Smile, Laugh, Happy, Excited, Surprised, Concerned, Confused, Celebrate, Wave, Point, Sit, Walk, Sleep, Wake, Return to Idle.

Each definition supports: ID, rig compatibility, duration, loop, priority, interruptibility, cooldown, transition, fallback, device performance requirement.

Do not run incompatible animations simultaneously.

---

## 3. Clothing slots (possible)

hair, headwear, face accessory, top, bottom, full outfit, outerwear, hands, shoes, jewellery, back accessory, held item, special effect.

Store: base avatar, rig, owned items, equipped items, colour/customisation, compatibility.

Do **not** store every combination as a separate flattened avatar image.

Catalogue categories may eventually include: casual, professional, fantasy, gaming, PPE/workwear, themed packages — package details owner-controlled.

---

## 4. Entitlement gating

- Level 1: Basic avatar catalogue  
- Level 2: Basic + eligible Elite  
- Level 3/4: + eligible Legendary subject to rules/packages  

Locked content may be previewed where permitted; cannot equip/activate locked items.

---

## 5. Speaking / lip sync requirements

When spoken Alpha output uses the user’s avatar representation:

- speaking / listening / thinking states  
- mouth movement, lip sync, visemes where supported  
- amplitude fallback  
- natural blinking, expression, subtle head movement  

If accurate speech timing exists, do not use purely random mouth movement.

---

## 6. Data entities

See `data-model.md`: `avatar_bases`, `avatar_items`, `user_avatars`, `avatar_inventory`, `avatar_equipment`, `animation_definitions`, `assets`.

---

## 7. Open owner decisions

- Final art style and rig count at launch  
- Which Elite/Legendary items ship first  
- Downgrade behaviour for owned cosmetics (see commercial open questions)  
- Whether colour customisation ships in early phases  
