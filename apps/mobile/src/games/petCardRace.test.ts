import { describe, expect, it } from 'vitest';
import type { PetCardRaceCard, PetCardRaceEvent, PetCardRaceLane } from '@voxora/contracts';
import { PET_CARD_RACE_ROSTER } from '@voxora/contracts';
import { buildPetCardRaceDeck } from '@voxora/domain';
import {
  applyPetCardRaceEvent,
  formatPetCardRaceCooldown,
  formatPetCardRacePosition,
  petCardRaceLaneProgress,
  petCardRaceRacerName,
  petCardRaceSelectionNeedsTarget,
  summarisePetCardRaceSelection,
} from './petCardRace';

const deck = buildPetCardRaceDeck('m1');

function card(match: (entry: PetCardRaceCard) => boolean): PetCardRaceCard {
  const found = deck.find(match);
  if (!found) {
    throw new Error('Missing card');
  }

  return found;
}

const lanes: PetCardRaceLane[] = [
  {
    racerId: 'shadow-panther',
    isChampion: false,
    step: 2,
    slowedSteps: 0,
    shielded: false,
    finishPosition: null,
  },
  {
    racerId: 'moonlit-wolf',
    isChampion: true,
    step: 3,
    slowedSteps: 1,
    shielded: true,
    finishPosition: null,
  },
];

describe('pet card race lane animation', () => {
  it('moves only the racer named by the event', () => {
    const event: PetCardRaceEvent = {
      sequence: 4,
      type: 'RIVAL_ADVANCE',
      racerId: 'shadow-panther',
      step: 5,
      message: 'Nyx reaches step 5 of 14',
    };

    const next = applyPetCardRaceEvent(lanes, event);

    expect(next[0]?.step).toBe(5);
    expect(next[1]?.step).toBe(3);
    expect(lanes[0]?.step).toBe(2);
  });

  it('leaves lanes alone for events without a racer or step', () => {
    const event: PetCardRaceEvent = {
      sequence: 5,
      type: 'STATION_DEAL',
      racerId: null,
      step: null,
      message: 'Final station: 4 cards dealt',
    };

    expect(applyPetCardRaceEvent(lanes, event).map((lane) => lane.step)).toEqual([2, 3]);
  });
});

describe('pet card race selection summary', () => {
  it('prompts for a selection when nothing is chosen', () => {
    expect(summarisePetCardRaceSelection([])).toMatchObject({ valid: false, steps: 0 });
  });

  it('describes a combination and the extra steps from high cards', () => {
    const summary = summarisePetCardRaceSelection([
      card((entry) => entry.rank === 'Q' && entry.suit === 'MOON'),
      card((entry) => entry.rank === 'Q' && entry.suit === 'STAR'),
    ]);

    expect(summary).toMatchObject({ valid: true, steps: 4, isTactic: false });
    expect(summary.headline).toBe('Pair · 4 steps');
    expect(summary.detail).toMatch(/high cards/);
  });

  it('explains why a selection cannot run', () => {
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
      headline: 'Trail chaser · tactic card',
    });
    expect(petCardRaceSelectionNeedsTarget([chaser])).toBe(true);
    expect(petCardRaceSelectionNeedsTarget([shield])).toBe(false);
  });
});

describe('pet card race formatting', () => {
  it('formats positions, cooldowns, progress, and racer names', () => {
    expect(formatPetCardRacePosition(1)).toBe('1st');
    expect(formatPetCardRacePosition(4)).toBe('4th');
    expect(formatPetCardRaceCooldown(0)).toBe('Ready to run');
    expect(formatPetCardRaceCooldown(3_200)).toBe('Next card in 4s');
    expect(petCardRaceLaneProgress(7, 14)).toBe(0.5);
    expect(petCardRaceLaneProgress(20, 14)).toBe(1);
    expect(petCardRaceRacerName(PET_CARD_RACE_ROSTER, 'aurora-dragon')).toBe('Kai');
  });
});
