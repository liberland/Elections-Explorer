// Score and Stake scaling
const SCORE_SCALING_FACTOR = 1e16;
const STAKE_DIVISOR = 1e12;

export function scaleScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return 1 / (value * SCORE_SCALING_FACTOR);
}

export function scaleStake(value: number) {
  return value / STAKE_DIVISOR;
}

