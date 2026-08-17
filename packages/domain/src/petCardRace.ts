import {
  PET_CARD_RACE_COMBO_BASE_STEPS,
  PET_CARD_RACE_COMBO_LABELS,
  PET_CARD_RACE_FAST_RANKS,
  PET_CARD_RACE_POSITION_POINTS,
  PET_CARD_RACE_RANK_ORDER,
  PET_CARD_RACE_TACTIC_DEFINITIONS,
  PetCardRaceComboScoreCap,
  PetCardRaceComboScorePoints,
  PetCardRaceFastBonusCap,
  PetCardRaceFastRankStepBonus,
  PetCardRaceJokerCount,
  PetCardRaceMarginBonusCap,
  PetCardRaceMarginBonusPerStep,
  PetCardRaceMaxRaceScore,
  PetCardRaceMaxSelectionSize,
  PetCardRacePhotoFinishBonus,
  PetCardRaceTacticScoreCap,
  PetCardRaceTacticScorePoints,
  type PetCardRaceCard,
  type PetCardRaceComboKind,
  type PetCardRaceRank,
  type PetCardRaceScoreBreakdown,
  type PetCardRaceSelectionPreview,
  type PetCardRaceSuit,
  type PetCardRaceTacticKind,
} from '@voxora/contracts';

/** Copies of each tactic card in a race deck. */
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

/**
 * Builds one race deck in a fixed order: 52 rank cards, two jokers, and two copies of each
 * tactic card. Shuffling belongs to the server so the order here is never the dealt order.
 */
export function buildPetCardRaceDeck(cardIdPrefix: string): PetCardRaceCard[] {
  const deck: PetCardRaceCard[] = [];
  const nextId = () => `${cardIdPrefix}-${String(deck.length + 1).padStart(2, '0')}`;

  for (const suit of SUIT_ORDER) {
    for (const rank of PET_CARD_RACE_RANK_ORDER) {
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
 * Evaluates a card selection into the steps a champion gains.
 *
 * A jokers stands in for whichever rank helps the selection most, and every 10, J, Q, or K in
 * the selection adds a step because high cards run faster than the rest of the deck.
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

    return {
      valid: true,
      kind: 'TACTIC',
      label: petCardRaceTacticDefinition(tactic.tactic).title,
      baseSteps: 0,
      fastBonus: 0,
      steps: 0,
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
    return invalidSelection(`A race deck holds only ${PetCardRaceJokerCount} jokers`);
  }

  let best: {
    kind: PetCardRaceComboKind;
    baseSteps: number;
    fastBonus: number;
    steps: number;
  } | null = null;

  for (const wildRanks of jokerAssignments(jokers)) {
    const ranks = [...fixedRanks, ...wildRanks];
    const kind = classifyRanks(ranks);
    if (!kind) {
      continue;
    }

    const baseSteps = PET_CARD_RACE_COMBO_BASE_STEPS[kind];
    const fastBonus = Math.min(
      ranks.filter((rank) => isPetCardRaceFastRank(rank)).length * PetCardRaceFastRankStepBonus,
      PetCardRaceFastBonusCap,
    );
    const steps = baseSteps + fastBonus;

    if (!best || steps > best.steps) {
      best = { kind, baseSteps, fastBonus, steps };
    }
  }

  if (!best) {
    return invalidSelection(describeUnplayableSize(cards.length));
  }

  return {
    valid: true,
    kind: best.kind,
    label: PET_CARD_RACE_COMBO_LABELS[best.kind],
    baseSteps: best.baseSteps,
    fastBonus: best.fastBonus,
    steps: best.steps,
    reason: null,
  };
}

/**
 * Highest-value legal selection in a hand.
 *
 * A hand can reach twenty-one cards, which is a lot to scan against a five second clock, so the
 * client offers this as a suggestion. It only ever proposes a selection the player could have made
 * themselves, and the server still rules on whatever is actually played.
 */
export function findBestPetCardRaceSelection(
  cards: readonly PetCardRaceCard[],
): PetCardRaceCard[] | null {
  const runCards = cards.filter((card) => card.type !== 'TACTIC');
  const jokers = runCards.filter((card) => card.type === 'JOKER');
  const byRank = new Map<PetCardRaceRank, PetCardRaceCard[]>();

  for (const card of runCards) {
    if (!card.rank) {
      continue;
    }

    // Fast cards first, so a chosen group carries as much high-card bonus as it can.
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    group.sort((a, b) => Number(b.fast) - Number(a.fast));
    byRank.set(card.rank, group);
  }

  const candidates: PetCardRaceCard[][] = [];
  const ranksBySize = [...byRank.entries()].sort(
    (a, b) => b[1].length - a[1].length || rankIndex(b[0]) - rankIndex(a[0]),
  );

  // Same-rank groups, optionally topped up with wild cards.
  for (const [, group] of ranksBySize) {
    for (let size = 2; size <= 4; size += 1) {
      for (let wilds = 0; wilds <= jokers.length; wilds += 1) {
        const natural = group.filter((card) => card.type === 'RANK').slice(0, size - wilds);
        if (natural.length + wilds === size) {
          candidates.push([...natural, ...jokers.slice(0, wilds)]);
        }
      }
    }
  }

  const pairs = ranksBySize
    .filter(([, group]) => group.filter((card) => card.type === 'RANK').length >= 2)
    .map(([, group]) => group.filter((card) => card.type === 'RANK').slice(0, 2));
  const trips = ranksBySize
    .filter(([, group]) => group.filter((card) => card.type === 'RANK').length >= 3)
    .map(([, group]) => group.filter((card) => card.type === 'RANK').slice(0, 3));

  if (pairs.length >= 2) {
    candidates.push([...(pairs[0] ?? []), ...(pairs[1] ?? [])]);
  }

  if (pairs.length >= 3) {
    candidates.push([...(pairs[0] ?? []), ...(pairs[1] ?? []), ...(pairs[2] ?? [])]);
  }

  for (const trip of trips) {
    const pair = pairs.find((candidate) => candidate[0]?.rank !== trip[0]?.rank);
    if (pair) {
      candidates.push([...trip, ...pair]);
    }
  }

  // Runs of four consecutive ranks, with wild cards filling any single gaps.
  for (let start = 0; start + 4 <= PET_CARD_RACE_RANK_ORDER.length; start += 1) {
    const window = PET_CARD_RACE_RANK_ORDER.slice(start, start + 4);
    const run: PetCardRaceCard[] = [];
    let missing = 0;
    for (const rank of window) {
      const card = byRank.get(rank)?.find((entry) => entry.type === 'RANK');
      if (card) {
        run.push(card);
      } else {
        missing += 1;
      }
    }

    if (missing <= jokers.length) {
      candidates.push([...run, ...jokers.slice(0, missing)]);
    }
  }

  for (const card of runCards) {
    candidates.push([card]);
  }

  let best: { cards: PetCardRaceCard[]; steps: number } | null = null;
  for (const candidate of candidates) {
    if (new Set(candidate.map((card) => card.cardId)).size !== candidate.length) {
      continue;
    }

    const evaluation = evaluatePetCardRaceSelection(candidate);
    if (evaluation.valid && (!best || evaluation.steps > best.steps)) {
      best = { cards: candidate, steps: evaluation.steps };
    }
  }

  return best?.cards ?? null;
}

function rankIndex(rank: PetCardRaceRank): number {
  return PET_CARD_RACE_RANK_ORDER.indexOf(rank);
}

/** Race score. Only the server calls this: the client never submits its own score. */
export function scorePetCardRace(input: {
  championPosition: number;
  combosPlayed: number;
  effectiveTactics: number;
  marginSteps: number;
  photoFinish: boolean;
}): PetCardRaceScoreBreakdown {
  const positionPoints = PET_CARD_RACE_POSITION_POINTS[input.championPosition - 1] ?? 0;
  const comboPoints = Math.min(
    input.combosPlayed * PetCardRaceComboScorePoints,
    PetCardRaceComboScoreCap,
  );
  const tacticPoints = Math.min(
    input.effectiveTactics * PetCardRaceTacticScorePoints,
    PetCardRaceTacticScoreCap,
  );
  const marginBonus =
    input.championPosition === 1
      ? Math.min(
          Math.max(input.marginSteps, 0) * PetCardRaceMarginBonusPerStep,
          PetCardRaceMarginBonusCap,
        )
      : 0;
  const photoFinishBonus = input.photoFinish ? PetCardRacePhotoFinishBonus : 0;

  return {
    positionPoints,
    comboPoints,
    tacticPoints,
    marginBonus,
    photoFinishBonus,
    total: Math.min(
      positionPoints + comboPoints + tacticPoints + marginBonus + photoFinishBonus,
      PetCardRaceMaxRaceScore,
    ),
  };
}

/** Display order for a hand: rank cards by rank, then jokers, then tactic cards. */
export function sortPetCardRaceHand(cards: readonly PetCardRaceCard[]): PetCardRaceCard[] {
  return [...cards].sort((a, b) => typeWeight(a) - typeWeight(b) || rankWeight(a) - rankWeight(b));
}

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
  return card.rank ? PET_CARD_RACE_RANK_ORDER.indexOf(card.rank) : 0;
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
    .map((rank) => PET_CARD_RACE_RANK_ORDER.indexOf(rank))
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
  for (const rank of PET_CARD_RACE_RANK_ORDER) {
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
      return 'Four cards must make two pair, a run of four, or four of a kind';
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
    baseSteps: 0,
    fastBonus: 0,
    steps: 0,
    reason,
  };
}
