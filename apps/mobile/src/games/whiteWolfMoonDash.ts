export type WhiteWolfMove = 'sniff' | 'pounce' | 'howl';

export type WhiteWolfGameStatus = 'playing' | 'won' | 'resting';

export type WhiteWolfGameState = {
  score: number;
  energy: number;
  bond: number;
  streak: number;
  round: number;
  status: WhiteWolfGameStatus;
  lastMessage: string;
};

export const WHITE_WOLF_TARGET_SCORE = 24;
export const WHITE_WOLF_MAX_ENERGY = 6;

const initialMessage = 'Lumi is ready to chase moon crystals across the snow.';

export function createInitialWhiteWolfGame(): WhiteWolfGameState {
  return {
    score: 0,
    energy: 5,
    bond: 0,
    streak: 0,
    round: 1,
    status: 'playing',
    lastMessage: initialMessage,
  };
}

export function applyWhiteWolfMove(
  state: WhiteWolfGameState,
  move: WhiteWolfMove,
): WhiteWolfGameState {
  if (state.status !== 'playing') {
    return state;
  }

  if (move === 'pounce' && state.energy < 2) {
    return {
      ...state,
      lastMessage: 'Lumi needs at least 2 moonlight to make a brave pounce.',
    };
  }

  const effect = getMoveEffect(state, move);
  const score = state.score + effect.score;
  const energy = clamp(state.energy + effect.energy, 0, WHITE_WOLF_MAX_ENERGY);
  const status = getStatus(score, energy);

  return {
    score,
    energy,
    bond: state.bond + effect.bond,
    streak: effect.nextStreak,
    round: state.round + 1,
    status,
    lastMessage: getMoveMessage(move, status, effect.score),
  };
}

export function getWhiteWolfPrompt(state: WhiteWolfGameState): string {
  if (state.status === 'won') {
    return 'Lumi found the moon den and curls up beside the glowing crystals.';
  }

  if (state.status === 'resting') {
    return 'Lumi ran out of moonlight and needs a cozy rest before trying again.';
  }

  if (state.energy <= 2) {
    return 'Moonlight is low. A gentle howl can help Lumi catch her breath.';
  }

  if (state.streak >= 2) {
    return 'Lumi has a sparkling trail streak. A pounce will score extra crystals.';
  }

  return 'Choose the next trail move for Lumi.';
}

function getMoveEffect(state: WhiteWolfGameState, move: WhiteWolfMove) {
  switch (move) {
    case 'sniff':
      return {
        score: 3 + (state.streak >= 2 ? 1 : 0),
        energy: -1,
        bond: 1,
        nextStreak: state.streak + 1,
      };
    case 'pounce':
      return {
        score: 6 + (state.streak >= 1 ? 2 : 0),
        energy: -2,
        bond: 1,
        nextStreak: state.streak + 1,
      };
    case 'howl':
      return {
        score: 1,
        energy: 2,
        bond: 2,
        nextStreak: 0,
      };
  }
}

function getStatus(score: number, energy: number): WhiteWolfGameStatus {
  if (score >= WHITE_WOLF_TARGET_SCORE) {
    return 'won';
  }

  if (energy <= 0) {
    return 'resting';
  }

  return 'playing';
}

function getMoveMessage(move: WhiteWolfMove, status: WhiteWolfGameStatus, scoreGained: number): string {
  if (status === 'won') {
    return `Lumi bounds into the moon den with ${scoreGained} fresh crystals. You win!`;
  }

  if (status === 'resting') {
    return `Lumi gained ${scoreGained} crystals, then flopped into the soft snow for a nap.`;
  }

  switch (move) {
    case 'sniff':
      return `Lumi sniffs out ${scoreGained} hidden crystals under the frost flowers.`;
    case 'pounce':
      return `Lumi makes a brave snow pounce and collects ${scoreGained} crystals.`;
    case 'howl':
      return 'Lumi sings a tiny moon howl and gathers soft moonlight.';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
