import { describe, expect, it } from 'vitest';
import type { PetCardRaceCard, PetCardRaceCompetitor, PetCardRacePetId } from '@voxora/contracts';
import { PET_CARD_RACE_BALANCE } from '@voxora/contracts';
import { buildPetCardRaceDeck, petCardRacePet } from '@voxora/domain';
import {
  describePetCardRaceStatus,
  formatPetCardRaceCooldown,
  formatPetCardRacePosition,
  interpolatePetCardRaceProgress,
  orderPetCardRaceLiveRacers,
  petCardRaceCountdownLabel,
  petCardRaceGaitPhase,
  petCardRaceSelectionNeedsTarget,
  summarisePetCardRaceSelection,
} from './petCardRace';

const deck = buildPetCardRaceDeck('m1');
const courseMetres = PET_CARD_RACE_BALANCE.courseMetres;

function card(match: (entry: PetCardRaceCard) => boolean): PetCardRaceCard {
  const found = deck.find(match);
  if (!found) {
    throw new Error('Missing card');
  }

  return found;
}

function competitor(
  competitorId: string,
  petId: PetCardRacePetId,
  progressMetres: number,
  speedMetresPerSecond: number,
  finishPosition: number | null = null,
): PetCardRaceCompetitor {
  return {
    competitorId,
    trainerKind: competitorId === 'you' ? 'PLAYER' : 'HOUSE',
    isYou: competitorId === 'you',
    trainerName: competitorId === 'you' ? 'Voxora Guide' : 'Vale (Voxora house trainer)',
    trainerAvatarId: null,
    trainerAvatarName: null,
    pet: petCardRacePet(petId),
    progressMetres,
    progressFraction: progressMetres / courseMetres,
    speedMetresPerSecond,
    speedMultiplier: speedMetresPerSecond / PET_CARD_RACE_BALANCE.baseSpeedMetresPerSecond,
    position: 1,
    statuses: [],
    finishPosition,
    finishTimeMs: null,
  };
}

describe('live race interpolation', () => {
  it('keeps a pet moving between server snapshots', () => {
    const racer = competitor('you', 'moonlit-wolf', 100, 8);

    expect(interpolatePetCardRaceProgress(racer, 0, courseMetres)).toBe(100);
    expect(interpolatePetCardRaceProgress(racer, 1_000, courseMetres)).toBe(108);
    expect(interpolatePetCardRaceProgress(racer, 500, courseMetres)).toBe(104);
  });

  it('never runs a pet past the finish line', () => {
    const racer = competitor('you', 'moonlit-wolf', courseMetres - 2, 20);

    expect(interpolatePetCardRaceProgress(racer, 10_000, courseMetres)).toBe(courseMetres);
  });

  it('orders live positions so an overtake shows immediately', () => {
    const racers = [
      competitor('you', 'moonlit-wolf', 200, 12),
      competitor('house-1', 'shadow-panther', 210, 6),
      competitor('house-2', 'star-kitten', 150, 8),
      competitor('house-3', 'aurora-dragon', 120, 8),
    ];

    expect(orderPetCardRaceLiveRacers(racers, 0, courseMetres)[0]?.competitorId).toBe('house-1');

    const afterTwoSeconds = orderPetCardRaceLiveRacers(racers, 2_000, courseMetres);
    expect(afterTwoSeconds[0]?.competitorId).toBe('you');
    expect(afterTwoSeconds[0]?.position).toBe(1);
    expect(afterTwoSeconds.map((racer) => racer.competitorId)).toEqual([
      'you',
      'house-1',
      'house-2',
      'house-3',
    ]);
  });

  it('keeps finished pets ahead of pets still running', () => {
    const racers = [
      competitor('you', 'moonlit-wolf', 690, 9),
      competitor('house-1', 'shadow-panther', courseMetres, 0, 1),
    ];

    expect(orderPetCardRaceLiveRacers(racers, 5_000, courseMetres)[0]?.competitorId).toBe(
      'house-1',
    );
  });
});

describe('selection summary', () => {
  it('prompts for a selection when nothing is chosen', () => {
    expect(summarisePetCardRaceSelection([])).toMatchObject({ valid: false, isTactic: false });
  });

  it('describes the pace a combination grants and for how long', () => {
    const summary = summarisePetCardRaceSelection([
      card((entry) => entry.rank === 'Q' && entry.suit === 'MOON'),
      card((entry) => entry.rank === 'Q' && entry.suit === 'STAR'),
    ]);

    expect(summary.valid).toBe(true);
    expect(summary.headline).toMatch(/^Pair · \d+% pace for \d+s$/);
    expect(summary.detail).toMatch(/high cards/);
  });

  it('explains why a selection cannot be played', () => {
    const summary = summarisePetCardRaceSelection([
      card((entry) => entry.rank === '4' && entry.suit === 'MOON'),
      card((entry) => entry.rank === '9' && entry.suit === 'MOON'),
    ]);

    expect(summary).toMatchObject({ valid: false, headline: 'No combination' });
    expect(summary.detail).toBe('Two cards must make a pair');
  });

  it('marks tactic cards and asks for a target only for the trail chaser', () => {
    const chaser = card((entry) => entry.tactic === 'CHASER');
    const shield = card((entry) => entry.tactic === 'SHIELD');

    expect(summarisePetCardRaceSelection([chaser])).toMatchObject({
      valid: true,
      isTactic: true,
      headline: 'Trail chaser · tactic',
    });
    expect(petCardRaceSelectionNeedsTarget([chaser])).toBe(true);
    expect(petCardRaceSelectionNeedsTarget([shield])).toBe(false);
  });
});

describe('race presentation helpers', () => {
  it('formats positions, cooldowns, countdown and statuses', () => {
    expect(formatPetCardRacePosition(1)).toBe('1st');
    expect(formatPetCardRacePosition(4)).toBe('4th');
    expect(formatPetCardRaceCooldown(0)).toBe('Commit play');
    expect(formatPetCardRaceCooldown(3_200)).toBe('Next play in 4s');
    expect(petCardRaceCountdownLabel(2_600)).toBe('3');
    expect(petCardRaceCountdownLabel(400)).toBe('1');
    expect(petCardRaceCountdownLabel(0)).toBe('GO');
    expect(describePetCardRaceStatus({ kind: 'WEIGHTS', multiplier: 0.7, endsInMs: 2000 })).toBe(
      'weighted',
    );
    expect(describePetCardRaceStatus({ kind: 'SHIELDED', multiplier: 1, endsInMs: 0 })).toBe(
      'shield',
    );
  });

  it('cycles the gait with distance so faster pets run visibly faster', () => {
    expect(petCardRaceGaitPhase(0, 4)).toBe(0);
    expect(petCardRaceGaitPhase(2, 4)).toBe(0.5);
    expect(petCardRaceGaitPhase(4, 4)).toBe(0);
  });
});
