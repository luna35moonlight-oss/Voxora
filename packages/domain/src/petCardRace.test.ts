import { describe, expect, it } from 'vitest';
import {
  PET_CARD_RACE_BALANCE,
  type PetCardRaceCard,
  type PetCardRaceRank,
  type PetCardRaceSuit,
} from '@voxora/contracts';
import {
  buildPetCardRaceDeck,
  evaluatePetCardRaceSelection,
  petCardRacePet,
  petCardRaceProfileFor,
  scorePetCardRace,
  sortPetCardRaceHand,
} from './petCardRace';

const deck = buildPetCardRaceDeck('r1');
const boosts = PET_CARD_RACE_BALANCE.comboBoosts;

function rankCard(rank: PetCardRaceRank, suit: PetCardRaceSuit): PetCardRaceCard {
  const card = deck.find((entry) => entry.rank === rank && entry.suit === suit);
  if (!card) {
    throw new Error(`Missing ${rank} of ${suit}`);
  }

  return card;
}

function jokerCard(index: number): PetCardRaceCard {
  const card = deck.filter((entry) => entry.type === 'JOKER')[index];
  if (!card) {
    throw new Error(`Missing joker ${index}`);
  }

  return card;
}

function tacticCard(kind: 'SHIELD' | 'CHASER' | 'SPRINT'): PetCardRaceCard {
  const card = deck.find((entry) => entry.tactic === kind);
  if (!card) {
    throw new Error(`Missing ${kind} card`);
  }

  return card;
}

describe('pet card race card pool', () => {
  it('holds 52 rank cards, two jokers, and two copies of every tactic card', () => {
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

describe('pet card race selections grant speed, not distance', () => {
  it('turns each combination into its configured speed boost and duration', () => {
    expect(evaluatePetCardRaceSelection([rankCard('4', 'MOON')])).toMatchObject({
      valid: true,
      kind: 'SINGLE',
      speedMultiplier: boosts.SINGLE.multiplier,
      durationMs: boosts.SINGLE.durationMs,
    });

    expect(
      evaluatePetCardRaceSelection([rankCard('2', 'MOON'), rankCard('2', 'STAR')]),
    ).toMatchObject({ kind: 'PAIR', speedMultiplier: boosts.PAIR.multiplier });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
      ]),
    ).toMatchObject({
      kind: 'THREE_OF_A_KIND',
      speedMultiplier: boosts.THREE_OF_A_KIND.multiplier,
    });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('A', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('3', 'CRYSTAL'),
        rankCard('4', 'FLAME'),
      ]),
    ).toMatchObject({ kind: 'RUN_OF_FOUR', speedMultiplier: boosts.RUN_OF_FOUR.multiplier });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('3', 'MOON'),
        rankCard('3', 'STAR'),
        rankCard('4', 'MOON'),
        rankCard('4', 'STAR'),
      ]),
    ).toMatchObject({ kind: 'THREE_PAIR', speedMultiplier: boosts.THREE_PAIR.multiplier });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
        rankCard('3', 'MOON'),
        rankCard('3', 'STAR'),
      ]),
    ).toMatchObject({ kind: 'FULL_HOUSE', speedMultiplier: boosts.FULL_HOUSE.multiplier });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('2', 'MOON'),
        rankCard('2', 'STAR'),
        rankCard('2', 'CRYSTAL'),
        rankCard('2', 'FLAME'),
      ]),
    ).toMatchObject({
      kind: 'FOUR_OF_A_KIND',
      speedMultiplier: boosts.FOUR_OF_A_KIND.multiplier,
      durationMs: boosts.FOUR_OF_A_KIND.durationMs,
    });
  });

  it('ranks a stronger combination above a weaker one', () => {
    const pair = evaluatePetCardRaceSelection([rankCard('5', 'MOON'), rankCard('5', 'STAR')]);
    const quad = evaluatePetCardRaceSelection([
      rankCard('5', 'MOON'),
      rankCard('5', 'STAR'),
      rankCard('5', 'CRYSTAL'),
      rankCard('5', 'FLAME'),
    ]);

    expect(quad.speedMultiplier).toBeGreaterThan(pair.speedMultiplier);
    expect(quad.durationMs).toBeGreaterThan(pair.durationMs);
  });

  it('adds a capped bonus for high cards inside the combination', () => {
    const lowPair = evaluatePetCardRaceSelection([rankCard('3', 'MOON'), rankCard('3', 'STAR')]);
    const highPair = evaluatePetCardRaceSelection([rankCard('Q', 'MOON'), rankCard('Q', 'STAR')]);
    const fourKings = evaluatePetCardRaceSelection([
      rankCard('K', 'MOON'),
      rankCard('K', 'STAR'),
      rankCard('K', 'CRYSTAL'),
      rankCard('K', 'FLAME'),
    ]);

    expect(highPair.speedMultiplier).toBeGreaterThan(lowPair.speedMultiplier);
    expect(highPair.fastCardBonus).toBeCloseTo(PET_CARD_RACE_BALANCE.fastCardBonusPerCard * 2, 5);
    expect(fourKings.fastCardBonus).toBeCloseTo(PET_CARD_RACE_BALANCE.fastCardBonusCap, 5);
  });

  it('turns jokers into whichever card helps the selection most', () => {
    expect(evaluatePetCardRaceSelection([rankCard('7', 'MOON'), jokerCard(0)])).toMatchObject({
      kind: 'PAIR',
    });

    expect(
      evaluatePetCardRaceSelection([
        rankCard('J', 'MOON'),
        rankCard('J', 'STAR'),
        jokerCard(0),
        jokerCard(1),
      ]),
    ).toMatchObject({ kind: 'FOUR_OF_A_KIND' });
  });

  it('rejects selections that are not combinations', () => {
    expect(
      evaluatePetCardRaceSelection([rankCard('5', 'MOON'), rankCard('8', 'STAR')]),
    ).toMatchObject({ valid: false, speedMultiplier: 1, reason: 'Two cards must make a pair' });
    expect(evaluatePetCardRaceSelection([])).toMatchObject({ valid: false });
  });

  it('plays a tactic card on its own with its configured effect', () => {
    expect(evaluatePetCardRaceSelection([tacticCard('SPRINT')])).toMatchObject({
      valid: true,
      kind: 'TACTIC',
      speedMultiplier: PET_CARD_RACE_BALANCE.tactics.SPRINT.multiplier,
      durationMs: PET_CARD_RACE_BALANCE.tactics.SPRINT.durationMs,
    });
    // A shield is a charge, not a timed boost: no multiplier and no duration.
    expect(evaluatePetCardRaceSelection([tacticCard('SHIELD')])).toMatchObject({
      kind: 'TACTIC',
      speedMultiplier: 1,
      durationMs: 0,
    });
    expect(
      evaluatePetCardRaceSelection([tacticCard('CHASER'), rankCard('5', 'MOON')]),
    ).toMatchObject({ valid: false, reason: 'A tactic card is played on its own' });
  });
});

describe('pet identity and race profiles', () => {
  it('keeps every racer visually distinct and marked as a development placeholder', () => {
    const panther = petCardRacePet('shadow-panther');
    const wolf = petCardRacePet('moonlit-wolf');
    const dragon = petCardRacePet('aurora-dragon');
    const mystic = petCardRacePet('star-kitten');

    expect(
      new Set([panther.silhouette, wolf.silhouette, dragon.silhouette, mystic.silhouette]).size,
    ).toBe(4);
    expect(panther.source).toBe('DEVELOPMENT_PLACEHOLDER');
    expect(dragon.speciesFamily).toBe('dragon-lizard');
  });

  it('routes every pet through a race profile that is not owner approved yet', () => {
    const profile = petCardRaceProfileFor('shadow-panther');

    expect(profile.approved).toBe(false);
    expect(profile.openingMix.runCards + profile.openingMix.tacticCards).toBe(8);
    expect(petCardRaceProfileFor('aurora-dragon').profileKey).toBe(profile.profileKey);
  });
});

describe('pet card race scoring', () => {
  it('rewards finishing position, combinations, tactics, and winning margin', () => {
    const breakdown = scorePetCardRace({
      position: 1,
      combosPlayed: 4,
      effectiveTactics: 2,
      marginMetres: 35,
      photoFinish: false,
    });

    expect(breakdown).toMatchObject({
      positionPoints: PET_CARD_RACE_BALANCE.scoring.positionPoints[0],
      comboPoints: 12,
      tacticPoints: 8,
      marginPoints: 3,
      photoFinishPoints: 0,
    });
    expect(breakdown.total).toBe(63);
  });

  it('gives no margin points when the pet did not win and caps the race score', () => {
    expect(
      scorePetCardRace({
        position: 3,
        combosPlayed: 0,
        effectiveTactics: 0,
        marginMetres: 90,
        photoFinish: false,
      }),
    ).toMatchObject({ positionPoints: 12, marginPoints: 0, total: 12 });

    expect(
      scorePetCardRace({
        position: 1,
        combosPlayed: 30,
        effectiveTactics: 20,
        marginMetres: 900,
        photoFinish: true,
      }).total,
    ).toBe(PET_CARD_RACE_BALANCE.scoring.maxRaceScore);
  });
});

describe('pet card race hand order', () => {
  it('shows rank cards first, then jokers, then tactic cards', () => {
    const ordered = sortPetCardRaceHand([
      tacticCard('SHIELD'),
      jokerCard(0),
      rankCard('K', 'MOON'),
      rankCard('3', 'STAR'),
    ]);

    expect(ordered.map((card) => card.type)).toEqual(['RANK', 'RANK', 'JOKER', 'TACTIC']);
    expect(ordered[0]?.rank).toBe('3');
  });
});
