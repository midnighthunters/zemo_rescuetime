import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { HIT_SLOP_SIZE, radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type SettingRowProps = {
  title: string;
  subtitle?: string;
  icon?: IoniconName;
  iconTone?: "green" | "blue" | "amber" | "coral" | "danger" | "neutral";
  /** Right-aligned read-only value. */
  value?: string;
  /** Right-aligned control such as a Switch or segmented control. */
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  selected?: boolean;
  /** Hides the hairline separator on the last row of a group. */
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Grouped iOS settings row. Groups draw one card; rows inside are separated by
 * hairlines instead of each row becoming its own card.
 */
export function SettingRow({
  destructive = false,
  icon,
  iconTone = "neutral",
  isLast = false,
  onPress,
  selected,
  style,
  subtitle,
  title,
  trailing,
  value
}: SettingRowProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  const iconColor = destructive
    ? theme.colors.dangerText
    : iconTone === "green"
      ? theme.colors.brandGreenText
      : iconTone === "blue"
        ? theme.colors.stepBlueText
        : iconTone === "amber"
          ? theme.colors.rewardAmberText
          : iconTone === "coral"
            ? theme.colors.activeCoralText
            : iconTone === "danger"
              ? theme.colors.dangerText
              : theme.colors.textSecondary;

  const content = (
    <View style={[styles.row, isLast && styles.rowLast, style]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons color={iconColor} name={icon} size={20} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText role="bodyMedium" tone={destructive ? "danger" : "primary"}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText role="caption" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText numberOfLines={1} role="supportive" tone="secondary" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {onPress && !trailing ? (
        <Ionicons
          color={theme.colors.textTertiary}
          name="chevron-forward"
          size={18}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** Wraps a set of `SettingRow`s in one grouped card. */
export function SettingGroup({
  children,
  style
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  return <View style={[styles.group, style]}>{children}</View>;
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    group: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderCurve: "continuous",
      borderRadius: radius.card,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      overflow: "hidden"
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
      width: 24
    },
    pressed: {
      backgroundColor: isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(23,33,30,0.04)"
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.separator,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.s12,
      minHeight: HIT_SLOP_SIZE + 6,
      paddingHorizontal: spacing.s16,
      paddingVertical: spacing.s12
    },
    rowLast: {
      borderBottomWidth: 0
    },
    value: {
      flexShrink: 1,
      maxWidth: "45%",
      textAlign: "right"
    }
  });
}
