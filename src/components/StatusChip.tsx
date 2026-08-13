import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ComponentProps } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { type as typeRoles } from "../theme/typography";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type StatusChipTone =
  | "active"
  | "waiting"
  | "safe"
  | "locked"
  | "pro"
  | "warning"
  | "steps";

type StatusChipProps = {
  label: string;
  tone?: StatusChipTone;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_ICONS: Record<StatusChipTone, IoniconName> = {
  active: "paw",
  locked: "lock-closed",
  pro: "star",
  safe: "shield-checkmark",
  steps: "footsteps",
  waiting: "time",
  warning: "alert-circle"
};

/**
 * Status is never carried by color alone: every chip pairs a tone with an icon
 * and a localized label.
 */
export function StatusChip({ icon, label, style, tone = "active" }: StatusChipProps) {
  const theme = useAppTheme();
  const palette = useMemo(
    () => getTonePalette(tone, theme.colors),
    [theme.colors, tone]
  );
  const styles = useMemo(() => createStyles(), []);

  return (
    <View
      style={[styles.chip, { backgroundColor: palette.background }, style]}
    >
      <Ionicons color={palette.content} name={icon ?? DEFAULT_ICONS[tone]} size={13} />
      <Text numberOfLines={1} style={[styles.label, { color: palette.content }]}>
        {label}
      </Text>
    </View>
  );
}

function getTonePalette(tone: StatusChipTone, colors: AppColors) {
  switch (tone) {
    case "active":
      return { background: colors.activeCoralTint, content: colors.activeCoralText };
    case "waiting":
      return { background: colors.surfaceNeutral, content: colors.textSecondary };
    case "safe":
      return { background: colors.brandGreenTint, content: colors.brandGreenText };
    case "locked":
      return { background: colors.lockedSurface, content: colors.lockedText };
    case "pro":
      return { background: colors.rewardAmberTint, content: colors.rewardAmberText };
    case "warning":
      return { background: colors.surfaceDanger, content: colors.dangerText };
    case "steps":
      return { background: colors.stepBlueTint, content: colors.stepBlueText };
  }
}

function createStyles() {
  return StyleSheet.create({
    chip: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderCurve: "continuous",
      borderRadius: radius.chip,
      flexDirection: "row",
      gap: spacing.s4,
      maxWidth: "100%",
      paddingHorizontal: spacing.s8,
      paddingVertical: 5
    },
    label: {
      ...typeRoles.label,
      flexShrink: 1
    }
  });
}
