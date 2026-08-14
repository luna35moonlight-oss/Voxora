import type { AvatarPerformanceProfile, AvatarRuntimeState } from '@voxora/contracts';
import { RIVE_DEV_TEST_ASSET } from './riveDevAsset';
import {
  describeDevAssetAdapter,
  mapVoxoraStateToDevAssetCommands,
  type RiveInputCommand,
} from './riveStateAdapter';

export type RiveRuntimeAvailability =
  | { status: 'native_module_loadable_js'; detail: string }
  | { status: 'unavailable'; detail: string };

/**
 * JavaScript-level availability probe only.
 * Does NOT prove the native renderer launched on a device.
 */
export function probeRiveJsModuleAvailability(): RiveRuntimeAvailability {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@rive-app/react-native') as Record<string, unknown>;
    if (mod && typeof mod.RiveView === 'function') {
      return {
        status: 'native_module_loadable_js',
        detail:
          '@rive-app/react-native exports RiveView at JS level. Native device / Expo development build validation is still required.',
      };
    }
    return {
      status: 'unavailable',
      detail: '@rive-app/react-native loaded but RiveView export was missing.',
    };
  } catch (error) {
    return {
      status: 'unavailable',
      detail: error instanceof Error ? error.message : 'Failed to require @rive-app/react-native',
    };
  }
}

export function buildRiveProofPlan(state: AvatarRuntimeState) {
  const mapping = mapVoxoraStateToDevAssetCommands(state);
  return {
    asset: RIVE_DEV_TEST_ASSET,
    adapterSummary: describeDevAssetAdapter(),
    mapping,
    expoGoSupported: false,
    developmentBuildRequired: true,
  };
}

export function applyCommandsToNativeView(
  view: {
    setBooleanInputValue?: (name: string, value: boolean) => void;
    triggerInput?: (name: string) => void;
    playIfNeeded?: () => void;
  } | null,
  commands: RiveInputCommand[],
): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  if (!view) {
    return {
      applied,
      skipped: commands.map((command) => describeCommand(command) + ' (no view)'),
    };
  }

  for (const command of commands) {
    if (command.kind === 'boolean' && view.setBooleanInputValue) {
      view.setBooleanInputValue(command.name, command.value);
      applied.push(describeCommand(command));
      view.playIfNeeded?.();
    } else if (command.kind === 'trigger' && view.triggerInput) {
      view.triggerInput(command.name);
      applied.push(describeCommand(command));
      view.playIfNeeded?.();
    } else {
      skipped.push(describeCommand(command));
    }
  }
  return { applied, skipped };
}

export function sceneHeightForProfile(profile: AvatarPerformanceProfile): number {
  if (profile === 'LOW') return 160;
  if (profile === 'HIGH') return 260;
  return 210;
}

function describeCommand(command: RiveInputCommand): string {
  if (command.kind === 'boolean') return `boolean:${command.name}=${command.value}`;
  if (command.kind === 'trigger') return `trigger:${command.name}`;
  return `application_only:${command.reason}`;
}
