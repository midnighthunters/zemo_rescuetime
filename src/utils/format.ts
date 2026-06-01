export function formatNumber(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString();
}

export function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}
