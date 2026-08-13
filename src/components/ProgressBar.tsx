import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { radius } from "../theme/spacing";
import { AnimatedProgressFill } from "./Motion";

export type ProgressBarVariant = "standard" | "care" | "rescue" | "pro";

type ProgressBarProps = {
  progress: number;
  variant?: ProgressBarVariant;
  /** Track height; defaults to a comfortable 10pt. */
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The single progress primitive. One bar per context — screens never stack
 * competing indicators for the same value.
 */
export function ProgressBar({
  accessibilityLabel,
  height = 10,
  progress,
  style,
  variant = "standard"
}: ProgressBarProps) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const fillColor = useMemo(
    () => getFillColor(variant, theme.colors),
    [theme.colors, variant]
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.trackNeutral,
          borderRadius: height / 2,
          height
        },
        style
      ]}
    >
      <AnimatedProgressFill
        progress={clamped}
        style={[
          styles.fill,
          { backgroundColor: fillColor, borderRadius: height / 2 }
        ]}
      />
    </View>
  );
}

function getFillColor(variant: ProgressBarVariant, colors: AppColors) {
  switch (variant) {
    case "care":
      return colors.activeCoral;
    case "rescue":
      return colors.brandGreen;
    case "pro":
      return colors.rewardAmber;
    case "standard":
      return colors.stepBlue;
  }
}

const styles = StyleSheet.create({
  fill: {
    height: "100%"
  },
  track: {
    borderCurve: "continuous",
    maxWidth: "100%",
    overflow: "hidden",
    width: "100%",
    minWidth: 0,
    borderRadius: radius.round
  }
});
