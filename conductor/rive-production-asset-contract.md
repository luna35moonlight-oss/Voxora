# Voxora Production Rive Asset Contract

**Document status:** AUTHORITATIVE FOR FUTURE PRODUCTION `.riv` ASSETS  
**Phase:** Phase 3 final integration  
**Owner:** Maryke Farrell  

This contract is precise enough for artists and engineers to validate an asset before release.  
Do **not** treat the development community demo asset as satisfying this contract.

---

## 1. Identity

| Field | Requirement |
|-------|-------------|
| `assetId` | Stable kebab-case ID matching catalogue (`AvatarAsset.id` / item asset id) |
| `assetVersion` | Positive integer; increment on any breaking artboard/input/rig change |
| `rigFamily` | Must match catalogue `rigFamily` (Phase 3 proof: `humanoid_v1`) |
| `active` | Boolean; inactive assets must not be selectable for new equipment grants |
| `validationStatus` | `DRAFT` \| `VALIDATED` \| `REJECTED` \| `DEPRECATED` |
| `minimumCompatibleRuntimeVersion` | Exact `@rive-app/react-native` semver floor tested with the asset |
| `fallbackAssetId` | Required for production avatars; used when renderer/asset fails |
| `thumbnailRef` | Separate still reference; not the `.riv` itself |
| `performanceProfile` | `HIGH` \| `STANDARD` \| `LOW` |

---

## 2. Artboard and state machine naming

| Concern | Convention |
|---------|------------|
| Primary artboard | `AvatarMain` (or documented alias in catalogue metadata) |
| Optional clothing artboards | `Layer_Hair`, `Layer_Outfit`, `Layer_Accessory_*` only when separate Rive artboards are used |
| Primary state machine | `AvatarRuntime` |
| Reduced-motion state machine | `AvatarRuntimeReduced` **or** documented input that suppresses motion while preserving presence |

---

## 3. Required runtime states / animations

Production assets must support these Voxora runtime states (names exact):

`IDLE`, `BLINK`, `LOOK_LEFT`, `LOOK_RIGHT`, `LISTEN`, `THINK`, `SPEAK`, `SMILE`, `HAPPY`, `EXCITED`, `SURPRISED`, `CONCERNED`, `CONFUSED`, `CELEBRATE`, `WAVE`, `RETURN_TO_IDLE`

Return to IDLE may be:

1. a genuine Rive state-machine transition, **or**
2. documented application orchestration around the real runtime.

If (2) is used, documentation must say so. Do not present timers as Rive-native transitions.

---

## 4. State-machine inputs

| Input name | Type | Default | Purpose |
|------------|------|---------|---------|
| `listen` | boolean | `false` | LISTEN |
| `think` | boolean | `false` | THINK |
| `speak` | boolean | `false` | SPEAK |
| `smile` | boolean | `false` | SMILE / positive soft reaction |
| `happy` | boolean | `false` | HAPPY / EXCITED |
| `concerned` | boolean | `false` | CONCERNED / CONFUSED |
| `celebrate` | trigger | n/a | CELEBRATE |
| `wave` | trigger | n/a | WAVE |
| `look` | number | `0` | LOOK_LEFT < 0, LOOK_RIGHT > 0, center = 0 |
| `reducedMotion` | boolean | `false` | Prefer static/presence-preserving path |

Runtime state mapping lives in application code (`riveStateAdapter` / production successor) and must stay synchronised with this table.

---

## 5. Data bindings

Where the selected Rive runtime supports view-model data binding:

- Prefer named view-model properties matching the input table above.
- Catalogue metadata may store binding path aliases.
- Do not rely on undocumented nested paths.

---

## 6. Attachment / clothing points

| Slot | Attachment / layer expectation |
|------|--------------------------------|
| HAIR | Hair attachment or dedicated hair layer |
| HEADWEAR | Head attachment |
| FACE_ACCESSORY | Face attachment |
| TOP / BOTTOM / FULL_OUTFIT / OUTERWEAR | Body clothing layers; FULL_OUTFIT conflicts with TOP/BOTTOM |
| HANDS / SHOES / JEWELLERY / BACK_ACCESSORY / HELD_ITEM / SPECIAL_EFFECT | Corresponding attachment points |

Compatibility remains enforced by server catalogue metadata (`conflictsWith`, `rigFamily`), not only by the `.riv` file.

---

## 7. Concern ownership (Rive vs Scene Engine)

| Concern | Owner |
|---------|-------|
| Base body silhouette / facial cores | Rive artboard |
| Facial expression / listen/think/speak motions | Rive state machine (+ bindings) |
| Optional clothing meshes that ship inside one `.riv` | Separate Rive layers / artboards when supported |
| Equipment ownership, equipped persistence, compatibility | Server catalogue + Avatar Inventory / Equipment services |
| Composition of background/environment/UI and future pets | Scene Engine ordered layers |
| React Native placeholders | Temporary only; not production |

**Do not flatten all future clothing into one avatar asset merely to make a development demo work.**

If the selected Rive runtime cannot support required layered clothing:

`OWNER REVIEW REQUIRED` — document exact limitation, closest valid option, asset-authoring consequences, and runtime/performance consequences. Do not silently redesign the product.

---

## 8. Reduced motion and performance

- Reduced motion must retain meaningful avatar presence (identity visible).
- `STANDARD` is the default proof profile.
- `LOW` must still show the avatar; drop expensive effects/equipment overlays first.
- Fallback asset must render when the primary `.riv` or native renderer fails.

---

## 9. Migration / versioning

- Breaking input renames require `assetVersion` bump + catalogue migration note.
- Old clients must fall back via `fallbackAssetId` / minimum runtime gate.
- Moon Dash Legendary Avatar must use the same ownership/inventory model and this same asset contract — never a parallel `MoonDashAvatarSystem`.

---

## 10. Validation checklist before release

- [ ] assetId / version / rigFamily recorded  
- [ ] artboard + state machine names match contract  
- [ ] required states present or explicitly mapped  
- [ ] inputs/defaults verified on target `@rive-app/react-native` version  
- [ ] reduced-motion path verified  
- [ ] STANDARD and LOW profiles verified on device  
- [ ] fallback asset verified  
- [ ] clothing/attachment metadata matches catalogue slots  
- [ ] not using community demo art as production  
