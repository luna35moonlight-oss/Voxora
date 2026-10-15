/** Local practice rules. No currency, rewards, network play or LLM-generated outcomes. */
export const diceCategories = [
  'Ones',
  'Twos',
  'Threes',
  'Fours',
  'Fives',
  'Sixes',
  'Three of a kind',
  'Four of a kind',
  'Full house',
  'Small straight',
  'Large straight',
  'Five of a kind',
  'Chance',
] as const;
export type DiceCategory = (typeof diceCategories)[number];
export type DiceSheet = Partial<Record<DiceCategory, number>>;
export type DiceMatch = {
  dice: number[];
  held: boolean[];
  rolls: number;
  player: DiceSheet;
  alpha: DiceSheet;
  lastAlpha: string | null;
};
export function newDiceMatch(): DiceMatch {
  return {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rolls: 0,
    player: {},
    alpha: {},
    lastAlpha: null,
  };
}
export function scoreDice(dice: number[], category: DiceCategory): number {
  if (dice.length !== 5 || dice.some((value) => !Number.isInteger(value) || value < 1 || value > 6))
    throw new Error('Five valid dice required');
  const counts = Array.from(
    { length: 6 },
    (_, i) => dice.filter((value) => value === i + 1).length,
  );
  const sum = dice.reduce((total, value) => total + value, 0);
  const upper = diceCategories.indexOf(category);
  if (upper < 0) throw new Error('Unknown category');
  if (upper < 6) return (counts[upper] ?? 0) * (upper + 1);
  switch (category) {
    case 'Three of a kind':
      return Math.max(...counts) >= 3 ? sum : 0;
    case 'Four of a kind':
      return Math.max(...counts) >= 4 ? sum : 0;
    case 'Full house':
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case 'Small straight':
      return [0, 1, 2].some((start) => counts.slice(start, start + 4).every((count) => count > 0))
        ? 30
        : 0;
    case 'Large straight':
      return [0, 1].some((start) => counts.slice(start, start + 5).every((count) => count > 0))
        ? 40
        : 0;
    case 'Five of a kind':
      return counts.includes(5) ? 50 : 0;
    case 'Chance':
      return sum;
    default:
      return 0;
  }
}
export function sheetTotal(sheet: DiceSheet): number {
  const upper = diceCategories.slice(0, 6).reduce((total, key) => total + (sheet[key] ?? 0), 0);
  return (
    Object.values(sheet).reduce((total, value) => total + (value ?? 0), 0) + (upper >= 63 ? 35 : 0)
  );
}
export function diceMatchOver(match: DiceMatch): boolean {
  return diceCategories.every((category) => match.player[category] !== undefined);
}
function die(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('Random sample must be in [0, 1)');
  return Math.floor(value * 6) + 1;
}
export function rollDice(match: DiceMatch, random: () => number = Math.random): DiceMatch {
  if (diceMatchOver(match) || match.rolls >= 3) return match;
  return {
    ...match,
    dice: match.dice.map((value, index) =>
      match.rolls > 0 && match.held[index] ? value : die(random),
    ),
    rolls: match.rolls + 1,
  };
}
export function holdDie(match: DiceMatch, index: number): DiceMatch {
  if (
    match.rolls === 0 ||
    match.rolls >= 3 ||
    diceMatchOver(match) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 4
  )
    return match;
  return { ...match, held: match.held.map((held, i) => (i === index ? !held : held)) };
}
export function bankDice(
  match: DiceMatch,
  category: DiceCategory,
  random: () => number = Math.random,
): DiceMatch {
  if (
    match.rolls === 0 ||
    diceMatchOver(match) ||
    match.player[category] !== undefined ||
    !diceCategories.includes(category)
  )
    return match;
  // Alpha uses its own dice. Keep the most frequent face for two rerolls, then bank best available points.
  let opponent = Array.from({ length: 5 }, () => die(random));
  for (let roll = 0; roll < 2; roll++) {
    const counts = Array.from(
      { length: 6 },
      (_, i) => opponent.filter((value) => value === i + 1).length,
    );
    const keep = counts.indexOf(Math.max(...counts)) + 1;
    opponent = opponent.map((value) => (value === keep ? value : die(random)));
  }
  const available = diceCategories.filter((key) => match.alpha[key] === undefined);
  const choice = available.reduce((best, key) =>
    scoreDice(opponent, key) > scoreDice(opponent, best) ? key : best,
  );
  const alphaScore = scoreDice(opponent, choice);
  return {
    ...match,
    player: { ...match.player, [category]: scoreDice(match.dice, category) },
    alpha: { ...match.alpha, [choice]: alphaScore },
    rolls: 0,
    held: [false, false, false, false, false],
    lastAlpha: `Alpha rolled ${opponent.join(', ')} and scored ${alphaScore} in ${choice}.`,
  };
}
