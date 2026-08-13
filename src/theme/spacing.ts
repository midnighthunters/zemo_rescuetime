/**
 * Four-point spacing scale. `xs…xxl` names are kept for existing call sites and
 * map onto the same numeric ramp used by the new layout tokens.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /* Explicit scale — prefer these in new code. */
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s40: 40
} as const;

/**
 * Deliberate corner-radius hierarchy. Nothing should reach for a bare `8`.
 */
export const radius = {
  chip: 10,
  control: 12,
  button: 14,
  segment: 16,
  card: 20,
  hero: 26,
  sheet: 28,
  round: 999
} as const;

/** Minimum accessible hit target on both platforms. */
export const HIT_SLOP_SIZE = 44;

export const hitSlop = { bottom: 8, left: 8, right: 8, top: 8 } as const;
