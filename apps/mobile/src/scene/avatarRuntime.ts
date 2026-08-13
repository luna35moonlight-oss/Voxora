import type { AvatarRuntimeState } from '@voxora/contracts';

type RuntimeDefinition = {
  priority: number;
  interruptible: boolean;
  reducedMotionFallback: AvatarRuntimeState;
  returnsToIdle: boolean;
};

const definitions: Record<AvatarRuntimeState, RuntimeDefinition> = {
  IDLE: { priority: 0, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: false },
  BLINK: { priority: 1, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: true },
  LOOK_LEFT: { priority: 1, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: true },
  LOOK_RIGHT: { priority: 1, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: true },
  LISTEN: { priority: 4, interruptible: true, reducedMotionFallback: 'LISTEN', returnsToIdle: false },
  THINK: { priority: 4, interruptible: true, reducedMotionFallback: 'THINK', returnsToIdle: false },
  SPEAK: { priority: 6, interruptible: false, reducedMotionFallback: 'SPEAK', returnsToIdle: false },
  SMILE: { priority: 2, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  HAPPY: { priority: 3, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  EXCITED: { priority: 3, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  SURPRISED: { priority: 3, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  CONCERNED: { priority: 3, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: true },
  CONFUSED: { priority: 3, interruptible: true, reducedMotionFallback: 'IDLE', returnsToIdle: true },
  CELEBRATE: { priority: 5, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  WAVE: { priority: 3, interruptible: true, reducedMotionFallback: 'SMILE', returnsToIdle: true },
  RETURN_TO_IDLE: {
    priority: 7,
    interruptible: true,
    reducedMotionFallback: 'IDLE',
    returnsToIdle: true,
  },
};

export function requestAvatarStateTransition(input: {
  current: AvatarRuntimeState;
  requested: AvatarRuntimeState;
  reducedMotion: boolean;
}): AvatarRuntimeState {
  const requested = input.reducedMotion
    ? definitions[input.requested].reducedMotionFallback
    : input.requested;
  const currentDefinition = definitions[input.current];
  const requestedDefinition = definitions[requested];

  if (!currentDefinition.interruptible && requestedDefinition.priority < currentDefinition.priority) {
    return input.current;
  }

  if (requestedDefinition.priority < currentDefinition.priority && input.current !== 'IDLE') {
    return input.current;
  }

  return requested;
}

export function shouldReturnToIdle(state: AvatarRuntimeState): boolean {
  return definitions[state].returnsToIdle;
}
