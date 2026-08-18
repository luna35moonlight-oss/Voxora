import { describe, expect, it } from 'vitest';
import {
  PET_CARD_RACE_BALANCE,
  PetCardRaceCheckpointCount,
  PetCardRaceOpeningDealSize,
  PetCardRacePlayCooldownMs,
  type PetCardRaceCard,
  type PetCardRacePetId,
  type PetCardRaceRank,
  type PetCardRaceSuit,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';
import { buildPetCardRaceDeck } from '@voxora/domain';
import {
  createPetCardRaceMeet,
  forfeitPetCardRaceMeet,
  PET_CARD_RACE_YOU_COMPETITOR_ID,
  playPetCardRaceCards,
  simulatePetCardRace,
  startNextPetCardRace,
  takePetCardRaceMeetView,
  type PetCardRaceMeetState,
} from './pet-card-race.engine';

const T0 = Date.UTC(2026, 7, 18, 12, 0, 0);
const balance = PET_CARD_RACE_BALANCE;
/** First moment the pets are running. */
const GO = T0 + balance.countdownMs;
const deck = buildPetCardRaceDeck('spec');

function rank(value: PetCardRaceRank, suit: PetCardRaceSuit): PetCardRaceCard {
  const card = deck.find((entry) => entry.rank === value && entry.suit === suit);
  if (!card) {
    throw new Error(`Missing ${value} of ${suit}`);
  }

  return card;
}

function tactic(kind: PetCardRaceTacticKind): PetCardRaceCard {
  const card = deck.find((entry) => entry.tactic === kind);
  if (!card) {
    throw new Error(`Missing ${kind} card`);
  }

  return card;
}

function meetWithPet(petId: PetCardRacePetId = 'moonlit-wolf') {
  return createPetCardRaceMeet({
    seed: 'seed-pet-card-race',
    petId,
    nowMs: T0,
    trainerAvatarId: 'voxora-guide',
    trainerAvatarName: 'Voxora Guide',
  });
}

function race(meet: PetCardRaceMeetState) {
  const current = meet.currentRace;
  if (!current) {
    throw new Error('No current race');
  }

  return current;
}

function you(meet: PetCardRaceMeetState) {
  const competitor = race(meet).competitors.find((entry) => entry.isYou);
  if (!competitor) {
    throw new Error('No player competitor');
  }

  return competitor;
}

function rivals(meet: PetCardRaceMeetState) {
  return race(meet).competitors.filter((entry) => !entry.isYou);
}

function setHand(meet: PetCardRaceMeetState, cards: PetCardRaceCard[]) {
  race(meet).hand = [...cards];
}

function play(
  meet: PetCardRaceMeetState,
  cards: PetCardRaceCard[],
  nowMs: number,
  targetCompetitorId?: string,
) {
  playPetCardRaceCards(
    meet,
    { cardIds: cards.map((card) => card.cardId), targetCompetitorId },
    nowMs,
  );
}

describe('pet card race start', () => {
  it('lines up four competitors, counts down, and deals the opening hand', () => {
    const meet = meetWithPet();
    const view = takePetCardRaceMeetView(meet, { attemptId: 'a1', attemptNumber: 1 }, T0);
    const current = view.currentRace;

    expect(view.meetPhase).toBe('RACING');
    expect(current?.phase).toBe('COUNTDOWN');
    expect(current?.countdownRemainingMs).toBe(balance.countdownMs);
    expect(current?.competitors).toHaveLength(4);
    expect(current?.competitors.filter((competitor) => competitor.isYou)).toHaveLength(1);
    expect(current?.competitors.every((competitor) => competitor.progressMetres === 0)).toBe(true);
    expect(current?.hand).toHaveLength(PetCardRaceOpeningDealSize);
    expect(current?.checkpoints).toHaveLength(PetCardRaceCheckpointCount);
    expect(current?.checkpoints.filter((checkpoint) => checkpoint.isFinal)).toHaveLength(1);
    expect(current?.checkpoints.map((checkpoint) => checkpoint.cardsAwarded)).toEqual([
      3, 3, 3, 3, 4,
    ]);
  });

  it('pairs the player avatar with the pet and gives every rival a different pet', () => {
    const meet = meetWithPet('aurora-dragon');
    const view = takePetCardRaceMeetView(meet, { attemptId: 'a1', attemptNumber: 1 }, T0);
    const competitors = view.currentRace?.competitors ?? [];
    const yours = competitors.find((competitor) => competitor.isYou);

    expect(yours?.pet.petId).toBe('aurora-dragon');
    expect(yours?.trainerAvatarName).toBe('Voxora Guide');
    expect(new Set(competitors.map((competitor) => competitor.pet.petId)).size).toBe(4);
    expect(
      competitors
        .filter((competitor) => !competitor.isYou)
        .every((competitor) => competitor.trainerKind === 'HOUSE'),
    ).toBe(true);
  });

  it('keeps the pets still until GO', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, T0 + balance.countdownMs - 100);

    expect(race(meet).phase).toBe('COUNTDOWN');
    expect(race(meet).competitors.every((competitor) => competitor.progressMetres === 0)).toBe(
      true,
    );
    expect(() => play(meet, [rank('2', 'MOON')], T0)).toThrowError(/Wait for GO/);
  });
});

describe('pets run continuously', () => {
  it('advances every pet on the server clock without any card being played', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO + 5_000);

    expect(race(meet).phase).toBe('RUNNING');
    expect(you(meet).progressMetres).toBeGreaterThan(0);
    for (const rival of rivals(meet)) {
      expect(rival.progressMetres).toBeGreaterThan(0);
    }
  });

  it('runs the player pet at the base pace when no cards are played', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO + 10_000);

    expect(you(meet).progressMetres).toBeCloseTo(balance.baseSpeedMetresPerSecond * 10, 0);
  });

  it('reports live speed so the client can interpolate between syncs', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO + 2_000);
    const view = takePetCardRaceMeetView(meet, { attemptId: 'a1', attemptNumber: 1 }, GO + 2_000);
    const yours = view.currentRace?.competitors.find((competitor) => competitor.isYou);

    expect(yours?.speedMetresPerSecond).toBeGreaterThan(0);
    expect(view.currentRace?.serverTimeMs).toBe(GO + 2_000);
  });
});

describe('cards influence the running race', () => {
  it('makes the pet faster for the duration of a combination instead of moving it', () => {
    const boosted = meetWithPet();
    const plain = meetWithPet();
    simulatePetCardRace(boosted, GO);
    simulatePetCardRace(plain, GO);

    setHand(boosted, [rank('K', 'MOON'), rank('K', 'STAR')]);
    const before = you(boosted).progressMetres;
    play(boosted, [rank('K', 'MOON'), rank('K', 'STAR')], GO);

    // The play itself moves nothing: it changes the pace from here on.
    expect(you(boosted).progressMetres).toBe(before);

    simulatePetCardRace(boosted, GO + 4_000);
    simulatePetCardRace(plain, GO + 4_000);
    expect(you(boosted).progressMetres).toBeGreaterThan(you(plain).progressMetres);
  });

  it('holds the player to a five second wait between committed plays', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [rank('4', 'MOON'), rank('5', 'MOON'), rank('6', 'MOON')]);

    play(meet, [rank('4', 'MOON')], GO);
    expect(() => play(meet, [rank('5', 'MOON')], GO + 1_000)).toThrowError(/Wait 4s/);
    expect(() => play(meet, [rank('5', 'MOON')], GO + PetCardRacePlayCooldownMs)).not.toThrow();
  });

  it('rejects cards that were never dealt and selections that are not combinations', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [rank('4', 'MOON'), rank('9', 'STAR')]);

    expect(() => play(meet, [rank('2', 'FLAME')], GO)).toThrowError(/not in your hand/);
    expect(() => play(meet, [rank('4', 'MOON'), rank('9', 'STAR')], GO)).toThrowError(
      /must make a pair/,
    );
  });

  it('delivers checkpoint cards into the hand while the race keeps running', () => {
    const meet = meetWithPet();
    const firstCheckpointMetres = balance.courseMetres * balance.checkpointFractions[0]!;
    const secondsToFirstCheckpoint = firstCheckpointMetres / balance.baseSpeedMetresPerSecond + 0.5;

    simulatePetCardRace(meet, GO + secondsToFirstCheckpoint * 1_000);

    expect(race(meet).checkpointsReached).toBe(1);
    expect(race(meet).hand.length).toBe(PetCardRaceOpeningDealSize + 3);
    expect(race(meet).phase).toBe('RUNNING');
    expect(race(meet).pendingEvents.some((event) => event.type === 'CHECKPOINT_CARDS')).toBe(true);
  });
});

describe('tactic cards are visible race events', () => {
  it('sprints the pet with a burst of speed', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [tactic('SPRINT')]);

    play(meet, [tactic('SPRINT')], GO);

    expect(you(meet).effects.some((effect) => effect.kind === 'SPRINT')).toBe(true);
    expect(race(meet).pendingEvents.some((event) => event.type === 'SPRINT')).toBe(true);
  });

  it('weighs down every rival', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [tactic('WEIGHTS')]);

    play(meet, [tactic('WEIGHTS')], GO);

    expect(
      rivals(meet).every((rival) => rival.effects.some((effect) => effect.kind === 'WEIGHTS')),
    ).toBe(true);
    expect(race(meet).pendingEvents.some((event) => event.type === 'WEIGHTS')).toBe(true);
  });

  it('chases one named rival and refuses a missing or self target', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [tactic('CHASER'), tactic('CHASER')]);
    const target = rivals(meet)[0]!;

    expect(() => play(meet, [tactic('CHASER')], GO)).toThrowError(/Choose which rival/);
    expect(() => play(meet, [tactic('CHASER')], GO, PET_CARD_RACE_YOU_COMPETITOR_ID)).toThrowError(
      /cannot be sent after your own pet/,
    );

    play(meet, [tactic('CHASER')], GO, target.competitorId);

    expect(target.effects.some((effect) => effect.kind === 'CHASED')).toBe(true);
    expect(race(meet).pendingEvents.some((event) => event.type === 'CHASER')).toBe(true);
  });

  it('puts mud on the course that only hinders rivals', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [tactic('MUD')]);

    play(meet, [tactic('MUD')], GO);
    const obstacle = race(meet).obstacles[0];

    expect(obstacle).toMatchObject({ kind: 'MUD', affectsYou: false });
    expect(obstacle!.endMetres).toBeGreaterThan(obstacle!.startMetres);
    expect(race(meet).pendingEvents.some((event) => event.type === 'MUD_PLACED')).toBe(true);
  });

  it('raises a shield that blocks the next house tactic', () => {
    const meet = meetWithPet();
    simulatePetCardRace(meet, GO);
    setHand(meet, [tactic('SHIELD')]);
    play(meet, [tactic('SHIELD')], GO);

    expect(you(meet).shielded).toBe(true);

    // Run far enough for the second checkpoint, which is the first the house answers.
    const secondCheckpointMetres = balance.courseMetres * balance.checkpointFractions[1]!;
    simulatePetCardRace(
      meet,
      GO + (secondCheckpointMetres / balance.baseSpeedMetresPerSecond + 1) * 1_000,
    );

    expect(race(meet).checkpointsReached).toBeGreaterThanOrEqual(2);
    expect(race(meet).pendingEvents.some((event) => event.type === 'SHIELD_BLOCKED')).toBe(true);
  });
});

describe('race and meet completion', () => {
  it('records placements as pets cross the line and scores the race', () => {
    const meet = meetWithPet();
    const raceSeconds = balance.courseMetres / balance.baseSpeedMetresPerSecond + 20;
    simulatePetCardRace(meet, GO + raceSeconds * 1_000);

    const result = meet.completedRaces[0];
    expect(race(meet).phase).toBe('FINISHED');
    expect(result).toBeDefined();
    expect(result?.order).toHaveLength(4);
    expect(result?.order.map((entry) => entry.position)).toEqual([1, 2, 3, 4]);
    expect(result?.yourPosition).toBeGreaterThanOrEqual(1);
    expect(result?.score).toBeGreaterThan(0);
    expect(meet.meetPhase).toBe('RACE_RESULT');
    expect(meet.standings.reduce((total, standing) => total + standing.points, 0)).toBeGreaterThan(
      0,
    );
  });

  it('requires a different pet for the next race and completes the meet after three', () => {
    const meet = meetWithPet('moonlit-wolf');
    const raceMs = (balance.courseMetres / balance.baseSpeedMetresPerSecond + 20) * 1_000;
    simulatePetCardRace(meet, GO + raceMs);

    expect(() => startNextPetCardRace(meet, 'moonlit-wolf', GO + raceMs)).toThrowError(
      /already raced in this meet/,
    );

    startNextPetCardRace(meet, 'aurora-dragon', GO + raceMs);
    simulatePetCardRace(meet, GO + raceMs * 2 + balance.countdownMs);
    startNextPetCardRace(meet, 'star-kitten', GO + raceMs * 2 + balance.countdownMs);
    simulatePetCardRace(meet, GO + raceMs * 3 + balance.countdownMs * 2);

    expect(meet.completedRaces).toHaveLength(3);
    expect(meet.meetPhase).toBe('COMPLETE');
    expect(meet.usedPetIds).toEqual(['moonlit-wolf', 'aurora-dragon', 'star-kitten']);

    const view = takePetCardRaceMeetView(meet, { attemptId: 'a1', attemptNumber: 1 }, GO);
    expect(view.result?.races).toHaveLength(3);
    expect(view.result?.standings).toHaveLength(4);
    expect(view.selectablePetIds).toEqual(['shadow-panther']);
  });

  it('forfeits a meet without scoring it', () => {
    const meet = meetWithPet();
    forfeitPetCardRaceMeet(meet, GO + 1_000);

    expect(meet.meetPhase).toBe('FORFEITED');
    expect(meet.totalScore).toBe(0);
    expect(() => forfeitPetCardRaceMeet(meet, GO + 2_000)).toThrowError(/already finished/);
  });
});
