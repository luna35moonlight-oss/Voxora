import {
  PET_CARD_RACE_ROSTER,
  PetCardRaceMudLeadSteps,
  PetCardRacePlayCooldownMs,
  PetCardRacePlayCooldownToleranceMs,
  PetCardRaceRacesPerMeet,
  PetCardRaceRivalTickMs,
  PetCardRaceSlowSteps,
  PetCardRaceSprintSteps,
  PetCardRaceStationCount,
  PetCardRaceStationDealSizes,
  PetCardRaceStationSteps,
  PetCardRaceTrackLength,
  type PetCardRaceCard,
  type PetCardRaceEvent,
  type PetCardRaceEventType,
  type PetCardRaceFinish,
  type PetCardRaceMeetPhase,
  type PetCardRaceMeetResult,
  type PetCardRaceMeetView,
  type PetCardRacePhase,
  type PetCardRaceRacerId,
  type PetCardRaceRaceResult,
  type PetCardRaceRaceView,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';
import {
  evaluatePetCardRaceSelection,
  buildPetCardRaceDeck,
  petCardRaceTacticDefinition,
  scorePetCardRace,
  sortPetCardRaceHand,
} from '@voxora/domain';
import { PET_CARD_RACE_RULES_VERSION } from './pet-card-race.constants';

export type PetCardRaceRuleErrorCode = 'STATE' | 'COOLDOWN' | 'SELECTION' | 'TARGET' | 'CHAMPION';

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

type MudPatch = {
  step: number;
  /** Who slogs through this stretch — mud laid by a player only hinders rivals. */
  affects: 'RIVALS' | 'CHAMPION';
};

type LaneState = {
  step: number;
  slowedSteps: number;
  shielded: boolean;
  finishPosition: number | null;
  mudCleared: number[];
};

export type PetCardRaceRaceState = {
  raceNumber: number;
  championRacerId: PetCardRaceRacerId;
  phase: PetCardRacePhase;
  startedAtMs: number;
  lastPlayAtMs: number | null;
  rivalDeck: PetCardRaceRacerId[];
  rivalDeckBlocks: number;
  rivalTicksApplied: number;
  drawPile: PetCardRaceCard[];
  hand: PetCardRaceCard[];
  lanes: Record<string, LaneState>;
  mud: MudPatch[];
  stationsDealt: number;
  combosPlayed: number;
  tacticsPlayed: number;
  effectiveTactics: number;
  finishOrder: PetCardRaceRacerId[];
  eventSequence: number;
  pendingEvents: PetCardRaceEvent[];
  result: PetCardRaceRaceResult | null;
};

export type PetCardRaceMeetState = {
  rulesVersion: string;
  /** Server-only shuffle seed. It is never returned to a client. */
  seed: string;
  meetPhase: PetCardRaceMeetPhase;
  usedRacerIds: PetCardRaceRacerId[];
  completedRaces: PetCardRaceRaceResult[];
  currentRace: PetCardRaceRaceState | null;
  totalScore: number;
};

const ROSTER_IDS: readonly PetCardRaceRacerId[] = PET_CARD_RACE_ROSTER.map(
  (racer) => racer.racerId,
);

export function createPetCardRaceMeet(input: {
  seed: string;
  championRacerId: PetCardRaceRacerId;
  nowMs: number;
}): PetCardRaceMeetState {
  const meet: PetCardRaceMeetState = {
    rulesVersion: PET_CARD_RACE_RULES_VERSION,
    seed: input.seed,
    meetPhase: 'RACING',
    usedRacerIds: [],
    completedRaces: [],
    currentRace: null,
    totalScore: 0,
  };

  openRace(meet, input.championRacerId, input.nowMs);
  return meet;
}

/** Starts the next race of the meet with a pet that has not raced in this meet yet. */
export function startNextPetCardRace(
  meet: PetCardRaceMeetState,
  championRacerId: PetCardRaceRacerId,
  nowMs: number,
): void {
  if (meet.meetPhase !== 'RACE_INTERMISSION') {
    throw new PetCardRaceRuleError(
      'STATE',
      meet.meetPhase === 'COMPLETE'
        ? 'This meet is already complete'
        : 'Finish the current race before starting the next one',
    );
  }

  openRace(meet, championRacerId, nowMs);
}

/** Brings the race up to date with the server clock: rival advances and station deals. */
export function syncPetCardRace(meet: PetCardRaceMeetState, nowMs: number): void {
  const race = meet.currentRace;
  if (!race || race.phase !== 'RUNNING') {
    return;
  }

  const dueTicks = Math.max(0, Math.floor((nowMs - race.startedAtMs) / PetCardRaceRivalTickMs));
  let guard = 0;
  while (race.rivalTicksApplied < dueTicks && race.phase === 'RUNNING' && guard < 5_000) {
    guard += 1;
    race.rivalTicksApplied += 1;
    const racerId = takeRivalCard(meet, race);
    if (racerId) {
      advanceRacer(meet, race, racerId, 1, 'RIVAL_ADVANCE');
    }
    dealDueStations(meet, race);
  }

  dealDueStations(meet, race);
}

export function playPetCardRaceCards(
  meet: PetCardRaceMeetState,
  input: { cardIds: readonly string[]; targetRacerId?: PetCardRaceRacerId },
  nowMs: number,
): void {
  syncPetCardRace(meet, nowMs);

  const race = meet.currentRace;
  if (!race || race.phase !== 'RUNNING') {
    throw new PetCardRaceRuleError('STATE', 'There is no running race to play cards into');
  }

  const cooldown = cooldownRemainingMs(race, nowMs);
  if (cooldown > PetCardRacePlayCooldownToleranceMs) {
    throw new PetCardRaceRuleError(
      'COOLDOWN',
      `Wait ${Math.ceil(cooldown / 1000)}s before selecting the next card`,
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

  const tacticCard = selection.find((card) => card.type === 'TACTIC');
  if (tacticCard?.tactic) {
    const definition = petCardRaceTacticDefinition(tacticCard.tactic);
    if (definition.requiresRivalTarget) {
      requireRivalTarget(race, input.targetRacerId);
    }
  }

  discardFromHand(race, selection);
  race.lastPlayAtMs = nowMs;

  if (tacticCard?.tactic) {
    applyPlayerTactic(meet, race, tacticCard.tactic, input.targetRacerId);
    race.tacticsPlayed += 1;
  } else {
    if (evaluation.kind !== 'SINGLE') {
      race.combosPlayed += 1;
    }

    pushEvent(
      race,
      'CARDS_PLAYED',
      race.championRacerId,
      race.lanes[race.championRacerId]?.step ?? 0,
      `${racerName(race.championRacerId)} runs on ${evaluation.label.toLowerCase()} (${selection
        .map((card) => card.label)
        .join(' ')}) for ${evaluation.steps} step${evaluation.steps === 1 ? '' : 's'}.`,
    );
    advanceRacer(meet, race, race.championRacerId, evaluation.steps, 'CHAMPION_ADVANCE');
  }

  dealDueStations(meet, race);
}

export function forfeitPetCardRaceMeet(meet: PetCardRaceMeetState, nowMs: number): void {
  syncPetCardRace(meet, nowMs);

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
      'Race forfeited. This reserved meet is used up and scores no leaderboard position.',
    );
  }

  meet.meetPhase = 'FORFEITED';
}

/**
 * Builds the client view and hands over the queued events. Events are animation detail only:
 * the lane snapshot is always authoritative, so a lost response cannot desynchronise the race.
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
    usedRacerIds: [...meet.usedRacerIds],
    availableRacerIds: ROSTER_IDS.filter((racerId) => !meet.usedRacerIds.includes(racerId)),
    currentRace: race ? takeRaceView(race, nowMs) : null,
    completedRaces: [...meet.completedRaces],
    meetScore: meet.totalScore,
    result: meet.meetPhase === 'COMPLETE' ? buildMeetResult(meet) : null,
  };
}

export function petCardRaceMeetIsFinished(meet: PetCardRaceMeetState): boolean {
  return meet.meetPhase === 'COMPLETE' || meet.meetPhase === 'FORFEITED';
}

function openRace(
  meet: PetCardRaceMeetState,
  championRacerId: PetCardRaceRacerId,
  nowMs: number,
): void {
  if (!ROSTER_IDS.includes(championRacerId)) {
    throw new PetCardRaceRuleError('CHAMPION', 'That racer is not in the Pet Card Race roster');
  }

  if (meet.usedRacerIds.includes(championRacerId)) {
    throw new PetCardRaceRuleError(
      'CHAMPION',
      `${racerName(championRacerId)} already raced in this meet — choose a different pet`,
    );
  }

  const raceNumber = meet.completedRaces.length + 1;
  const race: PetCardRaceRaceState = {
    raceNumber,
    championRacerId,
    phase: 'RUNNING',
    startedAtMs: nowMs,
    lastPlayAtMs: null,
    rivalDeck: [],
    rivalDeckBlocks: 0,
    rivalTicksApplied: 0,
    drawPile: shuffle(
      buildPetCardRaceDeck(`r${raceNumber}`),
      createSeededRandom(`${meet.seed}:cards:${raceNumber}`),
    ),
    hand: [],
    lanes: Object.fromEntries(
      ROSTER_IDS.map((racerId) => [
        racerId,
        { step: 0, slowedSteps: 0, shielded: false, finishPosition: null, mudCleared: [] },
      ]),
    ),
    mud: [],
    stationsDealt: 0,
    combosPlayed: 0,
    tacticsPlayed: 0,
    effectiveTactics: 0,
    finishOrder: [],
    eventSequence: 0,
    pendingEvents: [],
    result: null,
  };

  race.rivalDeck = buildRivalBlock(meet.seed, race, 0);
  meet.currentRace = race;
  meet.usedRacerIds.push(championRacerId);
  meet.meetPhase = 'RACING';

  pushEvent(
    race,
    'RACE_START',
    championRacerId,
    0,
    `Race ${raceNumber} of ${PetCardRaceRacesPerMeet}: ${racerName(championRacerId)} is your champion.`,
  );
  dealDueStations(meet, race);
}

function rivalIdsOf(race: PetCardRaceRaceState): PetCardRaceRacerId[] {
  return ROSTER_IDS.filter((racerId) => racerId !== race.championRacerId);
}

function buildRivalBlock(
  seed: string,
  race: PetCardRaceRaceState,
  block: number,
): PetCardRaceRacerId[] {
  const cards: PetCardRaceRacerId[] = [];
  for (const racerId of rivalIdsOf(race)) {
    for (let step = 0; step < PetCardRaceTrackLength; step += 1) {
      cards.push(racerId);
    }
  }

  return shuffle(cards, createSeededRandom(`${seed}:rivals:${race.raceNumber}:${block}`));
}

function takeRivalCard(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
): PetCardRaceRacerId | null {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (race.rivalDeck.length === 0) {
      race.rivalDeckBlocks += 1;
      race.rivalDeck = buildRivalBlock(meet.seed, race, race.rivalDeckBlocks);
    }

    const racerId = race.rivalDeck.shift();
    if (!racerId) {
      continue;
    }

    if (race.lanes[racerId]?.finishPosition === null) {
      return racerId;
    }
  }

  return null;
}

function dealDueStations(meet: PetCardRaceMeetState, race: PetCardRaceRaceState): void {
  while (race.phase === 'RUNNING' && race.stationsDealt < PetCardRaceStationCount) {
    const triggerStep = PetCardRaceStationSteps[race.stationsDealt];
    if (triggerStep === undefined || leaderStep(race) < triggerStep) {
      return;
    }

    const dealSize = PetCardRaceStationDealSizes[race.stationsDealt] ?? 0;
    const dealt = race.drawPile.splice(0, dealSize);
    race.hand.push(...dealt);
    race.stationsDealt += 1;
    const isFinalStation = race.stationsDealt === PetCardRaceStationCount;

    pushEvent(
      race,
      'STATION_DEAL',
      null,
      null,
      `${isFinalStation ? 'Final station' : `Station ${race.stationsDealt}`}: ${dealt.length} cards dealt (${dealt
        .map((card) => card.label)
        .join(', ')}).`,
    );

    if (race.stationsDealt > 1) {
      applyRivalTactic(meet, race);
    }
  }
}

/** Rival trainers answer every station after the first with one tactic aimed at your champion. */
function applyRivalTactic(meet: PetCardRaceMeetState, race: PetCardRaceRaceState): void {
  const champion = race.lanes[race.championRacerId];
  if (!champion || champion.finishPosition !== null) {
    return;
  }

  const options: readonly PetCardRaceTacticKind[] = ['WEIGHTS', 'CHASER', 'MUD'];
  const random = createSeededRandom(
    `${meet.seed}:rival-tactic:${race.raceNumber}:${race.stationsDealt}`,
  );
  const kind = options[Math.floor(random() * options.length)] ?? 'WEIGHTS';
  const name = racerName(race.championRacerId);

  if (champion.shielded) {
    champion.shielded = false;
    pushEvent(
      race,
      'SHIELD_BLOCKED',
      race.championRacerId,
      champion.step,
      `The moon shield breaks the rival ${petCardRaceTacticDefinition(kind).title.toLowerCase()} aimed at ${name}.`,
    );
    return;
  }

  switch (kind) {
    case 'WEIGHTS':
      champion.slowedSteps += PetCardRaceSlowSteps;
      pushEvent(
        race,
        'RIVAL_TACTIC',
        race.championRacerId,
        champion.step,
        `Rival trainers weigh down ${name}: the next step is lost.`,
      );
      break;
    case 'CHASER':
      champion.step = Math.max(0, champion.step - 1);
      champion.slowedSteps += PetCardRaceSlowSteps;
      pushEvent(
        race,
        'RIVAL_TACTIC',
        race.championRacerId,
        champion.step,
        `A trail animal chases ${name} back a step.`,
      );
      break;
    case 'MUD':
      addMud(race, champion.step + PetCardRaceMudLeadSteps, 'CHAMPION');
      pushEvent(
        race,
        'RIVAL_TACTIC',
        race.championRacerId,
        champion.step,
        `Rivals churn mud into the track ahead of ${name}.`,
      );
      break;
    default:
      break;
  }
}

function applyPlayerTactic(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  kind: PetCardRaceTacticKind,
  targetRacerId?: PetCardRaceRacerId,
): void {
  const champion = race.lanes[race.championRacerId];
  if (!champion) {
    throw new PetCardRaceRuleError('STATE', 'This race has no champion lane');
  }

  const definition = petCardRaceTacticDefinition(kind);
  let effective = false;
  let message = definition.title;

  switch (kind) {
    case 'SPRINT': {
      effective = true;
      message = `${racerName(race.championRacerId)} sprints an extra step.`;
      break;
    }
    case 'SHIELD': {
      effective = !champion.shielded;
      champion.shielded = true;
      message = `A moon shield guards ${racerName(race.championRacerId)} from the next rival tactic.`;
      break;
    }
    case 'WEIGHTS': {
      for (const racerId of rivalIdsOf(race)) {
        const lane = race.lanes[racerId];
        if (!lane || lane.finishPosition !== null) {
          continue;
        }

        lane.slowedSteps += PetCardRaceSlowSteps;
        effective = true;
      }

      message = 'Heavy paws weigh down every rival: each loses its next run card.';
      break;
    }
    case 'MUD': {
      effective = addMud(race, champion.step + PetCardRaceMudLeadSteps, 'RIVALS');
      message = effective
        ? 'A mud stretch floods the track: every rival that reaches it loses a step.'
        : 'That stretch of track is already mud.';
      break;
    }
    case 'CHASER': {
      const target = requireRivalTarget(race, targetRacerId);
      const lane = race.lanes[target];
      if (lane) {
        lane.step = Math.max(0, lane.step - 1);
        lane.slowedSteps += PetCardRaceSlowSteps;
        effective = true;
      }

      message = `A trail animal chases ${racerName(target)} back a step.`;
      break;
    }
    default:
      break;
  }

  if (effective) {
    race.effectiveTactics += 1;
  }

  pushEvent(race, 'TACTIC_PLAYED', race.championRacerId, champion.step, message);

  if (kind === 'SPRINT') {
    advanceRacer(meet, race, race.championRacerId, PetCardRaceSprintSteps, 'CHAMPION_ADVANCE');
  }
}

function advanceRacer(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  racerId: PetCardRaceRacerId,
  steps: number,
  eventType: Extract<PetCardRaceEventType, 'CHAMPION_ADVANCE' | 'RIVAL_ADVANCE'>,
): void {
  const lane = race.lanes[racerId];
  if (!lane || lane.finishPosition !== null || steps <= 0) {
    return;
  }

  let remaining = steps;
  if (lane.slowedSteps > 0) {
    const absorbed = Math.min(lane.slowedSteps, remaining);
    lane.slowedSteps -= absorbed;
    remaining -= absorbed;
    pushEvent(
      race,
      'SLOWED',
      racerId,
      lane.step,
      `${racerName(racerId)} loses ${absorbed} step${absorbed === 1 ? '' : 's'} to the trail.`,
    );
  }

  const isChampion = racerId === race.championRacerId;
  for (let moved = 0; moved < remaining && lane.step < PetCardRaceTrackLength; moved += 1) {
    lane.step += 1;

    const patch = race.mud.find(
      (entry) =>
        entry.step === lane.step &&
        entry.affects === (isChampion ? 'CHAMPION' : 'RIVALS') &&
        !lane.mudCleared.includes(entry.step),
    );

    if (patch) {
      lane.mudCleared.push(patch.step);
      lane.slowedSteps += PetCardRaceSlowSteps;
      pushEvent(
        race,
        'MUD_HIT',
        racerId,
        lane.step,
        `${racerName(racerId)} slogs into the mud and loses the next step.`,
      );
    }
  }

  if (remaining > 0) {
    pushEvent(
      race,
      eventType,
      racerId,
      lane.step,
      `${racerName(racerId)} reaches step ${lane.step} of ${PetCardRaceTrackLength}.`,
    );
  }

  if (lane.step >= PetCardRaceTrackLength) {
    crossLine(meet, race, racerId);
  }
}

function crossLine(
  meet: PetCardRaceMeetState,
  race: PetCardRaceRaceState,
  racerId: PetCardRaceRacerId,
): void {
  const lane = race.lanes[racerId];
  if (!lane || lane.finishPosition !== null) {
    return;
  }

  race.finishOrder.push(racerId);
  lane.finishPosition = race.finishOrder.length;
  pushEvent(
    race,
    'RACER_FINISHED',
    racerId,
    lane.step,
    `${racerName(racerId)} crosses the line in position ${lane.finishPosition}.`,
  );

  const rivalsHome = race.finishOrder.filter((id) => id !== race.championRacerId).length;
  if (racerId === race.championRacerId || rivalsHome >= ROSTER_IDS.length - 1) {
    completeRace(meet, race);
  }
}

function completeRace(meet: PetCardRaceMeetState, race: PetCardRaceRaceState): void {
  if (race.phase !== 'RUNNING') {
    return;
  }

  const order = buildOrder(race);
  const champion = order.find((entry) => entry.racerId === race.championRacerId);
  if (!champion) {
    throw new PetCardRaceRuleError('STATE', 'This race has no champion result');
  }

  const bestRivalStep = Math.max(
    ...order.filter((entry) => entry.racerId !== race.championRacerId).map((entry) => entry.step),
    0,
  );
  const marginSteps = champion.position === 1 ? champion.step - bestRivalStep : 0;
  const photoFinish = champion.position === 1 && marginSteps <= 1;
  const breakdown = scorePetCardRace({
    championPosition: champion.position,
    combosPlayed: race.combosPlayed,
    effectiveTactics: race.effectiveTactics,
    marginSteps,
    photoFinish,
  });

  race.phase = 'FINISHED';
  race.result = {
    raceNumber: race.raceNumber,
    championRacerId: race.championRacerId,
    championPosition: champion.position,
    championCrossedLine: champion.crossedLine,
    order,
    combosPlayed: race.combosPlayed,
    tacticsPlayed: race.tacticsPlayed,
    photoFinish,
    score: breakdown.total,
    breakdown,
  };

  meet.completedRaces.push(race.result);
  meet.totalScore += breakdown.total;
  meet.meetPhase =
    meet.completedRaces.length >= PetCardRaceRacesPerMeet ? 'COMPLETE' : 'RACE_INTERMISSION';

  pushEvent(
    race,
    'RACE_COMPLETE',
    race.championRacerId,
    champion.step,
    `${racerName(race.championRacerId)} finishes ${ordinal(champion.position)} for ${breakdown.total} points.`,
  );
}

function buildOrder(race: PetCardRaceRaceState): PetCardRaceFinish[] {
  const finished: PetCardRaceFinish[] = race.finishOrder.map((racerId, index) => ({
    racerId,
    position: index + 1,
    step: race.lanes[racerId]?.step ?? 0,
    crossedLine: true,
  }));

  const unfinished = ROSTER_IDS.filter((racerId) => !race.finishOrder.includes(racerId))
    .sort(
      (a, b) =>
        (race.lanes[b]?.step ?? 0) - (race.lanes[a]?.step ?? 0) ||
        ROSTER_IDS.indexOf(a) - ROSTER_IDS.indexOf(b),
    )
    .map((racerId, index) => ({
      racerId,
      position: finished.length + index + 1,
      step: race.lanes[racerId]?.step ?? 0,
      crossedLine: false,
    }));

  return [...finished, ...unfinished];
}

function buildMeetResult(meet: PetCardRaceMeetState): PetCardRaceMeetResult {
  return {
    totalScore: meet.totalScore,
    bestPosition: Math.min(...meet.completedRaces.map((race) => race.championPosition), 4),
    wins: meet.completedRaces.filter((race) => race.championPosition === 1).length,
    races: [...meet.completedRaces],
  };
}

function takeRaceView(race: PetCardRaceRaceState, nowMs: number): PetCardRaceRaceView {
  const events = race.pendingEvents;
  race.pendingEvents = [];

  return {
    raceNumber: race.raceNumber,
    phase: race.phase,
    championRacerId: race.championRacerId,
    trackLength: PetCardRaceTrackLength,
    lanes: ROSTER_IDS.map((racerId) => {
      const lane = race.lanes[racerId];
      return {
        racerId,
        isChampion: racerId === race.championRacerId,
        step: lane?.step ?? 0,
        slowedSteps: lane?.slowedSteps ?? 0,
        shielded: lane?.shielded ?? false,
        finishPosition: lane?.finishPosition ?? null,
      };
    }),
    mudSteps: race.mud.map((patch) => patch.step),
    hand: sortPetCardRaceHand(race.hand),
    cardsLeftToDeal: PetCardRaceStationDealSizes.slice(race.stationsDealt).reduce(
      (total, size) => total + size,
      0,
    ),
    stationsDealt: race.stationsDealt,
    stationsTotal: PetCardRaceStationCount,
    events,
    cooldownRemainingMs: race.phase === 'RUNNING' ? cooldownRemainingMs(race, nowMs) : 0,
    nextRivalTickInMs: race.phase === 'RUNNING' ? nextRivalTickInMs(race, nowMs) : null,
    combosPlayed: race.combosPlayed,
    tacticsPlayed: race.tacticsPlayed,
    result: race.result,
  };
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

function requireRivalTarget(
  race: PetCardRaceRaceState,
  targetRacerId: PetCardRaceRacerId | undefined,
): PetCardRaceRacerId {
  if (!targetRacerId) {
    throw new PetCardRaceRuleError('TARGET', 'Choose which rival the trail chaser goes after');
  }

  if (targetRacerId === race.championRacerId) {
    throw new PetCardRaceRuleError('TARGET', 'A trail chaser cannot be sent after your own pet');
  }

  const lane = race.lanes[targetRacerId];
  if (!lane) {
    throw new PetCardRaceRuleError('TARGET', 'That racer is not in this race');
  }

  if (lane.finishPosition !== null) {
    throw new PetCardRaceRuleError('TARGET', 'That rival has already crossed the line');
  }

  return targetRacerId;
}

function addMud(race: PetCardRaceRaceState, step: number, affects: MudPatch['affects']): boolean {
  const clamped = Math.min(Math.max(step, 1), PetCardRaceTrackLength - 1);
  if (race.mud.some((patch) => patch.step === clamped && patch.affects === affects)) {
    return false;
  }

  race.mud.push({ step: clamped, affects });
  return true;
}

function cooldownRemainingMs(race: PetCardRaceRaceState, nowMs: number): number {
  if (race.lastPlayAtMs === null) {
    return 0;
  }

  return Math.max(0, PetCardRacePlayCooldownMs - (nowMs - race.lastPlayAtMs));
}

function nextRivalTickInMs(race: PetCardRaceRaceState, nowMs: number): number {
  const elapsed = Math.max(0, nowMs - race.startedAtMs);
  return PetCardRaceRivalTickMs - (elapsed % PetCardRaceRivalTickMs);
}

function leaderStep(race: PetCardRaceRaceState): number {
  return Math.max(...ROSTER_IDS.map((racerId) => race.lanes[racerId]?.step ?? 0), 0);
}

function pushEvent(
  race: PetCardRaceRaceState,
  type: PetCardRaceEventType,
  racerId: PetCardRaceRacerId | null,
  step: number | null,
  message: string,
): void {
  race.eventSequence += 1;
  race.pendingEvents.push({
    sequence: race.eventSequence,
    type,
    racerId,
    step,
    message,
  });
}

function racerName(racerId: PetCardRaceRacerId): string {
  return PET_CARD_RACE_ROSTER.find((racer) => racer.racerId === racerId)?.displayName ?? racerId;
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
