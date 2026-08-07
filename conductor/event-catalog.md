# Voxora Event Catalog — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Consumer:** Interaction Runtime, analytics (where appropriate), notifications, Alpha side-effects  
**Rule:** Screens emit events; they do not each implement reaction logic.

---

## 1. Event envelope (proposed)

```ts
type VoxoraEvent = {
  id: string;              // uuid
  type: VoxoraEventType;   // catalogue key
  occurredAt: string;      // ISO UTC
  source: string;          // module id
  userId?: string;
  sessionId?: string;
  screen?: string;
  payload: Record<string, unknown>;
  correlationId?: string;  // ties voice → Alpha → speech
  entitlementContext?: string[]; // optional debug snapshot, not authority
};
```

Client runtime events may be local-only. Server-significant events are persisted or streamed as needed.

---

## 2. Catalogue

### App / presence
| Type | Description |
|------|-------------|
| `APP_OPENED` | Cold/warm start completed enough for Home init |
| `USER_RETURNED` | Presence returned from Away/Idle |
| `USER_IDLE` | Idle threshold reached |
| `PRESENCE_CHANGED` | Generic presence transition |

### Messaging / social (Voxora-owned or verified provider)
| Type | Description |
|------|-------------|
| `MESSAGE_RECEIVED` | Inbound message confirmed |
| `MESSAGE_SENT` | Outbound confirmed Sent |
| `REACTION_RECEIVED` | Social reaction received |

### Voice / Alpha
| Type | Description |
|------|-------------|
| `USER_STARTED_SPEAKING` | Mic capturing speech |
| `USER_STOPPED_SPEAKING` | Speech segment ended |
| `ALPHA_STARTED_THINKING` | Request accepted; model/tools running |
| `ALPHA_STARTED_SPEAKING` | Spoken output started |
| `ALPHA_FINISHED_SPEAKING` | Spoken output ended |
| `BONDFIRE_OPENED` | Bondfire environment entered |
| `BONDFIRE_CLOSED` | Bondfire environment left |

### Pet
| Type | Description |
|------|-------------|
| `PET_TAPPED` | User tapped pet |
| `PET_FED` | Feed action accepted |
| `PET_GROOMED` | Groom accepted |
| `PET_PLAYED_WITH` | Play accepted |
| `PET_TRAINED` | Training session result accepted |
| `PET_LEVEL_UP` | Server progression level increased |
| `PET_EVOLVED` | Server growth/evolution applied |
| `PET_EQUIPMENT_CHANGED` | Equipment change accepted |

### Avatar
| Type | Description |
|------|-------------|
| `AVATAR_OUTFIT_CHANGED` | Equipment change accepted |

### Battle / game
| Type | Description |
|------|-------------|
| `BATTLE_STARTED` | Battle begins |
| `BATTLE_ATTACK` | Approved attack event |
| `BATTLE_DAMAGE` | Approved damage event |
| `BATTLE_WIN` | Battle win |
| `BATTLE_LOSS` | Battle loss |
| `GAME_STARTED` | Game module started |
| `GAME_COMPLETED` | Server-validated completion |

### Progression / ops
| Type | Description |
|------|-------------|
| `ACHIEVEMENT_UNLOCKED` | Achievement granted |
| `REMINDER_TRIGGERED` | Reminder engine fired |
| `MEETING_STARTING_SOON` | Calendar-derived reminder |
| `NEW_EMAIL` | Provider mail event (connected + permitted) |
| `NEW_SOCIAL_MESSAGE` | Only if real integration exists |

---

## 3. Priority classes (for runtime arbitration)

| Class | Examples | May interrupt |
|-------|----------|---------------|
| P0 Critical attention | `REMINDER_TRIGGERED` (urgent), safety | Most decorative |
| P1 Conversation | `ALPHA_STARTED_SPEAKING`, user speaking | Idle, blink-only |
| P2 Active gameplay | battle/game/training actions | Decorative pet antics |
| P3 Social reaction | message/reaction playful responses | Idle |
| P4 Ambient | idle variants, soft notices | Nothing important |

Exact numeric priorities live with animation definitions; this table is policy guidance.

---

## 4. Reaction definition schema (pets/avatars)

Reaction records require:

- reaction ID  
- species compatibility (pets) / rig compatibility (avatars)  
- growth compatibility (pets)  
- trigger event type  
- priority  
- probability (optional)  
- cooldown  
- animation ref  
- optional sound/effect  
- screen restrictions  
- interruptibility  

Species-specific playful examples (non-graphic):

- Dragon → harmless flame-style reaction for appropriate negative social reactions  
- Cat → cartoon swipe/scratch gesture  
- Dog → affectionate positive lick/heart-style effects  

---

## 5. Testability requirement

Events and resulting state transitions must be unit-testable without visually watching the screen (see `testing-strategy.md` reaction example).

---

## 6. Analytics labelling note

Where analytics are introduced, use **Bondfire** spelling and stable event type strings. Do not auto-correct to “Bonfire”.
