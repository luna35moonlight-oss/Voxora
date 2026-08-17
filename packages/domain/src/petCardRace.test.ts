import { describe, expect, it } from 'vitest';
import type { PetCardRaceCard, PetCardRaceRank, PetCardRaceSuit } from '@voxora/contracts';
import {
  buildPetCardRaceDeck,
  evaluatePetCardRaceSelection,
  findBestPetCardRaceSelection,
  scorePetCardRace,
  sortPetCardRaceHand,
} from './petCardRace';

const deck = buildPetCardRaceDeck('r1');

function rankCard(rank: PetCardRaceRank, suit: PetCardRaceSuit): PetCardRaceCard {
  const card = deck.find((entry) => entry.rank === rank && entry.suit === suit);
  if (!card) {
    throw new Error(`Missing ${rank} of ${suit}`);
  }

  return card;
}

function jokerCard(index: number): PetCardRaceCard {
  const jokers = deck.filter((entry) => entry.type === 'JOKER');
  const card = jokers[index];
  if (!card) {
    throw new Error(`Missing joker ${index}`);
  }

  return card;
}

function tacticCard(): PetCardRaceCard {
  const card = deck.find((entry) => entry.tactic === 'SHIELD');
  if (!card) {
    throw new Error('Missing shield card');
  }

  return card;
}

describe('pet card race deck', () => {
  it('deals a 52 card deck plus two jokers and two copies of every tactic card', () => {
    expect(deck).toHaveLength(64);
    expect(deck.filter((card) => card.type === 'RANK')).toHaveLength(52);
    expect(deck.filter((card) => card.type === 'JOKER')).toHaveLength(2);
    expect(deck.filter((card) => card.tactic === 'MUD')).toHaveLength(2);
    expect(new Set(deck.map((card) => card.cardId)).size).toBe(deck.length);
  });

  it('marks 10, J, Q, and K as the fast cards', () => {
    expect(deck.filter((card) => card.fast)).toHaveLength(16);
    expect(rankCard('9', 'MOON').fast).toBe(false);
    expect(rankCard('10', 'MOON').fast).toBe(true);
  });
});

describe('pet card race selections', () => {
  it('advances one step for a low single and two for a high single', () => {
    expect(evaluatePetCardRaceSelection([rankCard('4', 'MOON')])).toMatchObject({
      valid: true,
      kind: 'SINGLE',
      steps: 1,
    });
    expect(evaluatePetCardRaceSelection([rankCard('K', 'MOON')])).toMatchObject({
      valid: true,
      kind: 'SINGLE',
      baseSteps: 1,
      fastBonus: 1,
      steps: 2,
    });
  });

  it('scores pairs, three of a kind, runs, three pair, full house, and four of a kind', () => {
    expect(
      evaluatePetCardRaceSelection([rankCard('2', 'MOON'), rankCard('2', 'STAR')]),
    ).toMatchObject({ kind: 'PAIR', steps: 2 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('3', 'MOON'),
        rankCard('3', 'STAR'),
      ]),
    ).toMatchObject({ kind: 'TWO_PAIR', steps: 3 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
      ]),
    ).toMatchObject({ kind: 'THREE_OF_A_KIND', steps: 3 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('A', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('3', 'CRYSTAL'),
        rankCard('4', 'FLAME'),
      ]),
    ).toMatchObject({ kind: 'RUN_OF_FOUR', steps: 4 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('3', 'MOON'),
        rankCard('3', 'STAR'),
        rankCard('4', 'MOON'),
        rankCard('4', 'STAR'),
      ]),
    ).toMatchObject({ kind: 'THREE_PAIR', steps: 4 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
        rankCard('3', 'MOON'),
        rankCard('3', 'STAR'),
      ]),
    ).toMatchObject({ kind: 'FULL_HOUSE', steps: 5 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
        rankCard('2', 'FLAME'),
      ]),
    ).toMatchObject({ kind: 'FOUR_OF_A_KIND', steps: 6 });
  });

  it('adds a step for every high card inside a combination', () => {
    expect(
      evaluatePetCardRaceSelection([rankCard('Q', 'MOON'), rankCard('Q', 'STAR')]),
    ).toMatchObject({ kind: 'PAIR', baseSteps: 2, fastBonus: 2, steps: 4 });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('K', 'MOON'),
        rankCard('K', 'STAR'),
        rankCard('K', 'CRYSTAL'),
        rankCard('K', 'FLAME'),
      ]),
      // Four kings would earn four high-card steps, but the bonus is capped at two.
    ).toMatchObject({ kind: 'FOUR_OF_A_KIND', baseSteps: 6, fastBonus: 2, steps: 8 });
  });

  it('turns jokers into whichever card helps the selection most', () => {
    expect(evaluatePetCardRaceSelection([rankCard('7', 'MOON'), jokerCard(0)])).toMatchObject({
      kind: 'PAIR',
      steps: 2,
    });

    expect(evaluatePetCardRaceSelection([rankCard('10', 'MOON'), jokerCard(0)])).toMatchObject({
      kind: 'PAIR',
      fastBonus: 2,
      steps: 4,
    });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('J', 'MOON'),
        rankCard('J', 'STAR'),
        jokerCard(0),
        jokerCard(1),
      ]),
    ).toMatchObject({ kind: 'FOUR_OF_A_KIND', fastBonus: 2, steps: 8 });
  });

  it('rejects selections that are not combinations', () => {
    expect(
      evaluatePetCardRaceSelection([rankCard('5', 'MOON'), rankCard('8', 'STAR')]),
    ).toMatchObject({ valid: false, steps: 0, reason: 'Two cards must make a pair' });

    expect(evaluatePetCardRaceSelection([])).toMatchObject({ valid: false });
    expect(
      evaluatePetCardRaceSelection([rankCard('5', 'MOON'), rankCard('5', 'MOON')]),
    ).toMatchObject({ valid: false, reason: 'The same card cannot be selected twice' });
  });

  it('plays a tactic card on its own and never as part of a combination', () => {
    expect(evaluatePetCardRaceSelection([tacticCard()])).toMatchObject({
      valid: true,
      kind: 'TACTIC',
      steps: 0,
    });
    expect(evaluatePetCardRaceSelection([tacticCard(), rankCard('5', 'MOON')])).toMatchObject({
      valid: false,
      reason: 'A tactic card is played on its own',
    });
  });
});

describe('pet card race scoring', () => {
  it('rewards finishing position, combinations, tactics, and winning margin', () => {
    expect(
      scorePetCardRace({
        championPosition: 1,
        combosPlayed: 4,
        effectiveTactics: 2,
        marginSteps: 3,
        photoFinish: false,
      }),
    ).toEqual({
      positionPoints: 40,
      comboPoints: 12,
      tacticPoints: 8,
      marginBonus: 6,
      photoFinishBonus: 0,
      total: 66,
    });
  });

  it('gives no margin bonus when the champion did not win and caps the race score', () => {
    expect(
      scorePetCardRace({
        championPosition: 3,
        combosPlayed: 0,
        effectiveTactics: 0,
        marginSteps: 5,
        photoFinish: false,
      }),
    ).toMatchObject({ positionPoints: 12, marginBonus: 0, total: 12 });

    expect(
      scorePetCardRace({
        championPosition: 1,
        combosPlayed: 20,
        effectiveTactics: 9,
        marginSteps: 12,
        photoFinish: true,
      }).total,
    ).toBe(100);
  });
});

describe('pet card race best play suggestion', () => {
  it('finds the highest scoring combination hiding in a large hand', () => {
    const hand = [
      rankCard('3', 'MOON'),
      rankCard('9', 'STAR'),
      rankCard('K', 'MOON'),
      rankCard('K', 'STAR'),
      rankCard('K', 'CRYSTAL'),
      rankCard('4', 'FLAME'),
      tacticCard(),
    ];

    const best = findBestPetCardRaceSelection(hand);

    expect(best?.map((card) => card.rank)).toEqual(['K', 'K', 'K']);
    expect(evaluatePetCardRaceSelection(best ?? [])).toMatchObject({
      kind: 'THREE_OF_A_KIND',
      steps: 5,
    });
  });

  it('prefers a full house over the pair it contains', () => {
    const best = findBestPetCardRaceSelection([
      rankCard('5', 'MOON'),
      rankCard('5', 'STAR'),
      rankCard('5', 'CRYSTAL'),
      rankCard('8', 'MOON'),
      rankCard('8', 'STAR'),
    ]);

    expect(evaluatePetCardRaceSelection(best ?? [])).toMatchObject({ kind: 'FULL_HOUSE' });
  });

  it('spends jokers to complete a run of four', () => {
    const best = findBestPetCardRaceSelection([
      rankCard('5', 'MOON'),
      rankCard('6', 'STAR'),
      rankCard('8', 'CRYSTAL'),
      jokerCard(0),
    ]);

    expect(evaluatePetCardRaceSelection(best ?? [])).toMatchObject({ kind: 'RUN_OF_FOUR' });
  });

  it('falls back to a single card and gives up on a hand of only tactic cards', () => {
    expect(findBestPetCardRaceSelection([rankCard('2', 'MOON')])?.[0]?.rank).toBe('2');
    expect(findBestPetCardRaceSelection([tacticCard()])).toBeNull();
    expect(findBestPetCardRaceSelection([])).toBeNull();
  });
});

describe('pet card race hand order', () => {
  it('shows rank cards first, then jokers, then tactic cards', () => {
    const ordered = sortPetCardRaceHand([
      tacticCard(),
      jokerCard(0),
      rankCard('K', 'MOON'),
      rankCard('3', 'STAR'),
    ]);

    expect(ordered.map((card) => card.type)).toEqual(['RANK', 'RANK', 'JOKER', 'TACTIC']);
    expect(ordered[0]?.rank).toBe('3');
  });
});
