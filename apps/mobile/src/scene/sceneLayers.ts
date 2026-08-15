/**
 * Scene Engine ordered layer model (Phase 3 validation).
 *
 * Pets are future extension points only — no pet domain objects are created here.
 */

export const SCENE_ENGINE_LAYER_ORDER = [
  'background',
  'environment',
  'avatar_base',
  'avatar_hair',
  'facial_layer',
  'clothing',
  'accessories',
  'held_items',
  'avatar_animation',
  'avatar_effects',
  'future_pet_base',
  'future_pet_clothing',
  'future_pet_equipment',
  'future_pet_animation',
  'shared_effects',
  'ui_overlays',
] as const;

export type SceneEngineLayerId = (typeof SCENE_ENGINE_LAYER_ORDER)[number];

export type SceneLayerDescriptor = {
  id: SceneEngineLayerId;
  zIndex: number;
  owner: 'scene' | 'avatar' | 'future_pet' | 'shared' | 'ui';
  implementedInPhase3: boolean;
  notes: string;
};

export const SCENE_ENGINE_LAYERS: SceneLayerDescriptor[] = SCENE_ENGINE_LAYER_ORDER.map(
  (id, index) => {
    const futurePet = id.startsWith('future_pet');
    return {
      id,
      zIndex: index + 1,
      owner: futurePet
        ? 'future_pet'
        : id.startsWith('avatar') ||
            id === 'facial_layer' ||
            id === 'clothing' ||
            id === 'accessories' ||
            id === 'held_items'
          ? 'avatar'
          : id === 'shared_effects'
            ? 'shared'
            : id === 'ui_overlays'
              ? 'ui'
              : 'scene',
      implementedInPhase3: !futurePet,
      notes: futurePet
        ? 'Extension point reserved for Phase 4 pets — not implemented.'
        : 'Phase 3 Scene Engine composition boundary.',
    };
  },
);

export function assertSceneLayerOrderIntact(
  order: readonly string[] = SCENE_ENGINE_LAYER_ORDER,
): boolean {
  if (order.length !== SCENE_ENGINE_LAYER_ORDER.length) return false;
  return SCENE_ENGINE_LAYER_ORDER.every((id, index) => order[index] === id);
}

export function petLayersAreExtensionOnly(): boolean {
  return SCENE_ENGINE_LAYERS.filter((layer) => layer.owner === 'future_pet').every(
    (layer) => !layer.implementedInPhase3,
  );
}
