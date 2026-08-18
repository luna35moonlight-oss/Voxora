import type {
  PetCardRaceCard,
  PetCardRaceCompetitor,
  PetCardRaceStatusEffect,
} from '@voxora/contracts';
import { evaluatePetCardRaceSelection } from '@voxora/domain';

export type PetCardRaceSelectionSummary = {
  valid: boolean;
  headline: string;
  detail: string | null;
  isTactic: boolean;
};

export type PetCardRaceLiveRacer = {
  competitorId: string;
  progressMetres: number;
  progressFraction: number;
  position: number;
};

/**
 * Estimates where a pet is right now from the last server snapshot and the speed it was running at.
 * The pets never stop, so the client keeps them moving between syncs instead of waiting for the next
 * response and jumping. The server snapshot always wins when it arrives.
 */
export function interpolatePetCardRaceProgress(
  competitor: Pick<PetCardRaceCompetitor, 'progressMetres' | 'speedMetresPerSecond'>,
  sinceSnapshotMs: number,
  courseMetres: number,
): number {
  const elapsedSeconds = Math.max(sinceSnapshotMs, 0) / 1000;
  const projected = competitor.progressMetres + competitor.speedMetresPerSecond * elapsedSeconds;
  return Math.min(Math.max(projected, 0), courseMetres);
}

/** Live standings, so an overtake shows the moment it happens rather than on the next sync. */
export function orderPetCardRaceLiveRacers(
  competitors: readonly PetCardRaceCompetitor[],
  sinceSnapshotMs: number,
  courseMetres: number,
): PetCardRaceLiveRacer[] {
  return competitors
    .map((competitor) => ({
      competitorId: competitor.competitorId,
      progressMetres:
        competitor.finishPosition === null
          ? interpolatePetCardRaceProgress(competitor, sinceSnapshotMs, courseMetres)
          : competitor.progressMetres,
      finishPosition: competitor.finishPosition,
    }))
    .sort((a, b) => {
      if (a.finishPosition !== null || b.finishPosition !== null) {
        return (a.finishPosition ?? 99) - (b.finishPosition ?? 99);
      }

      return b.progressMetres - a.progressMetres;
    })
    .map((racer, index) => ({
      competitorId: racer.competitorId,
      progressMetres: racer.progressMetres,
      progressFraction: courseMetres > 0 ? Math.min(racer.progressMetres / courseMetres, 1) : 0,
      position: index + 1,
    }));
}

/** What the selected cards will do to the pet's pace. The player picks the cards, never the app. */
export function summarisePetCardRaceSelection(
  cards: readonly PetCardRaceCard[],
): PetCardRaceSelectionSummary {
  if (cards.length === 0) {
    return {
      valid: false,
      headline: 'Select cards to speed your pet up',
      detail: 'Pairs, three of a kind, sequences, full houses and three pairs all run faster.',
      isTactic: false,
    };
  }

  const evaluation = evaluatePetCardRaceSelection(cards);
  if (!evaluation.valid) {
    return {
      valid: false,
      headline: 'No combination',
      detail: evaluation.reason,
      isTactic: false,
    };
  }

  if (evaluation.kind === 'TACTIC') {
    return {
      valid: true,
      headline: `${evaluation.label} · tactic`,
      detail: null,
      isTactic: true,
    };
  }

  const pace = Math.round(evaluation.speedMultiplier * 100);
  const seconds = Math.round(evaluation.durationMs / 1000);

  return {
    valid: true,
    headline: `${evaluation.label} · ${pace}% pace for ${seconds}s`,
    detail:
      evaluation.fastCardBonus > 0
        ? `Includes +${Math.round(evaluation.fastCardBonus * 100)}% from high cards`
        : null,
    isTactic: false,
  };
}

export function petCardRaceSelectionNeedsTarget(cards: readonly PetCardRaceCard[]): boolean {
  return cards.length === 1 && cards[0]?.tactic === 'CHASER';
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
    return 'Commit play';
  }

  return `Next play in ${Math.ceil(remainingMs / 1000)}s`;
}

export function petCardRaceCountdownLabel(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'GO';
  }

  return String(Math.max(1, Math.ceil(remainingMs / 1000)));
}

export function describePetCardRaceStatus(status: PetCardRaceStatusEffect): string {
  switch (status.kind) {
    case 'BOOST':
      return 'boost';
    case 'SPRINT':
      return 'sprint';
    case 'WEIGHTS':
      return 'weighted';
    case 'CHASED':
      return 'chased';
    case 'MUD':
      return 'mud';
    case 'SHIELDED':
      return 'shield';
  }
}

/** Gait phase for the running animation: faster pets cycle their legs faster. */
export function petCardRaceGaitPhase(progressMetres: number, strideMetres = 4): number {
  if (strideMetres <= 0) {
    return 0;
  }

  return (progressMetres % strideMetres) / strideMetres;
}
