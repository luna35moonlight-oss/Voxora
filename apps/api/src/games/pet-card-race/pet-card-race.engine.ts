import {
  PET_CARD_RACE_BALANCE,
  PET_CARD_RACE_PETS,
  PetCardRaceCheckpointCount,
  PetCardRaceFinalCheckpointCards,
  PetCardRaceNormalCheckpointCards,
  PetCardRaceNormalCheckpointCount,
  PetCardRaceOpeningDealSize,
  PetCardRacePlayCooldownMs,
  PetCardRacePlayCooldownToleranceMs,
  PetCardRaceRacesPerMeet,
  type PetCardRaceCard,
  type PetCardRaceCheckpoint,
  type PetCardRaceCompetitor,
  type PetCardRaceEvent,
  type PetCardRaceEventType,
  type PetCardRaceFinish,
  type PetCardRaceMeetPhase,
  type PetCardRaceMeetResult,
  type PetCardRaceMeetView,
  type PetCardRacePetId,
  type PetCardRacePhase,
  type PetCardRaceRaceResult,
  type PetCardRaceRaceView,
  type PetCardRaceStanding,
  type PetCardRaceStatusEffect,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';
import {
  buildPetCardRaceDeck,
  evaluatePetCardRaceSelection,
  petCardRacePet,
  petCardRaceProfileFor,
  petCardRaceTacticDefinition,
  scorePetCardRace,
  sortPetCardRaceHand,
} from '@voxora/domain';
import { PET_CARD_RACE_RULES_VERSION } from './pet-card-race.constants';

export type PetCardRaceRuleErrorCode = 'STATE' | 'COOLDOWN' | 'SELECTION' | 'TARGET' | 'PET';

/** Rule violations the engine detects. The service maps these onto HTTP responses. */
export class PetCardRaceRuleError extends Error {
  constructor(
    readonly code: PetCardRaceRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PetCardRaceRuleError';
  }
}

const balance = PET_CARD_RACE_BALANCE;
/** Grace period after the first pet crosses before remaining placements are settled by distance. */
const RACE_END_GRACE_MS = 6_000;
export const PET_CARD_RACE_YOU_COMPETITOR_ID = 'you';

type EffectKind = PetCardRaceStatusEffect['kind'];

type Effect = {
  kind: EffectKind;
  multiplier: number;
  endsAtMs: number;
};

type Obstacle = {
  obstacleId: string;
  kind: 'MUD';
  startMetres: number;
  endMetres: number;
  /** Mud a player lays hinders rivals; mud rivals lay hinders the player. */
  affectsYou: boolean;
};

type CompetitorState = {
  competitorId: string;
  petId: PetCardRacePetId;
  isYou: boolean;
  trainerName: string;
  trainerAvatarId: string | null;
  trainerAvatarName: string | null;
  /** Phase offset for the house pace curve, so the pack shuffles without random jumps. */
  paceOffsetMs: number;
  progressMetres: number;
  effects: Effect[];
  /** Holds until it blocks one rival tactic. */
  shielded: boolean;
  finishPosition: number | null;
  finishTimeMs: number | null;
};

export type PetCardRaceRaceState = {
  raceNumber: number;
  phase: PetCardRacePhase;
  petId: PetCardRacePetId;
  createdAtMs: number;
  goAtMs: number;
  simulatedToMs: number;
  firstFinishAtMs: number | null;
  competitors: CompetitorState[];
  obstacles: Obstacle[];
  drawPile: PetCardRaceCard[];
  hand: PetCardRaceCard[];
  checkpointsReached: number;
  lastPlayAtMs: number | null;
  combosPlayed: number;
  tacticsPlayed: number;
  effectiveTactics: number;
  finishOrder: string[];
  orderSnapshot: string[];
  /** Gap to the nearest rival at the moment the player crossed, in metres. */
  marginAtYourFinishMetres: number | null;
  eventSequence: number;
  pendingEvents: PetCardRaceEvent[];
  result: PetCardRaceRaceResult | null;
};

export type PetCardRaceMeetState = {
  rulesVersion: string;
  /** Server-only shuffle seed. It is never returned to a client. */
  seed: string;
  meetPhase: PetCardRaceMeetPhase;
  trainerName: string;
  trainerAvatarId: string | null;
  trainerAvatarName: string | null;
  usedPetIds: PetCardRacePetId[];
  completedRaces: PetCardRaceRaceResult[];
  standings: PetCardRaceStanding[];
  currentRace: PetCardRaceRaceState | null;
  totalScore: number;
};

const HOUSE_TRAINERS = ['Vale', 'Orin', 'Sable'] as const;
const PET_IDS = PET_CARD_RACE_PETS.map((pet) => pet.petId);

export function createPetCardRaceMeet(input: {
  seed: string;
  petId: PetCardRacePetId;
  nowMs: number;
  trainerAvatarId: string | null;
  trainerAvatarName: string | null;
}): PetCardRaceMeetState {
  const trainerName = input.trainerAvatarName ?? 'You';
  const meet: PetCardRaceMeetState = {
    rulesVersion: PET_CARD_RACE_RULES_VERSION,
    seed: input.seed,
    meetPhase: 'RACING',
    trainerName,
    trainerAvatarId: input.trainerAvatarId,
    trainerAvatarName: input.trainerAvatarName,
    usedPetIds: [],
    completedRaces: [],
    standings: [
      {
        competitorId: PET_CARD_RACE_YOU_COMPETITOR_ID,
        trainerName,
        isYou: true,
        points: 0,
        wins: 0,
      },
      ...HOUSE_TRAINERS.map((name, index) => ({
        competitorId: `house-${index + 1}`,
        trainerName: `${name} (Voxora house trainer)`,
        isYou: false,
        points: 0,
        wins: 0,
      })),
    ],
    currentRace: null,
    totalScore: 0,
  };

  openRace(meet, input.petId, input.nowMs);
  return meet;
}

/** Starts the next race of the meet with a pet that has not raced in this meet yet. */
export function startNextPetCardRace(
  meet: PetCardRaceMeetState,
  petId: PetCardRacePetId,
  nowMs: number,
): void {
  if (meet.meetPhase !== 'RACE_RESULT') {
    throw new PetCardRaceRuleError(
      'STATE',
      meet.meetPhase === 'COMPLETE'
        ? 'This meet is already complete'
        : 'Finish the current race before starting the next one',
    );
  }

  openRace(meet, petId, nowMs);
}

/**
 * Brings the race up to the server clock. Every pet runs continuously here: the countdown ends, the
 * pack accelerates away, effects expire, mud is entered and left, checkpoints deliver cards, and
 * placements are recorded as pets cross the line.
 */
export function simulatePetCardRace(meet: PetCardRaceMeetState, nowMs: number): void {
  const race = meet.currentRace;
  if (!race) {
    return;
  }

  if (race.phase === 'COUNTDOWN') {
    if (nowMs < race.goAtMs) {
      return;
    }

    race.phase = 'RUNNING';
    race.simulatedToMs = race.goAtMs;
    pushEvent(race, 'RACE_START', null, null, race.goAtMs, 'GO — all four pets are running.');
  }

  if (race.phase !== 'RUNNING') {
    return;
  }

  let guard = 0;
  while (race.simulatedToMs < nowMs && race.phase === 'RUNNING' && guard < 40_000) {
    guard += 1;
    const dt = Math.min(balance.simulationStepMs, nowMs - race.simulatedToMs);
    const at = race.simulatedToMs + dt;
    stepRace(meet, race, at, dt);
    race.simulatedToMs = at;
  }
}

export function playPetCardRaceCards(
  meet: PetCardRaceMeetState,
  input: { cardIds: readonly string[]; targetCompetitorId?: string },
  nowMs: number,
): void {
  simulatePetCardRace(meet, nowMs);

  const race = meet.currentRace;
  if (!race) {
    throw new PetCardRaceRuleError('STATE', 'There is no race to play cards into');
  }

  if (race.phase === 'COUNTDOWN') {
    throw new PetCardRaceRuleError('STATE', 'Wait for GO before playing cards');
  }

  if (race.phase !== 'RUNNING') {
    throw new PetCardRaceRuleError('STATE', 'This race has already finished');
  }

  const cooldown = cooldownRemainingMs(race, nowMs);
  if (cooldown > PetCardRacePlayCooldownToleranceMs) {
    throw new PetCardRaceRuleError(
      'COOLDOWN',
      `Wait ${Math.ceil(cooldown / 1000)}s before committing the next play`,
    );
  }

  const selection = readSelection(race, input.cardIds);
  const evaluation = evaluatePetCardRaceSelection(selection);
  if (!evaluation.valid || !evaluation.kind) {
    throw new PetCardRaceRuleError(
      'SELECTION',
      evaluation.reason ?? 'That selection is not a playable combination',
    );
  }

  const you = requireYou(race);
  const tacticCard = selection.find((card) => card.type === 'TACTIC');
  if (tacticCard?.tactic) {
    const definition = petCardRaceTacticDefinition(tacticCard.tactic);
    if (definition.requiresRivalTarget) {
      requireRivalTarget(race, input.targetCompetitorId);
    }
  }

  discardFromHand(race, selection);
  race.lastPlayAtMs = nowMs;

  if (tacticCard?.tactic) {
    applyPlayerTactic(race, tacticCard.tactic, nowMs, input.targetCompetitorId);
    race.tacticsPlayed += 1;
    return;
  }

  if (evaluation.kind !== 'SINGLE') {
    race.combosPlayed += 1;
  }

  applyEffect(you, {
    kind: 'BOOST',
    multiplier: evaluation.speedMultiplier,
    endsAtMs: nowMs + evaluation.durationMs,
  });

  pushEvent(
    race,
    'CARDS_PLAYED',
    you.competitorId,
    null,
    nowMs,
    `${petName(you)} runs on ${evaluation.label.toLowerCase()} (${selection
      .map((card) => card.label)
      .join(' ')}).`,
  );
  pushEvent(
    race,
    'SPEED_BOOST',
    you.competitorId,
    null,
    nowMs,
    `${petName(you)} accelerates to ${Math.round(evaluation.speedMultiplier * 100)}% pace for ${Math.round(
      evaluation.durationMs / 1000,
    )}s.`,
  );
}

export function forfeitPetCardRaceMeet(meet: PetCardRaceMeetState, nowMs: number): void {
  simulatePetCardRace(meet, nowMs);

  if (meet.meetPhase === 'COMPLETE' || meet.meetPhase === 'FORFEITED') {
    throw new PetCardRaceRuleError('STATE', 'This meet is already finished');
  }

  if (meet.currentRace) {
    meet.currentRace.phase = 'FORFEITED';
    pushEvent(
      meet.currentRace,
      'RACE_COMPLETE',
      null,
      null,
      nowMs,
      'Race abandoned. This reserved meet is used up and scores no leaderboard position.',
    );
  }

  meet.meetPhase = 'FORFEITED';
}

/**
 * Builds the client view and hands over the queued race events. Events drive the animation; the
 * competitor snapshot is always authoritative, so a dropped response cannot desynchronise a race.
 */
export function takePetCardRaceMeetView(
  meet: PetCardRaceMeetState,
  attempt: { attemptId: string; attemptNumber: number },
  nowMs: number,
): PetCardRaceMeetView {
  const race = meet.currentRace;

  return {
    attemptId: attempt.attemptId,
    attemptNumber: attempt.attemptNumber,
    meetPhase: meet.meetPhase,
    raceNumber: race?.raceNumber ?? Math.max(1, meet.completedRaces.length),
    racesTotal: PetCardRaceRacesPerMeet,
    usedPetIds: [...meet.usedPetIds],
    selectablePetIds: PET_IDS.filter((petId) => !meet.usedPetIds.includes(petId)),
    currentRace: race ? takeRaceView(race, nowMs) : null,
    completedRaces: [...meet.completedRaces],
    standings: [...meet.standings].sort((a, b) => b.points - a.points || b.wins - a.wins),
    meetScore: meet.totalScore,
    result: meet.meetPhase === 'COMPLETE' ? buildMeetResult(meet) : null,
  };
}

export function petCardRaceMeetIsFinished(meet: PetCardRaceMeetState): boolean {
  return meet.meetPhase === 'COMPLETE' || meet.meetPhase === 'FORFEITED';
}

function openRace(meet: PetCardRaceMeetState, petId: PetCardRacePetId, nowMs: number): void {
  if (!PET_IDS.includes(petId)) {
    throw new PetCardRaceRuleError('PET', 'That pet is not entered in this race');
  }

  if (meet.usedPetIds.includes(petId)) {
    throw new PetCardRaceRuleError(
      'PET',
      `${petCardRacePet(petId).displayName} already raced in this meet — choose a different pet`,
    );
  }

  const raceNumber = meet.completedRaces.length + 1;
  const rivalPetIds = PET_IDS.filter((entry) => entry !== petId);
  const random = createSeededRandom(`${meet.seed}:race:${raceNumber}`);

  const race: PetCardRaceRaceState = {
    raceNumber,
    phase: 'COUNTDOWN',
    petId,
    createdAtMs: nowMs,
    goAtMs: nowMs + balance.countdownMs,
    simulatedToMs: nowMs + balance.countdownMs,
    firstFinishAtMs: null,
    competitors: [
      {
        competitorId: PET_CARD_RACE_YOU_COMPETITOR_ID,
        petId,
        isYou: true,
        trainerName: meet.trainerName,
        trainerAvatarId: meet.trainerAvatarId,
        trainerAvatarName: meet.trainerAvatarName,
        paceOffsetMs: 0,
        progressMetres: 0,
        effects: [],
        shielded: false,
        finishPosition: null,
        finishTimeMs: null,
      },
      ...rivalPetIds.map((rivalPetId, index) => {
        const standing = meet.standings.find(
          (entry) => entry.competitorId === `house-${index + 1}`,
        );
        return {
          competitorId: `house-${index + 1}`,
          petId: rivalPetId,
          isYou: false,
          trainerName: standing?.trainerName ?? `Voxora house trainer ${index + 1}`,
          trainerAvatarId: null,
          trainerAvatarName: null,
          paceOffsetMs: Math.floor(random() * balance.housePacePeriodMs),
          progressMetres: 0,
          effects: [],
          shielded: false,
          finishPosition: null,
          finishTimeMs: null,
        } satisfies CompetitorState;
      }),
    ],
    obstacles: [],
    drawPile: shuffle(
      buildPetCardRaceDeck(`r${raceNumber}`),
      createSeededRandom(`${meet.seed}:cards:${raceNumber}`),
    ),
    hand: [],
    checkpointsReached: 0,
    lastPlayAtMs: null,
    combosPlayed: 0,
    tacticsPlayed: 0,
    effectiveTactics: 0,
    finishOrder: [],
    orderSnapshot: [],
    marginAtYourFinishMetres: null,
    eventSequence: 0,
    pendingEvents: [],
    result: null,
  };

  race.hand = dealOpeningHand(race, petId);
  race.orderSnapshot = race.competitors.map((competitor) => competitor.competitorId);
  meet.currentRace = race;
  meet.usedPetIds.push(petId);
  meet.meetPhase = 'RACING';

  pushEvent(
    race,
    'COUNTDOWN',
    PET_CARD_RACE_YOU_COMPETITOR_ID,
    0,
    nowMs,
    `Race ${raceNumber} of ${PetCardRaceRacesPerMeet}: ${petCardRacePet(petId).displayName} is at the line for ${meet.trainerName}. Opening deal: ${race.hand
      .map((card) => card.label)
      .join(', ')}.`,
  );
}

/**
 * The opening deal follows the chosen pet's race profile rather than one universal hand, so a pet can
 * later carry its own racing personality without changing this code.
 */
function dealOpeningHand(race: PetCardRaceRaceState, petId: PetCardRacePetId): PetCardRaceCard[] {
  const mix = petCardRaceProfileFor(petId).openingMix;
  const opening: PetCardRaceCard[] = [
    ...takeFromDrawPile(race, (card) => card.type !== 'TACTIC', mix.runCards),
    ...takeFromDrawPile(race, (card) => card.type === 'TACTIC', mix.tacticCards),
  ];

  opening.push(...race.drawPile.splice(0, PetCardRaceOpeningDealSize - opening.length));
  return opening;
}

/** Draws in shuffled order, skipping cards that do not match the requested mix. */
function takeFromDrawPile(
  race: PetCardRaceRaceState,
  matches: (card: PetCardRaceCard) => boolean,
  count: number,
): PetCardRaceCard[] {
  const taken: PetCardRaceCard[] = [];
  for (let index = 0; index < race.drawPile.length && taken.length < count; index += 1) {
    const card = race.drawPile[index];
    if (card && matches(card)) {
      taken.push(card);
      race.drawPile.splice(index, 1);
      index -= 1;
    }
  }

  return taken;
}

function stepRace(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  at: number,
  dt: number,
): void {
  for (const competitor of race.competitors) {
    if (competitor.finishPosition !== null) {
      continue;
    }

    competitor.effects = competitor.effects.filter((effect) => effect.endsAtMs > at);

    const before = competitor.progressMetres;
    competitor.progressMetres = Math.min(
      competitor.progressMetres + speedMetresPerSecond(race, competitor, at) * (dt / 1000),
      balance.courseMetres,
    );

    if (competitor.isYou) {
      announceMudEntry(race, competitor, before, at);
      deliverDueCheckpoints(meet, race, competitor, at);
    }

    if (competitor.progressMetres >= balance.courseMetres) {
      crossFinishLine(race, competitor, at);
    }
  }

  announceOvertakes(race, at);
  maybeCompleteRace(meet, race, at);
}

function speedMetresPerSecond(
  race: PetCardRaceRaceState,
  competitor: CompetitorState,
  at: number,
): number {
  let speed = balance.baseSpeedMetresPerSecond;

  // House racers breathe around the base pace so positions change without random jumps.
  if (!competitor.isYou) {
    const phase =
      ((at - race.goAtMs + competitor.paceOffsetMs) / balance.housePacePeriodMs) * Math.PI * 2;
    speed *= 1 + balance.housePaceAmplitude * Math.sin(phase);
  }

  for (const effect of competitor.effects) {
    if (effect.endsAtMs > at) {
      speed *= effect.multiplier;
    }
  }

  if (insideMud(race, competitor)) {
    speed *= balance.tactics.MUD.multiplier;
  }

  return Math.max(speed, 0);
}

function insideMud(race: PetCardRaceRaceState, competitor: CompetitorState): boolean {
  return race.obstacles.some(
    (obstacle) =>
      obstacle.affectsYou === competitor.isYou &&
      competitor.progressMetres >= obstacle.startMetres &&
      competitor.progressMetres <= obstacle.endMetres,
  );
}

function announceMudEntry(
  race: PetCardRaceRaceState,
  competitor: CompetitorState,
  before: number,
  at: number,
): void {
  for (const obstacle of race.obstacles) {
    if (
      obstacle.affectsYou === competitor.isYou &&
      before < obstacle.startMetres &&
      competitor.progressMetres >= obstacle.startMetres
    ) {
      pushEvent(
        race,
        'MUD_HIT',
        competitor.competitorId,
        obstacle.startMetres,
        at,
        `${petName(competitor)} hits the mud and slows to a slog.`,
      );
    }
  }
}

function deliverDueCheckpoints(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  you: CompetitorState,
  at: number,
): void {
  while (race.checkpointsReached < PetCardRaceCheckpointCount) {
    const index = race.checkpointsReached;
    const checkpoint = checkpointAt(index);
    if (you.progressMetres < checkpoint.atMetres) {
      return;
    }

    const dealt = race.drawPile.splice(0, checkpoint.cardsAwarded);
    race.hand.push(...dealt);
    race.checkpointsReached += 1;

    pushEvent(
      race,
      'CHECKPOINT_CARDS',
      you.competitorId,
      checkpoint.atMetres,
      at,
      `${checkpoint.isFinal ? 'Final checkpoint' : `Checkpoint ${checkpoint.index}`}: ${dealt.length} cards join your hand (${dealt
        .map((card) => card.label)
        .join(', ')}).`,
    );

    // House trainers answer from the second checkpoint onward.
    if (race.checkpointsReached > 1) {
      applyHouseTactic(meet, race, you, at);
    }
  }
}

function checkpointAt(index: number): PetCardRaceCheckpoint {
  const fraction = balance.checkpointFractions[index] ?? 1;
  const isFinal = index === PetCardRaceNormalCheckpointCount;

  return {
    index: index + 1,
    atMetres: Math.round(balance.courseMetres * fraction),
    atFraction: fraction,
    cardsAwarded: isFinal ? PetCardRaceFinalCheckpointCards : PetCardRaceNormalCheckpointCards,
    isFinal,
    reached: false,
  };
}

function applyHouseTactic(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  you: CompetitorState,
  at: number,
): void {
  const options: readonly PetCardRaceTacticKind[] = ['WEIGHTS', 'CHASER', 'MUD'];
  const random = createSeededRandom(
    `${meet.seed}:house-tactic:${race.raceNumber}:${race.checkpointsReached}`,
  );
  const kind = options[Math.floor(random() * options.length)] ?? 'WEIGHTS';
  const title = petCardRaceTacticDefinition(kind).title.toLowerCase();

  if (you.shielded) {
    you.shielded = false;
    pushEvent(
      race,
      'SHIELD_BLOCKED',
      you.competitorId,
      you.progressMetres,
      at,
      `The moon shield breaks a house ${title} aimed at ${petName(you)}.`,
    );
    return;
  }

  switch (kind) {
    case 'WEIGHTS':
      applyEffect(you, {
        kind: 'WEIGHTS',
        multiplier: balance.tactics.WEIGHTS.multiplier,
        endsAtMs: at + balance.tactics.WEIGHTS.durationMs,
      });
      pushEvent(
        race,
        'RIVAL_TACTIC',
        you.competitorId,
        you.progressMetres,
        at,
        `House trainers weigh down ${petName(you)}: the run turns heavy.`,
      );
      break;
    case 'CHASER':
      applyEffect(you, {
        kind: 'CHASED',
        multiplier: balance.tactics.CHASER.multiplier,
        endsAtMs: at + balance.tactics.CHASER.durationMs,
      });
      pushEvent(
        race,
        'CHASER',
        you.competitorId,
        you.progressMetres,
        at,
        `A trail animal breaks out and chases ${petName(you)}.`,
      );
      break;
    case 'MUD': {
      const obstacle = addMud(race, you.progressMetres + balance.tactics.MUD.aheadMetres, true);
      pushEvent(
        race,
        'MUD_PLACED',
        you.competitorId,
        obstacle.startMetres,
        at,
        `House trainers churn mud into the course ahead of ${petName(you)}.`,
      );
      break;
    }
    default:
      break;
  }
}

function applyPlayerTactic(
  race: PetCardRaceRaceState,
  kind: PetCardRaceTacticKind,
  nowMs: number,
  targetCompetitorId?: string,
): void {
  const you = requireYou(race);
  const rivals = race.competitors.filter(
    (competitor) => !competitor.isYou && competitor.finishPosition === null,
  );
  let effective = false;

  switch (kind) {
    case 'SPRINT': {
      applyEffect(you, {
        kind: 'SPRINT',
        multiplier: balance.tactics.SPRINT.multiplier,
        endsAtMs: nowMs + balance.tactics.SPRINT.durationMs,
      });
      effective = true;
      pushEvent(
        race,
        'SPRINT',
        you.competitorId,
        you.progressMetres,
        nowMs,
        `${petName(you)} surges into a sprint.`,
      );
      break;
    }
    case 'SHIELD': {
      effective = !you.shielded;
      you.shielded = true;
      pushEvent(
        race,
        'SHIELD_RAISED',
        you.competitorId,
        you.progressMetres,
        nowMs,
        `A guarding field closes around ${petName(you)} and will block the next rival tactic.`,
      );
      break;
    }
    case 'WEIGHTS': {
      for (const rival of rivals) {
        applyEffect(rival, {
          kind: 'WEIGHTS',
          multiplier: balance.tactics.WEIGHTS.multiplier,
          endsAtMs: nowMs + balance.tactics.WEIGHTS.durationMs,
        });
        effective = true;
      }

      pushEvent(
        race,
        'WEIGHTS',
        you.competitorId,
        null,
        nowMs,
        'Heavy paws drag at every rival: their strides turn laboured.',
      );
      break;
    }
    case 'MUD': {
      const obstacle = addMud(race, you.progressMetres + balance.tactics.MUD.aheadMetres, false);
      effective = true;
      pushEvent(
        race,
        'MUD_PLACED',
        you.competitorId,
        obstacle.startMetres,
        nowMs,
        'A stretch of mud floods the course ahead of the rivals.',
      );
      break;
    }
    case 'CHASER': {
      const target = requireRivalTarget(race, targetCompetitorId);
      applyEffect(target, {
        kind: 'CHASED',
        multiplier: balance.tactics.CHASER.multiplier,
        endsAtMs: nowMs + balance.tactics.CHASER.durationMs,
      });
      effective = true;
      pushEvent(
        race,
        'CHASER',
        you.competitorId,
        target.progressMetres,
        nowMs,
        `A trail animal bursts out and chases ${petName(target)} off the racing line.`,
      );
      break;
    }
    default:
      break;
  }

  if (effective) {
    race.effectiveTactics += 1;
  }
}

/** A new effect of the same kind refreshes rather than stacking, so speeds stay bounded. */
function applyEffect(competitor: CompetitorState, effect: Effect): void {
  competitor.effects = competitor.effects.filter((existing) => existing.kind !== effect.kind);
  competitor.effects.push(effect);
}

function addMud(race: PetCardRaceRaceState, atMetres: number, affectsYou: boolean): Obstacle {
  const start = Math.min(Math.max(atMetres, 0), balance.courseMetres - 10);
  const obstacle: Obstacle = {
    obstacleId: `mud-${race.obstacles.length + 1}`,
    kind: 'MUD',
    startMetres: Math.round(start),
    endMetres: Math.round(Math.min(start + balance.tactics.MUD.lengthMetres, balance.courseMetres)),
    affectsYou,
  };

  race.obstacles.push(obstacle);
  return obstacle;
}

function crossFinishLine(
  race: PetCardRaceRaceState,
  competitor: CompetitorState,
  at: number,
): void {
  if (competitor.finishPosition !== null) {
    return;
  }

  race.finishOrder.push(competitor.competitorId);
  competitor.finishPosition = race.finishOrder.length;
  competitor.finishTimeMs = Math.max(0, Math.round(at - race.goAtMs));
  race.firstFinishAtMs = race.firstFinishAtMs ?? at;

  // Measure the winning gap as the player crosses: once everyone is home the distances are equal.
  if (competitor.isYou) {
    const nearestRival = Math.max(
      ...race.competitors.filter((entry) => !entry.isYou).map((entry) => entry.progressMetres),
      0,
    );
    race.marginAtYourFinishMetres = Math.max(0, competitor.progressMetres - nearestRival);
  }

  pushEvent(
    race,
    'FINISH',
    competitor.competitorId,
    balance.courseMetres,
    at,
    `${petName(competitor)} crosses the line in position ${competitor.finishPosition}.`,
  );
}

function announceOvertakes(race: PetCardRaceRaceState, at: number): void {
  const order = rankedCompetitorIds(race);
  const you = PET_CARD_RACE_YOU_COMPETITOR_ID;
  const wasPlace = race.orderSnapshot.indexOf(you);
  const isPlace = order.indexOf(you);

  if (wasPlace !== -1 && isPlace !== -1 && isPlace !== wasPlace) {
    const gained = isPlace < wasPlace;
    const rival = gained ? race.orderSnapshot[isPlace] : order[wasPlace];
    const rivalState = race.competitors.find((entry) => entry.competitorId === rival);
    pushEvent(
      race,
      'OVERTAKE',
      you,
      null,
      at,
      gained
        ? `You take ${ordinal(isPlace + 1)}${rivalState ? ` from ${petName(rivalState)}` : ''}.`
        : `${rivalState ? petName(rivalState) : 'A rival'} pushes you back to ${ordinal(isPlace + 1)}.`,
    );
  }

  race.orderSnapshot = order;
}

function maybeCompleteRace(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  at: number,
): void {
  if (race.phase !== 'RUNNING') {
    return;
  }

  const allHome = race.competitors.every((competitor) => competitor.finishPosition !== null);
  const graceExpired =
    race.firstFinishAtMs !== null && at - race.firstFinishAtMs >= RACE_END_GRACE_MS;

  if (!allHome && !graceExpired) {
    return;
  }

  const order = buildOrder(race);
  const you = order.find((entry) => entry.isYou);
  if (!you) {
    throw new PetCardRaceRuleError('STATE', 'This race has no result for the player');
  }

  const bestRivalMetres = Math.max(
    ...order.filter((entry) => !entry.isYou).map((entry) => entry.progressMetres),
    0,
  );
  const marginMetres =
    you.position === 1
      ? (race.marginAtYourFinishMetres ?? you.progressMetres - bestRivalMetres)
      : 0;
  const photoFinish = you.position === 1 && marginMetres <= balance.scoring.photoFinishMetres;
  const breakdown = scorePetCardRace({
    position: you.position,
    combosPlayed: race.combosPlayed,
    effectiveTactics: race.effectiveTactics,
    marginMetres,
    photoFinish,
  });

  race.phase = 'FINISHED';
  race.result = {
    raceNumber: race.raceNumber,
    petId: race.petId,
    yourPosition: you.position,
    crossedLine: you.crossedLine,
    order,
    combosPlayed: race.combosPlayed,
    tacticsPlayed: race.tacticsPlayed,
    photoFinish,
    marginMetres: Math.round(marginMetres),
    score: breakdown.total,
    breakdown,
  };

  for (const entry of order) {
    const standing = meet.standings.find((row) => row.competitorId === entry.competitorId);
    if (standing) {
      standing.points += balance.scoring.positionPoints[entry.position - 1] ?? 0;
      standing.wins += entry.position === 1 ? 1 : 0;
    }
  }

  meet.completedRaces.push(race.result);
  meet.totalScore += breakdown.total;
  meet.meetPhase =
    meet.completedRaces.length >= PetCardRaceRacesPerMeet ? 'COMPLETE' : 'RACE_RESULT';

  pushEvent(
    race,
    'RACE_COMPLETE',
    PET_CARD_RACE_YOU_COMPETITOR_ID,
    you.progressMetres,
    at,
    `${petCardRacePet(race.petId).displayName} finishes ${ordinal(you.position)} for ${breakdown.total} points.`,
  );
}

function rankedCompetitorIds(race: PetCardRaceRaceState): string[] {
  return [...race.competitors]
    .sort((a, b) => {
      if (a.finishPosition !== null || b.finishPosition !== null) {
        return (a.finishPosition ?? 99) - (b.finishPosition ?? 99);
      }

      return b.progressMetres - a.progressMetres;
    })
    .map((competitor) => competitor.competitorId);
}

function buildOrder(race: PetCardRaceRaceState): PetCardRaceFinish[] {
  return rankedCompetitorIds(race).map((competitorId, index) => {
    const competitor = race.competitors.find((entry) => entry.competitorId === competitorId);
    return {
      competitorId,
      petId: competitor?.petId ?? race.petId,
      trainerName: competitor?.trainerName ?? 'Voxora house trainer',
      isYou: competitor?.isYou ?? false,
      position: index + 1,
      progressMetres: Math.round(competitor?.progressMetres ?? 0),
      crossedLine: (competitor?.finishPosition ?? null) !== null,
      finishTimeMs: competitor?.finishTimeMs ?? null,
    };
  });
}

function buildMeetResult(meet: PetCardRaceMeetState): PetCardRaceMeetResult {
  return {
    totalScore: meet.totalScore,
    bestPosition: Math.min(...meet.completedRaces.map((race) => race.yourPosition), 4),
    wins: meet.completedRaces.filter((race) => race.yourPosition === 1).length,
    races: [...meet.completedRaces],
    standings: [...meet.standings].sort((a, b) => b.points - a.points || b.wins - a.wins),
  };
}

function takeRaceView(race: PetCardRaceRaceState, nowMs: number): PetCardRaceRaceView {
  const events = race.pendingEvents;
  race.pendingEvents = [];
  const order = rankedCompetitorIds(race);
  const at = race.phase === 'RUNNING' ? race.simulatedToMs : nowMs;

  const competitors: PetCardRaceCompetitor[] = race.competitors.map((competitor) => {
    const speed =
      race.phase === 'RUNNING' && competitor.finishPosition === null
        ? speedMetresPerSecond(race, competitor, at)
        : 0;

    return {
      competitorId: competitor.competitorId,
      trainerKind: competitor.isYou ? 'PLAYER' : 'HOUSE',
      isYou: competitor.isYou,
      trainerName: competitor.trainerName,
      trainerAvatarId: competitor.trainerAvatarId,
      trainerAvatarName: competitor.trainerAvatarName,
      pet: petCardRacePet(competitor.petId),
      progressMetres: Math.round(competitor.progressMetres),
      progressFraction: Math.min(competitor.progressMetres / balance.courseMetres, 1),
      speedMetresPerSecond: Math.round(speed * 100) / 100,
      speedMultiplier: Math.round((speed / balance.baseSpeedMetresPerSecond) * 100) / 100,
      position: Math.max(1, order.indexOf(competitor.competitorId) + 1) as 1 | 2 | 3 | 4,
      statuses: describeStatuses(race, competitor, at),
      finishPosition: competitor.finishPosition,
      finishTimeMs: competitor.finishTimeMs,
    };
  });

  return {
    raceNumber: race.raceNumber,
    phase: race.phase,
    countdownRemainingMs:
      race.phase === 'COUNTDOWN' ? Math.max(0, Math.round(race.goAtMs - nowMs)) : 0,
    courseMetres: balance.courseMetres,
    checkpoints: Array.from({ length: PetCardRaceCheckpointCount }, (_unused, index) => ({
      ...checkpointAt(index),
      reached: index < race.checkpointsReached,
    })),
    competitors,
    obstacles: race.obstacles.map((obstacle) => ({
      obstacleId: obstacle.obstacleId,
      kind: obstacle.kind,
      startMetres: obstacle.startMetres,
      endMetres: obstacle.endMetres,
      affectsYou: obstacle.affectsYou,
    })),
    hand: sortPetCardRaceHand(race.hand),
    cardsLeftToDeal: remainingCheckpointCards(race),
    checkpointsReached: race.checkpointsReached,
    events,
    cooldownRemainingMs: race.phase === 'RUNNING' ? cooldownRemainingMs(race, nowMs) : 0,
    serverTimeMs: nowMs,
    raceElapsedMs: race.phase === 'COUNTDOWN' ? 0 : Math.max(0, Math.round(at - race.goAtMs)),
    combosPlayed: race.combosPlayed,
    tacticsPlayed: race.tacticsPlayed,
    result: race.result,
  };
}

function describeStatuses(
  race: PetCardRaceRaceState,
  competitor: CompetitorState,
  at: number,
): PetCardRaceStatusEffect[] {
  const statuses: PetCardRaceStatusEffect[] = competitor.effects
    .filter((effect) => effect.endsAtMs > at)
    .map((effect) => ({
      kind: effect.kind,
      multiplier: effect.multiplier,
      endsInMs: Math.max(0, Math.round(effect.endsAtMs - at)),
    }));

  if (competitor.shielded) {
    // No timer: a shield waits until it blocks something.
    statuses.push({ kind: 'SHIELDED', multiplier: 1, endsInMs: 0 });
  }

  if (insideMud(race, competitor)) {
    statuses.push({ kind: 'MUD', multiplier: balance.tactics.MUD.multiplier, endsInMs: 0 });
  }

  return statuses;
}

function remainingCheckpointCards(race: PetCardRaceRaceState): number {
  let remaining = 0;
  for (let index = race.checkpointsReached; index < PetCardRaceCheckpointCount; index += 1) {
    remaining += checkpointAt(index).cardsAwarded;
  }

  return remaining;
}

function readSelection(race: PetCardRaceRaceState, cardIds: readonly string[]): PetCardRaceCard[] {
  const selection: PetCardRaceCard[] = [];
  for (const cardId of cardIds) {
    const card = race.hand.find(
      (held) => held.cardId === cardId && !selection.some((picked) => picked.cardId === cardId),
    );

    if (!card) {
      throw new PetCardRaceRuleError('SELECTION', 'That card is not in your hand');
    }

    selection.push(card);
  }

  return selection;
}

function discardFromHand(race: PetCardRaceRaceState, selection: readonly PetCardRaceCard[]): void {
  const played = new Set(selection.map((card) => card.cardId));
  race.hand = race.hand.filter((card) => !played.has(card.cardId));
}

function requireYou(race: PetCardRaceRaceState): CompetitorState {
  const you = race.competitors.find((competitor) => competitor.isYou);
  if (!you) {
    throw new PetCardRaceRuleError('STATE', 'This race has no player competitor');
  }

  return you;
}

function requireRivalTarget(
  race: PetCardRaceRaceState,
  targetCompetitorId: string | undefined,
): CompetitorState {
  if (!targetCompetitorId) {
    throw new PetCardRaceRuleError('TARGET', 'Choose which rival the trail chaser goes after');
  }

  const target = race.competitors.find(
    (competitor) => competitor.competitorId === targetCompetitorId,
  );

  if (!target) {
    throw new PetCardRaceRuleError('TARGET', 'That racer is not in this race');
  }

  if (target.isYou) {
    throw new PetCardRaceRuleError('TARGET', 'A trail chaser cannot be sent after your own pet');
  }

  if (target.finishPosition !== null) {
    throw new PetCardRaceRuleError('TARGET', 'That rival has already crossed the line');
  }

  return target;
}

function cooldownRemainingMs(race: PetCardRaceRaceState, nowMs: number): number {
  if (race.lastPlayAtMs === null) {
    return 0;
  }

  return Math.max(0, PetCardRacePlayCooldownMs - (nowMs - race.lastPlayAtMs));
}

function pushEvent(
  race: PetCardRaceRaceState,
  type: PetCardRaceEventType,
  competitorId: string | null,
  atMetres: number | null,
  atMs: number,
  message: string,
  targetCompetitorId: string | null = null,
): void {
  race.eventSequence += 1;
  race.pendingEvents.push({
    sequence: race.eventSequence,
    type,
    competitorId,
    targetCompetitorId,
    atMetres: atMetres === null ? null : Math.round(Math.max(atMetres, 0)),
    atMs: Math.max(0, Math.round(atMs)),
    message,
  });
}

function petName(competitor: CompetitorState): string {
  return petCardRacePet(competitor.petId).displayName;
}

function ordinal(position: number): string {
  switch (position) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
    default:
      return 'fourth';
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    const other = shuffled[swap];
    if (current === undefined || other === undefined) {
      continue;
    }

    shuffled[index] = other;
    shuffled[swap] = current;
  }

  return shuffled;
}

/** Deterministic PRNG so a race can be replayed from its server-held seed during an audit. */
function createSeededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), 1 | next);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
