export function formatNumber(value: number, locale?: string) {
  return Math.max(0, Math.round(value)).toLocaleString(locale);
}

export function formatPercent(value: number, locale?: string) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return `${percent.toLocaleString(locale)}%`;
}
