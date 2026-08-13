import { describe, expect, it } from 'vitest';
import {
  applyWhiteWolfMove,
  createInitialWhiteWolfGame,
  getWhiteWolfPrompt,
  WHITE_WOLF_MAX_ENERGY,
  type WhiteWolfGameState,
} from './whiteWolfMoonDash';

describe('white wolf moon dash', () => {
  it('scores crystals and spends moonlight for trail moves', () => {
    const firstMove = applyWhiteWolfMove(createInitialWhiteWolfGame(), 'sniff');
    const secondMove = applyWhiteWolfMove(firstMove, 'pounce');

    expect(firstMove).toMatchObject({
      score: 3,
      energy: 4,
      bond: 1,
      streak: 1,
      round: 2,
      status: 'playing',
    });
    expect(secondMove.score).toBe(11);
    expect(secondMove.energy).toBe(2);
    expect(secondMove.bond).toBe(2);
    expect(secondMove.streak).toBe(2);
  });

  it('uses howl to restore capped moonlight and reset the trail streak', () => {
    const lowEnergy: WhiteWolfGameState = {
      ...createInitialWhiteWolfGame(),
      energy: 5,
      streak: 3,
    };

    const next = applyWhiteWolfMove(lowEnergy, 'howl');

    expect(next.energy).toBe(WHITE_WOLF_MAX_ENERGY);
    expect(next.score).toBe(1);
    expect(next.bond).toBe(2);
    expect(next.streak).toBe(0);
  });

  it('blocks pounce when there is not enough moonlight', () => {
    const tiredWolf: WhiteWolfGameState = {
      ...createInitialWhiteWolfGame(),
      energy: 1,
    };

    const next = applyWhiteWolfMove(tiredWolf, 'pounce');

    expect(next).toMatchObject({
      score: 0,
      energy: 1,
      round: 1,
      status: 'playing',
    });
    expect(next.lastMessage).toMatch(/at least 2 moonlight/i);
  });

  it('wins when Lumi reaches the moon den target', () => {
    const nearWin: WhiteWolfGameState = {
      ...createInitialWhiteWolfGame(),
      score: 23,
      energy: 1,
    };

    const next = applyWhiteWolfMove(nearWin, 'sniff');

    expect(next.status).toBe('won');
    expect(getWhiteWolfPrompt(next)).toMatch(/moon den/i);
  });
});
