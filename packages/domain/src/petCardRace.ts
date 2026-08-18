import {
  PET_CARD_RACE_BALANCE,
  PET_CARD_RACE_COMBO_LABELS,
  PET_CARD_RACE_FAST_RANKS,
  PET_CARD_RACE_PETS,
  PET_CARD_RACE_RACE_PROFILES,
  PET_CARD_RACE_TACTIC_DEFINITIONS,
  PetCardRaceJokerCount,
  PetCardRaceMaxRaceScore,
  PetCardRaceMaxSelectionSize,
  type PetCardRaceCard,
  type PetCardRaceComboKind,
  type PetCardRacePet,
  type PetCardRacePetId,
  type PetCardRaceRaceProfile,
  type PetCardRaceRank,
  type PetCardRaceScoreBreakdown,
  type PetCardRaceSelectionPreview,
  type PetCardRaceSuit,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';

/** Copies of each tactic card in a race pool. */
export const PET_CARD_RACE_TACTIC_COPIES = 2;

const SUIT_GLYPHS: Readonly<Record<PetCardRaceSuit, string>> = {
  MOON: '☾',
  STAR: '✦',
  CRYSTAL: '◈',
  FLAME: '✺',
};

const SUIT_ORDER: readonly PetCardRaceSuit[] = ['MOON', 'STAR', 'CRYSTAL', 'FLAME'];

export function petCardRaceSuitGlyph(suit: PetCardRaceSuit): string {
  return SUIT_GLYPHS[suit];
}

export function isPetCardRaceFastRank(rank: PetCardRaceRank): boolean {
  return PET_CARD_RACE_FAST_RANKS.includes(rank);
}

export function petCardRaceTacticDefinition(kind: PetCardRaceTacticKind) {
  const definition = PET_CARD_RACE_TACTIC_DEFINITIONS.find((entry) => entry.kind === kind);
  if (!definition) {
    throw new Error(`Unknown pet card race tactic: ${kind}`);
  }

  return definition;
}

export function petCardRacePet(petId: PetCardRacePetId): PetCardRacePet {
  const pet = PET_CARD_RACE_PETS.find((entry) => entry.petId === petId);
  if (!pet) {
    throw new Error(`Unknown pet card race racer: ${petId}`);
  }

  return pet;
}

/** Pet → race profile → opening hand influence. */
export function petCardRaceProfileFor(petId: PetCardRacePetId): PetCardRaceRaceProfile {
  const pet = petCardRacePet(petId);
  const profile = PET_CARD_RACE_RACE_PROFILES.find(
    (entry) => entry.profileKey === pet.raceProfileKey,
  );

  if (!profile) {
    throw new Error(`Pet ${petId} references unknown race profile ${pet.raceProfileKey}`);
  }

  return profile;
}

/**
 * Builds one race card pool in a fixed order: 52 rank cards, two jokers, and two copies of each
 * tactic card. Shuffling belongs to the server so this order is never the dealt order.
 */
export function buildPetCardRaceDeck(cardIdPrefix: string): PetCardRaceCard[] {
  const deck: PetCardRaceCard[] = [];
  const nextId = () => `${cardIdPrefix}-${String(deck.length + 1).padStart(2, '0')}`;

  for (const suit of SUIT_ORDER) {
    for (const rank of PET_CARD_RACE_RANK_ORDER_LOCAL) {
      deck.push({
        cardId: nextId(),
        type: 'RANK',
        rank,
        suit,
        tactic: null,
        fast: isPetCardRaceFastRank(rank),
        label: `${rank}${SUIT_GLYPHS[suit]}`,
      });
    }
  }

  for (let index = 0; index < PetCardRaceJokerCount; index += 1) {
    deck.push({
      cardId: nextId(),
      type: 'JOKER',
      rank: null,
      suit: null,
      tactic: null,
      fast: false,
      label: 'Joker',
    });
  }

  for (const definition of PET_CARD_RACE_TACTIC_DEFINITIONS) {
    for (let copy = 0; copy < PET_CARD_RACE_TACTIC_COPIES; copy += 1) {
      deck.push({
        cardId: nextId(),
        type: 'TACTIC',
        rank: null,
        suit: null,
        tactic: definition.kind,
        fast: false,
        label: definition.title,
      });
    }
  }

  return deck;
}

/**
 * Evaluates a card selection into the speed boost it grants the pet.
 *
 * The pets are already running: a combination makes the player's pet run faster for a while, it does
 * not move the pet along the course. A joker stands in for whichever rank helps most, and every 10,
 * J, Q, or K in the selection adds a little more speed up to the configured ceiling.
 */
export function evaluatePetCardRaceSelection(
  cards: readonly PetCardRaceCard[],
): PetCardRaceSelectionPreview {
  if (cards.length === 0) {
    return invalidSelection('Select at least one card');
  }

  if (cards.length > PetCardRaceMaxSelectionSize) {
    return invalidSelection(`A selection holds at most ${PetCardRaceMaxSelectionSize} cards`);
  }

  if (new Set(cards.map((card) => card.cardId)).size !== cards.length) {
    return invalidSelection('The same card cannot be selected twice');
  }

  const tacticCards = cards.filter((card) => card.type === 'TACTIC');
  if (tacticCards.length > 0) {
    const tactic = tacticCards[0];
    if (cards.length > 1 || !tactic?.tactic) {
      return invalidSelection('A tactic card is played on its own');
    }

    const definition = petCardRaceTacticDefinition(tactic.tactic);
    const tuning = PET_CARD_RACE_BALANCE.tactics[tactic.tactic];

    return {
      valid: true,
      kind: 'TACTIC',
      label: definition.title,
      speedMultiplier: 'multiplier' in tuning ? tuning.multiplier : 1,
      fastCardBonus: 0,
      durationMs: 'durationMs' in tuning ? tuning.durationMs : 0,
      reason: null,
    };
  }

  const fixedRanks: PetCardRaceRank[] = [];
  let jokers = 0;
  for (const card of cards) {
    if (card.type === 'JOKER') {
      jokers += 1;
      continue;
    }

    if (!card.rank) {
      return invalidSelection('That card cannot be played as a rank card');
    }

    fixedRanks.push(card.rank);
  }

  if (jokers > PetCardRaceJokerCount) {
    return invalidSelection(`A race pool holds only ${PetCardRaceJokerCount} jokers`);
  }

  let best: {
    kind: PetCardRaceComboKind;
    speedMultiplier: number;
    fastCardBonus: number;
    durationMs: number;
  } | null = null;

  for (const wildRanks of jokerAssignments(jokers)) {
    const ranks = [...fixedRanks, ...wildRanks];
    const kind = classifyRanks(ranks);
    if (!kind || kind === 'TACTIC') {
      continue;
    }

    const boost = PET_CARD_RACE_BALANCE.comboBoosts[kind];
    const fastCardBonus = Math.min(
      ranks.filter((rank) => isPetCardRaceFastRank(rank)).length *
        PET_CARD_RACE_BALANCE.fastCardBonusPerCard,
      PET_CARD_RACE_BALANCE.fastCardBonusCap,
    );
    const speedMultiplier = round2(boost.multiplier + fastCardBonus);

    if (!best || speedMultiplier > best.speedMultiplier) {
      best = {
        kind,
        speedMultiplier,
        fastCardBonus: round2(fastCardBonus),
        durationMs: boost.durationMs,
      };
    }
  }

  if (!best) {
    return invalidSelection(describeUnplayableSize(cards.length));
  }

  return {
    valid: true,
    kind: best.kind,
    label: PET_CARD_RACE_COMBO_LABELS[best.kind],
    speedMultiplier: best.speedMultiplier,
    fastCardBonus: best.fastCardBonus,
    durationMs: best.durationMs,
    reason: null,
  };
}

/** Race score. Only the server calls this: the client never submits its own score. */
export function scorePetCardRace(input: {
  position: number;
  combosPlayed: number;
  effectiveTactics: number;
  marginMetres: number;
  photoFinish: boolean;
}): PetCardRaceScoreBreakdown {
  const scoring = PET_CARD_RACE_BALANCE.scoring;
  const positionPoints = scoring.positionPoints[input.position - 1] ?? 0;
  const comboPoints = Math.min(input.combosPlayed * scoring.comboPoints, scoring.comboPointsCap);
  const tacticPoints = Math.min(
    input.effectiveTactics * scoring.tacticPoints,
    scoring.tacticPointsCap,
  );
  const marginPoints =
    input.position === 1
      ? Math.min(
          Math.floor(Math.max(input.marginMetres, 0) / 10) * scoring.marginPointsPerTenMetres,
          scoring.marginPointsCap,
        )
      : 0;
  const photoFinishPoints = input.photoFinish ? scoring.photoFinishPoints : 0;

  return {
    positionPoints,
    comboPoints,
    tacticPoints,
    marginPoints,
    photoFinishPoints,
    total: Math.min(
      positionPoints + comboPoints + tacticPoints + marginPoints + photoFinishPoints,
      PetCardRaceMaxRaceScore,
    ),
  };
}

/** Display order for a hand: rank cards by rank, then jokers, then tactic cards. */
export function sortPetCardRaceHand(cards: readonly PetCardRaceCard[]): PetCardRaceCard[] {
  return [...cards].sort((a, b) => typeWeight(a) - typeWeight(b) || rankWeight(a) - rankWeight(b));
}

const PET_CARD_RACE_RANK_ORDER_LOCAL: readonly PetCardRaceRank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

function typeWeight(card: PetCardRaceCard): number {
  switch (card.type) {
    case 'RANK':
      return 0;
    case 'JOKER':
      return 1;
    case 'TACTIC':
      return 2;
  }
}

function rankWeight(card: PetCardRaceCard): number {
  return card.rank ? PET_CARD_RACE_RANK_ORDER_LOCAL.indexOf(card.rank) : 0;
}

function classifyRanks(ranks: readonly PetCardRaceRank[]): PetCardRaceComboKind | null {
  const counts = new Map<PetCardRaceRank, number>();
  for (const rank of ranks) {
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }

  const groups = [...counts.values()].sort((a, b) => b - a);

  switch (ranks.length) {
    case 1:
      return 'SINGLE';
    case 2:
      return counts.size === 1 ? 'PAIR' : null;
    case 3:
      return counts.size === 1 ? 'THREE_OF_A_KIND' : null;
    case 4:
      if (counts.size === 1) {
        return 'FOUR_OF_A_KIND';
      }

      if (isRunOfFour(ranks)) {
        return 'RUN_OF_FOUR';
      }

      return counts.size === 2 && groups[0] === 2 ? 'TWO_PAIR' : null;
    case 5:
      return counts.size === 2 && groups[0] === 3 && groups[1] === 2 ? 'FULL_HOUSE' : null;
    case 6:
      return counts.size === 3 && groups.every((count) => count === 2) ? 'THREE_PAIR' : null;
    default:
      return null;
  }
}

function isRunOfFour(ranks: readonly PetCardRaceRank[]): boolean {
  const indexes = [...new Set(ranks)]
    .map((rank) => PET_CARD_RACE_RANK_ORDER_LOCAL.indexOf(rank))
    .sort((a, b) => a - b);

  if (indexes.length !== 4) {
    return false;
  }

  return indexes.every(
    (value, position) => position === 0 || value === (indexes[position - 1] ?? 0) + 1,
  );
}

function jokerAssignments(jokers: number): PetCardRaceRank[][] {
  if (jokers === 0) {
    return [[]];
  }

  const assignments: PetCardRaceRank[][] = [];
  for (const rank of PET_CARD_RACE_RANK_ORDER_LOCAL) {
    for (const rest of jokerAssignments(jokers - 1)) {
      assignments.push([rank, ...rest]);
    }
  }

  return assignments;
}

function describeUnplayableSize(size: number): string {
  switch (size) {
    case 2:
      return 'Two cards must make a pair';
    case 3:
      return 'Three cards must make three of a kind';
    case 4:
      return 'Four cards must make two pair, a sequence of four, or four of a kind';
    case 5:
      return 'Five cards must make a full house';
    case 6:
      return 'Six cards must make three pairs';
    default:
      return 'That selection is not a playable combination';
  }
}

function invalidSelection(reason: string): PetCardRaceSelectionPreview {
  return {
    valid: false,
    kind: null,
    label: 'No combination',
    speedMultiplier: 1,
    fastCardBonus: 0,
    durationMs: 0,
    reason,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
