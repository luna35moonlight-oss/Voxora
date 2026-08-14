# Voxora Scene Engine — Phase 0

**Document status:** OWNER APPROVED WITH SAFEGUARDS (2026-08-10)  
**Rule:** Avatars and pets must not be rendered with independent ad-hoc logic in every feature.

---

## 1. Purpose

Reusable Scene Engine renders the living Voxora scene consistently across Home, Alpha Bondfire, training, games shells, and other approved surfaces.

---

## 2. Logical layers

1. background  
2. environment  
3. avatar base  
4. avatar hair  
5. avatar facial layer  
6. avatar clothing  
7. avatar accessories  
8. avatar held items  
9. avatar animation  
10. avatar effects  
11. pet base  
12. pet clothing  
13. pet equipment  
14. pet accessories  
15. pet animation  
16. pet effects  
17. shared effects  
18. UI overlays  

Changing an equipped item updates the character **throughout** Voxora via shared equipment state, not local screen copies.

---

## 3. Technology proposal

| Concern | Decision |
|---------|----------|
| Character runtime | **Rive primary** (avatars, pets, expressions, reactions, state machines, compatible clothing/equipment) |
| Effects / particles / specialised games | Skia / native GPU / appropriate game runtime may supplement — Rive not mandated for every visual |
| Battle calculation | **Never in Rive** — server-authoritative |
| Orchestration | Interaction Runtime → Scene Engine commands |
| Asset resolution | Asset catalogue IDs → downloaded/cached binaries |
| Mass assets | Blocked until art-pipeline PoC (ADR-004) proves layered avatar+pet+states+persistence |

Do not replace Rive without OWNER REVIEW. Do not force inappropriate game functionality into Rive merely because it is present.

---

## 4. Scene descriptor (conceptual)

```ts
type SceneDescriptor = {
  sceneId: string;
  backgroundAssetId?: string;
  environmentAssetId?: string;
  avatar?: {
    instanceId: string;
    baseAssetId: string;
    equipment: Record<AvatarSlot, AssetId | null>;
    animationState: AvatarAnimationState;
    lipSync?: LipSyncFrame;
  };
  pet?: {
    instanceId: string;
    speciesId: string;
    growthStage: string;
    baseAssetId: string;
    equipment: Record<PetSlot, AssetId | null>;
    animationState: PetAnimationState;
  };
  performanceProfile: 'HIGH' | 'STANDARD' | 'LOW' | 'REDUCED_MOTION';
};
```

---

## 5. Consistency guarantees

- Single equipment source of truth (server) with local cache  
- Scene Engine reads equipped set; screens do not pass hard-coded outfit images  
- Animation commands are idempotent where possible  
- Reduced motion path still shows identity of avatar/pet  

---

## 6. Integration surfaces

| Surface | Scene usage |
|---------|-------------|
| Home | Full coming-alive experience |
| Alpha Bondfire | Avatar + pet presence during conversation/voice |
| Pet interactions | Close-up pet layers |
| Training / games / battles | Battle/game shells may specialize camera/layout but reuse character rigs |
| Capture/photograph scene | Export/compositor pass (later) |

---

## 7. Performance

- Pool/reuse Rive instances where feasible  
- Defer offscreen characters  
- LOW profile disables expensive shared effects first  
- Never let decorative layers block interaction readiness indefinitely  

---

## 8. Phase 3 implementation status

Phase 3 establishes the first coded Scene Engine foundation:

- mobile proof scene reads avatar/equipment state from the server-backed Avatar API;
- logical avatar layers are represented separately (base, hair, clothing, accessory);
- runtime state transitions are typed and priority-aware;
- reduced motion keeps the character visible while calming reactions;
- Rive asset references live in catalogue metadata, not scattered through React components;
- current equipment persists server-side and restores on reload.

The current renderer is a React Native placeholder proof because production `.riv` files are not present in the repository. Rive remains the primary runtime target.

Future pet layers remain represented in the logical layer model, but Phase 3 does not implement pet catalogue, ownership, equipment, or rendering.

---

## 9. Non-goals for Phase 3

- Shipping final art files  
- Mass avatar art generation  
- Pet implementation  
- Alpha / microphone / voice integration  
- Selecting final artist tooling contracts without owner approval  
