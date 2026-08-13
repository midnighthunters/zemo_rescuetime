import { useMemo, type PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { elevation, type ElevationLevel } from "../theme/shadows";
import { radius, spacing } from "../theme/spacing";

export type PremiumCardVariant =
  | "hero"
  | "standard"
  | "inset"
  | "reward"
  | "warning"
  | "sanctuary"
  | "steps";

type PremiumCardProps = PropsWithChildren<{
  variant?: PremiumCardVariant;
  padded?: boolean;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Card depth expresses hierarchy: `hero` is the single focal surface per screen,
 * `standard` groups related content, and `inset` is a quiet sub-surface that
 * never competes with its parent.
 */
export function PremiumCard({
  children,
  gap,
  padded = true,
  style,
  variant = "standard"
}: PremiumCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        padded && styles[`${variant}Padding` as const],
        gap !== undefined && { gap },
        style
      ]}
    >
      {children}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  const shadowColor = colors.shadowColor;

  return StyleSheet.create({
    base: {
      borderCurve: "continuous",
      overflow: "hidden"
    },
    hero: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderRadius: radius.hero,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      ...elevation("hero", isDark, shadowColor)
    },
    heroPadding: {
      padding: spacing.s20
    },
    standard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderRadius: radius.card,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      ...elevation("card", isDark, shadowColor)
    },
    standardPadding: {
      padding: spacing.s16
    },
    inset: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.separator,
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth
    },
    insetPadding: {
      padding: spacing.s12
    },
    reward: {
      backgroundColor: colors.surfaceAmber,
      borderColor: isDark ? colors.separatorStrong : "rgba(138,94,6,0.18)",
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth
    },
    rewardPadding: {
      padding: spacing.s12
    },
    warning: {
      backgroundColor: colors.surfaceDanger,
      borderColor: isDark ? colors.separatorStrong : "rgba(190,59,50,0.24)",
      borderRadius: radius.card,
      borderWidth: 1
    },
    warningPadding: {
      padding: spacing.s16
    },
    sanctuary: {
      backgroundColor: colors.sanctuaryStage,
      borderColor: isDark ? colors.separatorStrong : "rgba(23,128,76,0.16)",
      borderRadius: radius.hero,
      borderWidth: StyleSheet.hairlineWidth,
      ...elevation("card", isDark, shadowColor)
    },
    sanctuaryPadding: {
      padding: spacing.s20
    },
    steps: {
      backgroundColor: colors.surfaceBlue,
      borderColor: isDark ? colors.separatorStrong : "rgba(16,105,204,0.14)",
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth
    },
    stepsPadding: {
      padding: spacing.s16
    }
  });
}
