import { describe, expect, it } from 'vitest';
import {
  PetCardRaceCardsPerRace,
  PetCardRaceOpeningDealSize,
  PetCardRacePlayCooldownMs,
  PetCardRaceRivalTickMs,
  PetCardRaceSlowSteps,
  PetCardRaceSprintSteps,
  PetCardRaceStationCount,
  PetCardRaceStationSteps,
  PetCardRaceTrackLength,
  type PetCardRaceCard,
  type PetCardRaceRacerId,
  type PetCardRaceRank,
  type PetCardRaceSuit,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';
import { buildPetCardRaceDeck } from '@voxora/domain';
import {
  createPetCardRaceMeet,
  forfeitPetCardRaceMeet,
  PetCardRaceRuleError,
  playPetCardRaceCards,
  startNextPetCardRace,
  syncPetCardRace,
  takePetCardRaceMeetView,
  type PetCardRaceMeetState,
} from './pet-card-race.engine';

const T0 = Date.UTC(2026, 7, 17, 12, 0, 0);
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

function meetWithChampion(championRacerId: PetCardRaceRacerId = 'moonlit-wolf') {
  return createPetCardRaceMeet({ seed: 'seed-pet-card-race', championRacerId, nowMs: T0 });
}

function race(meet: PetCardRaceMeetState) {
  const current = meet.currentRace;
  if (!current) {
    throw new Error('No current race');
  }

  return current;
}

function setHand(meet: PetCardRaceMeetState, cards: PetCardRaceCard[]) {
  race(meet).hand = [...cards];
}

function resetChampionLane(meet: PetCardRaceMeetState) {
  const lane = race(meet).lanes[race(meet).championRacerId];
  if (lane) {
    lane.step = 0;
    lane.slowedSteps = 0;
  }
}

function laneStep(meet: PetCardRaceMeetState, racerId: PetCardRaceRacerId) {
  return race(meet).lanes[racerId]?.step ?? 0;
}

/**
 * Step the champion reached on its last card play. Read from the event rather than the lane
 * because opening a station lets the rival trainers answer immediately afterwards.
 */
function stepAfterLastPlay(meet: PetCardRaceMeetState) {
  const advances = race(meet).pendingEvents.filter(
    (event) => event.type === 'CHAMPION_ADVANCE' && event.racerId === race(meet).championRacerId,
  );

  return advances[advances.length - 1]?.step ?? 0;
}

function play(
  meet: PetCardRaceMeetState,
  cards: PetCardRaceCard[],
  nowMs: number,
  targetRacerId?: PetCardRaceRacerId,
) {
  playPetCardRaceCards(meet, { cardIds: cards.map((card) => card.cardId), targetRacerId }, nowMs);
}

/**
 * Parks the champion one step from the line with a clean lane. Every station is opened first,
 * because each one lets the rival trainers answer with a tactic that moves or slows the champion.
 */
function parkChampionOnTheLine(meet: PetCardRaceMeetState, nowMs: number) {
  const current = race(meet);
  const lane = current.lanes[current.championRacerId];
  if (!lane) {
    throw new Error('No champion lane');
  }

  for (let pass = 0; pass < 10 && current.stationsDealt < PetCardRaceStationCount; pass += 1) {
    lane.step = PetCardRaceTrackLength - 1;
    lane.slowedSteps = 0;
    syncPetCardRace(meet, nowMs);
  }

  lane.step = PetCardRaceTrackLength - 1;
  lane.slowedSteps = 0;
}

describe('pet card race meet setup', () => {
  it('starts every race with the same mixed deal of eight cards', () => {
    const view = takePetCardRaceMeetView(
      meetWithChampion(),
      { attemptId: 'a1', attemptNumber: 1 },
      T0,
    );
    const hand = view.currentRace?.hand ?? [];

    expect(view.meetPhase).toBe('RACING');
    expect(view.raceNumber).toBe(1);
    expect(view.racesTotal).toBe(3);
    expect(hand).toHaveLength(PetCardRaceOpeningDealSize);
    expect(hand.filter((card) => card.type === 'TACTIC')).toHaveLength(2);
    expect(hand.filter((card) => card.type !== 'TACTIC')).toHaveLength(6);
    expect(view.currentRace?.stationsDealt).toBe(0);
    expect(view.currentRace?.cardsLeftToDeal).toBe(13);
    expect(view.currentRace?.lanes.map((lane) => lane.step)).toEqual([0, 0, 0, 0]);
    expect(view.currentRace?.lanes.filter((lane) => lane.isChampion)).toHaveLength(1);
    expect(view.availableRacerIds).not.toContain('moonlit-wolf');
  });

  it('deals every racer a different opening mix', () => {
    const first = meetWithChampion('moonlit-wolf');
    const second = createPetCardRaceMeet({
      seed: 'another-seed',
      championRacerId: 'star-kitten',
      nowMs: T0,
    });

    expect(race(first).hand.map((card) => card.label)).not.toEqual(
      race(second).hand.map((card) => card.label),
    );
  });

  it('deals three extra cards at each station and four at the final one', () => {
    const meet = meetWithChampion();
    const current = race(meet);
    const dealtPerStation: number[] = [];

    // Walk the champion up the track so every station opens.
    for (const step of PetCardRaceStationSteps) {
      const lane = current.lanes[current.championRacerId];
      if (lane) {
        lane.step = step;
        lane.slowedSteps = 0;
      }

      const before = current.hand.length;
      syncPetCardRace(meet, T0);
      dealtPerStation.push(current.hand.length - before);
    }

    expect(dealtPerStation).toEqual([3, 3, 3, 4]);
    expect(current.stationsDealt).toBe(4);
    expect(current.hand).toHaveLength(PetCardRaceCardsPerRace);
  });
});

describe('pet card race card plays', () => {
  it('advances the champion by the combination value and adds a step per fast card', () => {
    const meet = meetWithChampion();
    setHand(meet, [rank('3', 'MOON'), rank('3', 'STAR')]);

    play(meet, [rank('3', 'MOON'), rank('3', 'STAR')], T0);
    expect(stepAfterLastPlay(meet)).toBe(2);

    // Back to the line so the station tactic that answered the first play cannot skew the second.
    resetChampionLane(meet);
    setHand(meet, [rank('K', 'MOON'), rank('K', 'STAR')]);
    play(meet, [rank('K', 'MOON'), rank('K', 'STAR')], T0 + PetCardRacePlayCooldownMs);

    // Two for the pair plus the capped high-card bonus.
    expect(stepAfterLastPlay(meet)).toBe(4);
    expect(race(meet).combosPlayed).toBe(2);
  });

  it('holds the player to a five second wait between selections', () => {
    const meet = meetWithChampion();
    setHand(meet, [rank('4', 'MOON'), rank('5', 'MOON'), rank('6', 'MOON')]);

    play(meet, [rank('4', 'MOON')], T0);

    expect(() => play(meet, [rank('5', 'MOON')], T0 + 1_000)).toThrowError(PetCardRaceRuleError);
    expect(() => play(meet, [rank('5', 'MOON')], T0 + 1_000)).toThrowError(/Wait 4s/);
    expect(() => play(meet, [rank('5', 'MOON')], T0 + PetCardRacePlayCooldownMs)).not.toThrow();
  });

  it('rejects cards that are not in hand and selections that are not combinations', () => {
    const meet = meetWithChampion();
    setHand(meet, [rank('4', 'MOON'), rank('9', 'STAR')]);

    expect(() => play(meet, [rank('2', 'FLAME')], T0)).toThrowError(/not in your hand/);
    expect(() => play(meet, [rank('4', 'MOON'), rank('9', 'STAR')], T0)).toThrowError(
      /must make a pair/,
    );
    expect(laneStep(meet, 'moonlit-wolf')).toBe(0);
  });

  it('lets a joker stand in for a fast card', () => {
    const meet = meetWithChampion();
    const joker = deck.filter((card) => card.type === 'JOKER')[0];
    if (!joker) {
      throw new Error('Missing joker');
    }

    setHand(meet, [rank('Q', 'MOON'), joker]);
    play(meet, [rank('Q', 'MOON'), joker], T0);

    expect(stepAfterLastPlay(meet)).toBe(4);
  });
});

describe('pet card race tactic cards', () => {
  it('slows every rival with heavy paws so their next run card is lost', () => {
    const meet = meetWithChampion();
    setHand(meet, [tactic('WEIGHTS')]);

    play(meet, [tactic('WEIGHTS')], T0);

    const rivals = ['shadow-panther', 'star-kitten', 'aurora-dragon'] as const;
    expect(rivals.map((id) => race(meet).lanes[id]?.slowedSteps)).toEqual([
      PetCardRaceSlowSteps,
      PetCardRaceSlowSteps,
      PetCardRaceSlowSteps,
    ]);
    expect(race(meet).effectiveTactics).toBe(1);

    syncPetCardRace(meet, T0 + PetCardRaceRivalTickMs * 3);

    const rivalSteps = rivals.map((id) => laneStep(meet, id));
    expect(rivalSteps.reduce((total, step) => total + step, 0)).toBeLessThan(3);
  });

  it('chases one named rival back a step and refuses an untargeted or self target', () => {
    const meet = meetWithChampion();
    setHand(meet, [tactic('CHASER'), tactic('CHASER')]);
    syncPetCardRace(meet, T0 + PetCardRaceRivalTickMs * 6);

    const target = (['shadow-panther', 'star-kitten', 'aurora-dragon'] as const).find(
      (id) => laneStep(meet, id) > 0,
    );
    expect(target).toBeDefined();
    const before = laneStep(meet, target!);

    expect(() => play(meet, [tactic('CHASER')], T0 + PetCardRaceRivalTickMs * 6)).toThrowError(
      /Choose which rival/,
    );
    expect(() =>
      play(meet, [tactic('CHASER')], T0 + PetCardRaceRivalTickMs * 6, 'moonlit-wolf'),
    ).toThrowError(/cannot be sent after your own pet/);

    play(meet, [tactic('CHASER')], T0 + PetCardRaceRivalTickMs * 6, target);
    expect(laneStep(meet, target!)).toBe(before - 1);
  });

  it('blocks the next rival tactic with a moon shield', () => {
    const meet = meetWithChampion();
    setHand(meet, [tactic('SHIELD')]);
    play(meet, [tactic('SHIELD')], T0);
    expect(race(meet).lanes['moonlit-wolf']?.shielded).toBe(true);

    const lane = race(meet).lanes['moonlit-wolf'];
    if (lane) {
      // Far enough for the second station, which is the first one the rivals answer.
      lane.step = 7;
    }

    syncPetCardRace(meet, T0 + PetCardRaceRivalTickMs);

    expect(race(meet).stationsDealt).toBe(2);
    expect(race(meet).lanes['moonlit-wolf']?.shielded).toBe(false);
    expect(race(meet).lanes['moonlit-wolf']?.slowedSteps).toBe(0);
    expect(race(meet).pendingEvents.some((event) => event.type === 'SHIELD_BLOCKED')).toBe(true);
  });

  it('sprints the champion forward without spending a run card', () => {
    const meet = meetWithChampion();
    setHand(meet, [tactic('SPRINT')]);
    play(meet, [tactic('SPRINT')], T0);

    expect(laneStep(meet, 'moonlit-wolf')).toBe(PetCardRaceSprintSteps);
  });
});

describe('pet card race rivals', () => {
  it('advances rivals on the server clock, one run card per tick', () => {
    const meet = meetWithChampion();
    syncPetCardRace(meet, T0 + PetCardRaceRivalTickMs * 4);

    const rivalTotal = (['shadow-panther', 'star-kitten', 'aurora-dragon'] as const)
      .map((id) => laneStep(meet, id))
      .reduce((total, step) => total + step, 0);

    expect(rivalTotal).toBe(4);
    expect(laneStep(meet, 'moonlit-wolf')).toBe(0);
  });
});

describe('pet card race meet completion', () => {
  it('scores a race the champion wins and requires a different pet for the next race', () => {
    const meet = meetWithChampion();
    parkChampionOnTheLine(meet, T0);

    setHand(meet, [rank('2', 'MOON')]);
    play(meet, [rank('2', 'MOON')], T0);

    expect(meet.meetPhase).toBe('RACE_INTERMISSION');
    expect(meet.completedRaces).toHaveLength(1);
    expect(meet.completedRaces[0]).toMatchObject({
      raceNumber: 1,
      championRacerId: 'moonlit-wolf',
      championPosition: 1,
      championCrossedLine: true,
      score: 50,
    });
    expect(meet.completedRaces[0]?.order).toHaveLength(4);

    expect(() => startNextPetCardRace(meet, 'moonlit-wolf', T0 + 1_000)).toThrowError(
      /already raced in this meet/,
    );

    startNextPetCardRace(meet, 'aurora-dragon', T0 + 1_000);
    expect(race(meet).raceNumber).toBe(2);
    expect(race(meet).championRacerId).toBe('aurora-dragon');
    expect(meet.usedRacerIds).toEqual(['moonlit-wolf', 'aurora-dragon']);
  });

  it('completes the meet after three races and totals the score', () => {
    const meet = meetWithChampion();
    const champions: PetCardRaceRacerId[] = ['moonlit-wolf', 'aurora-dragon', 'star-kitten'];

    champions.forEach((championRacerId, index) => {
      if (index > 0) {
        startNextPetCardRace(meet, championRacerId, T0 + index * 1_000);
      }

      parkChampionOnTheLine(meet, T0 + index * 1_000);
      setHand(meet, [rank('2', 'MOON')]);
      play(meet, [rank('2', 'MOON')], T0 + index * 1_000);
    });

    expect(meet.meetPhase).toBe('COMPLETE');
    expect(meet.totalScore).toBe(150);

    const view = takePetCardRaceMeetView(meet, { attemptId: 'a1', attemptNumber: 2 }, T0);
    expect(view.result).toMatchObject({ totalScore: 150, wins: 3, bestPosition: 1 });
    expect(view.completedRaces).toHaveLength(3);
    expect(view.availableRacerIds).toEqual(['shadow-panther']);
  });

  it('places the champion last when every rival crosses the line first', () => {
    const meet = meetWithChampion();
    syncPetCardRace(meet, T0 + PetCardRaceRivalTickMs * 200);

    expect(meet.completedRaces[0]).toMatchObject({
      championPosition: 4,
      championCrossedLine: false,
    });
    expect(meet.completedRaces[0]?.breakdown.marginBonus).toBe(0);
  });

  it('forfeits a meet without scoring it', () => {
    const meet = meetWithChampion();
    forfeitPetCardRaceMeet(meet, T0 + 1_000);

    expect(meet.meetPhase).toBe('FORFEITED');
    expect(meet.totalScore).toBe(0);
    expect(() => forfeitPetCardRaceMeet(meet, T0 + 2_000)).toThrowError(/already finished/);
  });
});
