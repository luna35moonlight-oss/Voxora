import type { AvatarRuntimeState } from '@voxora/contracts';
import { RIVE_DEV_TEST_ASSET } from './riveDevAsset';

/**
 * Adapter between Voxora runtime states and the development Rive test asset.
 *
 * IMPORTANT: The third-party Avatar Pack Use Case asset does NOT implement the
 * Voxora production state-machine contract (IDLE/LISTEN/THINK/SPEAK/…). Mapping
 * below is for development proof only.
 */

export type RiveInputCommand =
  | { kind: 'boolean'; name: string; value: boolean }
  | { kind: 'trigger'; name: string }
  | { kind: 'application_only'; reason: string };

export type RiveStateMapping = {
  voxoraState: AvatarRuntimeState;
  commands: RiveInputCommand[];
  returnToIdleStrategy: 'asset_transition' | 'application_orchestration' | 'none';
  notes: string;
};

const RESET_MOOD: RiveInputCommand[] = [
  { kind: 'boolean', name: 'isHappy', value: false },
  { kind: 'boolean', name: 'isSad', value: false },
];

export function mapVoxoraStateToDevAssetCommands(
  state: AvatarRuntimeState,
): RiveStateMapping {
  switch (state) {
    case 'IDLE':
    case 'RETURN_TO_IDLE':
      return {
        voxoraState: state,
        commands: [
          ...RESET_MOOD,
          {
            kind: 'application_only',
            reason:
              'Dev asset has no dedicated IDLE input; clearing mood booleans returns toward default idle artboard behavior.',
          },
        ],
        returnToIdleStrategy: 'none',
        notes: 'IDLE is the default artboard posture after mood inputs are cleared.',
      };
    case 'LISTEN':
      return {
        voxoraState: state,
        commands: [
          ...RESET_MOOD,
          {
            kind: 'application_only',
            reason:
              'Dev asset has no LISTEN input. Application marks LISTEN while Rive remains in idle posture.',
          },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: 'LISTEN is application-orchestrated for the development asset.',
      };
    case 'THINK':
      return {
        voxoraState: state,
        commands: [
          ...RESET_MOOD,
          {
            kind: 'application_only',
            reason:
              'Dev asset has no THINK input. Application marks THINK while Rive remains in idle posture.',
          },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: 'THINK is application-orchestrated for the development asset.',
      };
    case 'SPEAK':
      return {
        voxoraState: state,
        commands: [
          ...RESET_MOOD,
          {
            kind: 'application_only',
            reason:
              'Dev asset has no SPEAK / isSpeaking input in the documented Avatar Pack example. ' +
              'Application marks SPEAK; production assets must expose SPEAK per the production contract.',
          },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: 'SPEAK cannot be driven as a Rive state-machine input on this development asset.',
      };
    case 'SMILE':
    case 'HAPPY':
    case 'EXCITED':
    case 'CELEBRATE':
    case 'WAVE':
    case 'SURPRISED':
      return {
        voxoraState: state,
        commands: [
          { kind: 'boolean', name: 'isSad', value: false },
          { kind: 'boolean', name: 'isHappy', value: true },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: `Positive reaction maps to documented boolean input "${RIVE_DEV_TEST_ASSET.knownBooleanInputs[0]}".`,
      };
    case 'CONCERNED':
    case 'CONFUSED':
      return {
        voxoraState: state,
        commands: [
          { kind: 'boolean', name: 'isHappy', value: false },
          { kind: 'boolean', name: 'isSad', value: true },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: `Concerned/confused maps to documented boolean input "${RIVE_DEV_TEST_ASSET.knownBooleanInputs[1]}".`,
      };
    case 'BLINK':
    case 'LOOK_LEFT':
    case 'LOOK_RIGHT':
      return {
        voxoraState: state,
        commands: [
          {
            kind: 'application_only',
            reason: `Dev asset has no ${state} input; ignored for runtime proof beyond presence.`,
          },
        ],
        returnToIdleStrategy: 'application_orchestration',
        notes: 'Micro-look states are production-contract concerns, not present on the demo asset.',
      };
    default: {
      const exhaustive: never = state;
      return {
        voxoraState: exhaustive,
        commands: [],
        returnToIdleStrategy: 'none',
        notes: 'Unhandled',
      };
    }
  }
}

export function describeDevAssetAdapter(): string {
  return (
    `${RIVE_DEV_TEST_ASSET.marker}. ` +
    `Artboard "${RIVE_DEV_TEST_ASSET.artboardName}", state machine "${RIVE_DEV_TEST_ASSET.stateMachineName}". ` +
    `Known inputs: ${RIVE_DEV_TEST_ASSET.knownBooleanInputs.join(', ')}. ` +
    'Voxora production IDLE/LISTEN/THINK/SPEAK names are NOT claimed to exist on this third-party asset.'
  );
}
