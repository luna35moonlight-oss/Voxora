import { describe, expect, it } from 'vitest';
import { mapVoxoraStateToDevAssetCommands, describeDevAssetAdapter } from './riveStateAdapter';
import { RIVE_DEV_TEST_ASSET } from './riveDevAsset';
import {
  applyCommandsToNativeView,
  buildRiveProofPlan,
  sceneHeightForProfile,
} from './riveRuntimeBridge';
import {
  assertSceneLayerOrderIntact,
  petLayersAreExtensionOnly,
  SCENE_ENGINE_LAYER_ORDER,
} from './sceneLayers';

describe('rive development asset metadata', () => {
  it('is clearly marked as non-production and not redistributed', () => {
    expect(RIVE_DEV_TEST_ASSET.marker).toContain('DEVELOPMENT TEST ASSET');
    expect(RIVE_DEV_TEST_ASSET.redistributionInRepositoryPermitted).toBe(false);
    expect(RIVE_DEV_TEST_ASSET.sourceUrl).toMatch(/^https:\/\/public\.rive\.app\//);
  });
});

describe('rive state adapter', () => {
  it('maps positive reactions to isHappy without claiming production contract', () => {
    const mapping = mapVoxoraStateToDevAssetCommands('SMILE');
    expect(mapping.commands).toContainEqual({ kind: 'boolean', name: 'isHappy', value: true });
    expect(describeDevAssetAdapter()).toContain('NOT claimed');
  });

  it('marks LISTEN/THINK/SPEAK as application-orchestrated on the development asset', () => {
    for (const state of ['LISTEN', 'THINK', 'SPEAK'] as const) {
      const mapping = mapVoxoraStateToDevAssetCommands(state);
      expect(mapping.returnToIdleStrategy).toBe('application_orchestration');
      expect(mapping.commands.some((command) => command.kind === 'application_only')).toBe(true);
    }
  });

  it('clears mood inputs for IDLE', () => {
    const mapping = mapVoxoraStateToDevAssetCommands('IDLE');
    expect(mapping.commands).toContainEqual({ kind: 'boolean', name: 'isHappy', value: false });
    expect(mapping.commands).toContainEqual({ kind: 'boolean', name: 'isSad', value: false });
  });
});

describe('rive runtime bridge helpers', () => {
  it('applies boolean commands to a view double', () => {
    const calls: Array<[string, boolean]> = [];
    const result = applyCommandsToNativeView(
      {
        setBooleanInputValue: (name, value) => calls.push([name, value]),
        playIfNeeded: () => undefined,
      },
      [
        { kind: 'boolean', name: 'isHappy', value: true },
        { kind: 'application_only', reason: 'skip me' },
      ],
    );
    expect(calls).toEqual([['isHappy', true]]);
    expect(result.applied).toEqual(['boolean:isHappy=true']);
    expect(result.skipped[0]).toContain('application_only');
  });

  it('requires Expo development builds for native proof plans', () => {
    const plan = buildRiveProofPlan('IDLE');
    expect(plan.expoGoSupported).toBe(false);
    expect(plan.developmentBuildRequired).toBe(true);
  });

  it('keeps meaningful scene height for LOW profile', () => {
    expect(sceneHeightForProfile('LOW')).toBeGreaterThan(100);
    expect(sceneHeightForProfile('STANDARD')).toBeGreaterThan(sceneHeightForProfile('LOW'));
  });
});

describe('scene engine layer order', () => {
  it('preserves the approved 16-layer order including future pet extension points', () => {
    expect(SCENE_ENGINE_LAYER_ORDER).toHaveLength(16);
    expect(assertSceneLayerOrderIntact()).toBe(true);
    expect(petLayersAreExtensionOnly()).toBe(true);
    expect(SCENE_ENGINE_LAYER_ORDER[10]).toBe('future_pet_base');
    expect(SCENE_ENGINE_LAYER_ORDER[15]).toBe('ui_overlays');
  });
});
