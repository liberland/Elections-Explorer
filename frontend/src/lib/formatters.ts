const ACCOUNT_LABEL_MAX_CHARS = 32;

export function formatAccountLabel(name: string) {
  if (name.length <= ACCOUNT_LABEL_MAX_CHARS) {
    return name;
  }
  const substr = name.substring(0, ACCOUNT_LABEL_MAX_CHARS - 2);
  return `${substr}..`;
}

export function formatScore(score: number) {
  return `${score.toFixed(3)}`;
}

export function formatStake(stake: number) {
  return `${stake.toFixed(2)}`;
}

