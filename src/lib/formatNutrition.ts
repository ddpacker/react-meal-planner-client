/** Format a nutrition macro for display. Null → em dash per CONV-UNITS. */
export function formatMacro(value: number | null, unit = ''): string {
  if (value == null) {
    return '—';
  }
  const rounded = Math.round(value * 10) / 10;
  const display = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return unit ? `${display}${unit}` : display;
}
