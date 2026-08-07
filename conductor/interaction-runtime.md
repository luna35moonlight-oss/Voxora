# Voxora Interaction Runtime — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Mandate:** Central runtime is mandatory. Individual UI components must not each contain independent pet/avatar reaction logic.

---

## 1. Purpose

The Interaction Runtime receives application events and coordinates:

- avatar reaction  
- pet reaction  
- Alpha response cues (speaking/thinking)  
- animation selection  
- sound  
- visual effects  
- notification-adjacent behaviour (attention cues)

---

## 2. Placement

| Layer | Responsibility |
|-------|----------------|
| Mobile client | Primary runtime instance driving Scene Engine |
| Shared pure package (`scene-core` proposed) | Selection rules, priority, cooldowns — unit tested |
| Server | Emits authoritative domain events (battle, rewards, reminders); does not play animations |

---

## 3. Inputs considered before acting

- current screen  
- active pet + pet state + species + growth stage  
- active avatar + avatar state  
- current animation + priority + cooldown  
- user speaking / Alpha speaking  
- active battle / game / training  
- reduced motion / mute / accessibility  
- user preferences  
- entitlement (for gated reactions/features)  
- device performance profile  

---

## 4. Arbitration examples

| Situation | Rule |
|-----------|------|
| Idle vs Alpha speaking | Idle must not interrupt Alpha speaking |
| Grooming vs battle | Grooming must not interrupt battle |
| Decorative vs urgent reminder | Decorative must not interrupt urgent reminder |
| Reduced motion | Replace large motion with soft pose/fade equivalents |
| Mic permission failed | Do not simulate listening; emit failure UX path |

---

## 5. Voice-to-reaction coordination

Canonical flow (spec §38):

1. User activates microphone  
2. Mic state visible  
3. Avatar → Listening  
4. Pet may listen (species-compatible)  
5. Voice activity  
6. Capture speech  
7. Transcribe  
8. Show transcript where appropriate  
9. User stops speaking  
10. Avatar → Thinking/Waiting  
11. Alpha processes  
12. Response begins  
13. If spoken output enabled → Avatar Speaking + lip sync  
14. Pet may react  
15. Alpha finishes  
16. Avatar → conversational Idle  
17. Pet → appropriate idle  

Correlation IDs bind mic session → transcript → Alpha request → TTS → animation.

---

## 6. Home coming-alive sequence

On successful Home entry (once per entry, not on every React re-render):

1. Scene loads  
2. Current avatar loads with equipped clothing  
3. Active pet loads with clothing/equipment  
4. Avatar welcome/return animation  
5. Pet notices arrival; species-appropriate return behaviour  
6. Important reminders evaluated  
7. Alpha may greet/surface info per settings  
8. If Alpha speaks → avatar speaking; pet may react  
9. Return naturally to idle  

**Idempotency guard:** `homeIntroPlayedForSession` (or equivalent) prevents restart loops.

---

## 7. API sketch (client)

```ts
interface InteractionRuntime {
  dispatch(event: VoxoraEvent): void;
  getAvatarState(): AvatarRuntimeState;
  getPetState(petId: string): PetRuntimeState;
  setPerformanceProfile(profile: PerformanceProfile): void;
  setReducedMotion(enabled: boolean): void;
  setMuted(enabled: boolean): void;
}
```

UI components call `dispatch`; Scene Engine subscribes to state changes.

---

## 8. Failure honesty

- Permission denials → visible failure + settings/retry + text fallback  
- Provider/Alpha errors → capability-scoped error, app remains up  
- Never invent successful listening/speaking if audio pipeline failed  

---

## 9. Testing anchor

Given Avatar=Idle, event `ALPHA_STARTED_SPEAKING` → Avatar=Speaking; pet receives eligible contextual event.  
On `ALPHA_FINISHED_SPEAKING` → natural return to idle/conversation state.  
Must pass without manual visual observation.
