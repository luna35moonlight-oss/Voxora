import { describe, expect, it } from 'vitest';
import {
  bankDice,
  diceCategories,
  diceMatchOver,
  holdDie,
  newDiceMatch,
  rollDice,
  scoreDice,
  sheetTotal,
} from './moonDice';

describe('Moon Dice rules and complete local matches', () => {
  it('scores every pattern including duplicate straights and strict full houses', () => {
    expect(scoreDice([2, 2, 2, 4, 4], 'Full house')).toBe(25);
    expect(scoreDice([2, 2, 2, 2, 2], 'Full house')).toBe(0);
    expect(scoreDice([1, 2, 2, 3, 4], 'Small straight')).toBe(30);
    expect(scoreDice([2, 3, 4, 5, 6], 'Large straight')).toBe(40);
    expect(scoreDice([1, 2, 3, 4, 4], 'Large straight')).toBe(0);
    expect(scoreDice([6, 6, 6, 6, 2], 'Four of a kind')).toBe(26);
    expect(scoreDice([1, 2, 3, 4, 5], 'Three of a kind')).toBe(0);
    expect(scoreDice([5, 5, 5, 5, 5], 'Five of a kind')).toBe(50);
    expect(scoreDice([1, 2, 3, 4, 5], 'Chance')).toBe(15);
    expect(scoreDice([6, 6, 6, 6, 2], 'Sixes')).toBe(24);
  });
  it('only awards the upper bonus when 63 is reached', () => {
    expect(sheetTotal({ Ones: 3, Twos: 6, Threes: 9, Fours: 12, Fives: 15, Sixes: 18 })).toBe(98);
    expect(sheetTotal({ Chance: 30, 'Five of a kind': 50 })).toBe(80);
  });
  it('enforces three rolls and preserves held dice without mutating prior state', () => {
    let match = rollDice(newDiceMatch(), () => 0);
    const previous = match;
    match = holdDie(match, 0);
    match = rollDice(match, () => 0.999);
    expect(match.dice).toEqual([1, 6, 6, 6, 6]);
    expect(previous.held[0]).toBe(false);
    match = rollDice(match, () => 0.5);
    expect(rollDice(match)).toBe(match);
  });
  it('blocks unrolled scoring, repeated categories and invalid random samples', () => {
    const start = newDiceMatch();
    expect(bankDice(start, 'Chance')).toBe(start);
    expect(holdDie(start, 0)).toBe(start);
    expect(() => rollDice(start, () => 1)).toThrow();
    expect(() => scoreDice([1, 1, 1, 1, 7], 'Chance')).toThrow();
    const banked = bankDice(
      rollDice(start, () => 0),
      'Chance',
      () => 0,
    );
    const rerolled = rollDice(banked, () => 0.5);
    expect(bankDice(rerolled, 'Chance')).toBe(rerolled);
  });
  it('finishes 13 legal rounds for both players with separate dice and no post-game moves', () => {
    let match = newDiceMatch();
    for (const category of diceCategories) {
      match = rollDice(match, () => 0); // Player gets ones.
      match = bankDice(match, category, () => 0.999); // Alpha gets sixes.
      expect(match.rolls).toBe(0);
      expect(match.held.every((value) => !value)).toBe(true);
    }
    expect(diceMatchOver(match)).toBe(true);
    expect(Object.keys(match.player)).toHaveLength(13);
    expect(Object.keys(match.alpha)).toHaveLength(13);
    expect(match.player.Ones).toBe(5);
    expect(match.alpha.Sixes).toBe(30);
    expect(rollDice(match)).toBe(match);
    expect(bankDice(match, 'Chance')).toBe(match);
  });
});
