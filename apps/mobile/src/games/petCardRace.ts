import type {
  PetCardRaceCard,
  PetCardRaceEvent,
  PetCardRaceLane,
  PetCardRaceRacer,
  PetCardRaceRacerId,
} from '@voxora/contracts';
import { evaluatePetCardRaceSelection, findBestPetCardRaceSelection } from '@voxora/domain';

export type PetCardRaceSelectionSummary = {
  valid: boolean;
  headline: string;
  detail: string | null;
  steps: number;
  isTactic: boolean;
};

/**
 * Replays one server event onto the lanes the player is currently looking at, so rival run
 * cards animate one at a time instead of jumping. The server snapshot always wins afterwards.
 */
export function applyPetCardRaceEvent(
  lanes: readonly PetCardRaceLane[],
  event: PetCardRaceEvent,
): PetCardRaceLane[] {
  if (!event.racerId || event.step === null) {
    return [...lanes];
  }

  return lanes.map((lane) =>
    lane.racerId === event.racerId ? { ...lane, step: event.step ?? lane.step } : lane,
  );
}

export function reconcilePetCardRaceLanes(
  authoritative: readonly PetCardRaceLane[],
): PetCardRaceLane[] {
  return authoritative.map((lane) => ({ ...lane }));
}

export function summarisePetCardRaceSelection(
  cards: readonly PetCardRaceCard[],
): PetCardRaceSelectionSummary {
  if (cards.length === 0) {
    return {
      valid: false,
      headline: 'Choose cards to run',
      detail: 'Singles move one step. Pairs, runs, full houses, and four of a kind move further.',
      steps: 0,
      isTactic: false,
    };
  }

  const evaluation = evaluatePetCardRaceSelection(cards);
  if (!evaluation.valid) {
    return {
      valid: false,
      headline: 'No combination',
      detail: evaluation.reason,
      steps: 0,
      isTactic: false,
    };
  }

  if (evaluation.kind === 'TACTIC') {
    return {
      valid: true,
      headline: `${evaluation.label} · tactic card`,
      detail: null,
      steps: 0,
      isTactic: true,
    };
  }

  return {
    valid: true,
    headline: `${evaluation.label} · ${evaluation.steps} step${evaluation.steps === 1 ? '' : 's'}`,
    detail:
      evaluation.fastBonus > 0
        ? `${evaluation.baseSteps} for the combination and ${evaluation.fastBonus} for high cards`
        : null,
    steps: evaluation.steps,
    isTactic: false,
  };
}

export function petCardRaceSelectionNeedsTarget(cards: readonly PetCardRaceCard[]): boolean {
  return cards.length === 1 && cards[0]?.tactic === 'CHASER';
}

/** Card ids of the strongest legal play in a hand, for the suggestion control. */
export function suggestPetCardRaceSelection(cards: readonly PetCardRaceCard[]): string[] {
  return (findBestPetCardRaceSelection(cards) ?? []).map((card) => card.cardId);
}

export function formatPetCardRacePosition(position: number): string {
  switch (position) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return '4th';
  }
}

export function formatPetCardRaceCooldown(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'Ready to run';
  }

  return `Next card in ${Math.ceil(remainingMs / 1000)}s`;
}

export function petCardRaceLaneProgress(step: number, trackLength: number): number {
  if (trackLength <= 0) {
    return 0;
  }

  return Math.min(Math.max(step / trackLength, 0), 1);
}

export function petCardRaceRacerName(
  roster: readonly PetCardRaceRacer[],
  racerId: PetCardRaceRacerId,
): string {
  return roster.find((racer) => racer.racerId === racerId)?.displayName ?? racerId;
}
