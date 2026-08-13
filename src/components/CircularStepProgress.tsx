import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { radius } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AppText } from "./AppText";

type CircularStepProgressProps = {
  progress: number;
  size?: number;
  /** Overrides the default "Rescue" caption. */
  caption?: string;
  tone?: "rescue" | "care";
};

const TICK_COUNT = 32;

/**
 * Rescue dial. Built from evenly rotated tick marks so it renders identically on
 * iOS and Android without pulling in an SVG dependency.
 */
export function CircularStepProgress({
  caption,
  progress,
  size = 104,
  tone = "rescue"
}: CircularStepProgressProps) {
  const theme = useAppTheme();
  const { locale, t } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, size),
    [size, theme.colors]
  );
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const filledTicks = Math.round(clamped * TICK_COUNT);
  const activeColor =
    tone === "care" ? theme.colors.activeCoral : theme.colors.brandGreen;
  const label = caption ?? t("common.rescue");

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, index) => ({
        index,
        rotation: (index / TICK_COUNT) * 360
      })),
    []
  );

  return (
    <View
      accessibilityLabel={`${label} ${formatPercent(clamped, locale)}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(clamped * 100) }}
      style={styles.root}
    >
      {ticks.map(({ index, rotation }) => (
        <View
          key={`tick-${index}`}
          pointerEvents="none"
          style={[
            styles.tickAnchor,
            { transform: [{ rotate: `${rotation}deg` }] }
          ]}
        >
          <View
            style={[
              styles.tick,
              index < filledTicks
                ? { backgroundColor: activeColor }
                : { backgroundColor: theme.colors.trackNeutral }
            ]}
          />
        </View>
      ))}
      <View style={styles.center}>
        <AppText role="cardTitle" style={styles.percent}>
          {formatPercent(clamped, locale)}
        </AppText>
        <AppText numberOfLines={1} role="caption" tone="secondary">
          {label}
        </AppText>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, size: number) {
  const tickLength = Math.round(size * 0.11);
  const tickWidth = Math.max(3, Math.round(size * 0.035));

  return StyleSheet.create({
    center: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderRadius: radius.round,
      height: size - tickLength * 2 - 8,
      justifyContent: "center",
      width: size - tickLength * 2 - 8
    },
    percent: {
      fontVariant: ["tabular-nums"]
    },
    root: {
      alignItems: "center",
      height: size,
      justifyContent: "center",
      width: size
    },
    tick: {
      borderRadius: tickWidth / 2,
      height: tickLength,
      width: tickWidth
    },
    tickAnchor: {
      alignItems: "center",
      height: size,
      justifyContent: "flex-start",
      position: "absolute",
      width: size
    }
  });
}
