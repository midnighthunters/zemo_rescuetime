import { Platform, type ViewStyle } from "react-native";

export type ElevationLevel = "flat" | "soft" | "card" | "hero" | "sheet";

type ElevationSpec = {
  readonly opacity: number;
  readonly radius: number;
  readonly offsetY: number;
  readonly android: number;
};

const SPECS: Record<ElevationLevel, ElevationSpec> = {
  flat: { opacity: 0, radius: 0, offsetY: 0, android: 0 },
  soft: { opacity: 0.06, radius: 10, offsetY: 3, android: 2 },
  card: { opacity: 0.09, radius: 18, offsetY: 6, android: 4 },
  hero: { opacity: 0.12, radius: 26, offsetY: 10, android: 8 },
  sheet: { opacity: 0.24, radius: 34, offsetY: 14, android: 16 }
};

/**
 * Platform-correct elevation. In dark mode shadows read as noise, so surfaces
 * lean on tonal separation and only keep a whisper of depth on Android.
 */
export function elevation(
  level: ElevationLevel,
  isDark = false,
  shadowColor = isDark ? "#000000" : "#132520"
): ViewStyle {
  const spec = SPECS[level];

  if (level === "flat") {
    return {};
  }

  if (Platform.OS === "android") {
    return { elevation: isDark ? Math.round(spec.android / 2) : spec.android, shadowColor };
  }

  return {
    shadowColor,
    shadowOffset: { width: 0, height: spec.offsetY },
    shadowOpacity: isDark ? Math.min(0.5, spec.opacity * 2.4) : spec.opacity,
    shadowRadius: spec.radius
  };
}

/** Legacy spreadable tokens, now using native shadow props instead of CSS. */
export const shadows = {
  card: elevation("card"),
  soft: elevation("soft")
} as const;
