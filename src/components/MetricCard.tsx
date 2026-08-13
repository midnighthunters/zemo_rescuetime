import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { PremiumCard } from "./PremiumCard";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type MetricCardTone = "steps" | "rescued" | "weekly" | "remaining" | "reward";

type MetricCardProps = {
  label: string;
  value: string;
  tone?: MetricCardTone;
  icon?: IoniconName;
  caption?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_ICONS: Record<MetricCardTone, IoniconName> = {
  remaining: "timer-outline",
  rescued: "shield-checkmark",
  reward: "gift",
  steps: "footsteps",
  weekly: "calendar"
};

/** Compact statistic tile. Values use tabular numerals so columns stay aligned. */
export function MetricCard({
  caption,
  icon,
  label,
  style,
  tone = "steps",
  value
}: MetricCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const palette = useMemo(() => getTonePalette(tone, theme.colors), [theme.colors, tone]);

  return (
    <PremiumCard gap={spacing.s8} style={style} variant="standard">
      <View style={[styles.iconWrap, { backgroundColor: palette.tint }]}>
        <Ionicons color={palette.content} name={icon ?? DEFAULT_ICONS[tone]} size={18} />
      </View>
      <AppText role="metric">{value}</AppText>
      <AppText role="caption" tone="secondary">
        {label}
      </AppText>
      {caption ? (
        <AppText role="caption" tone="tertiary">
          {caption}
        </AppText>
      ) : null}
    </PremiumCard>
  );
}

function getTonePalette(tone: MetricCardTone, colors: AppColors) {
  switch (tone) {
    case "steps":
      return { content: colors.stepBlueText, tint: colors.stepBlueTint };
    case "rescued":
      return { content: colors.brandGreenText, tint: colors.brandGreenTint };
    case "weekly":
      return { content: colors.brandGreenText, tint: colors.brandGreenTint };
    case "remaining":
      return { content: colors.activeCoralText, tint: colors.activeCoralTint };
    case "reward":
      return { content: colors.rewardAmberText, tint: colors.rewardAmberTint };
  }
}

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    iconWrap: {
      alignItems: "center",
      borderRadius: radius.chip,
      height: 32,
      justifyContent: "center",
      width: 32
    }
  });
}
