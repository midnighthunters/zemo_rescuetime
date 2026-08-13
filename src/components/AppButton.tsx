import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { pressScale } from "../theme/motion";
import { elevation } from "../theme/shadows";
import { HIT_SLOP_SIZE, radius, spacing } from "../theme/spacing";
import { type as typeRoles } from "../theme/typography";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "pro"
  | "ghost"
  | "destructive";

export type AppButtonSize = "regular" | "compact";

type AppButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  icon?: IoniconName;
  iconPosition?: "leading" | "trailing";
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  /** Light impact by default; set false for repeated/no-op presses. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

type VariantTokens = {
  readonly background: string;
  readonly backgroundPressed: string;
  readonly border: string;
  readonly content: string;
  readonly raised: boolean;
};

export function AppButton({
  accessibilityLabel,
  disabled,
  haptic = true,
  icon,
  iconPosition = "leading",
  loading,
  onPress,
  size = "regular",
  style,
  title,
  variant = "primary",
  ...props
}: AppButtonProps) {
  const theme = useAppTheme();
  const tokens = useMemo(
    () => getVariantTokens(variant, theme.colors, theme.isDark),
    [theme.colors, theme.isDark, variant]
  );
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const isDisabled = Boolean(disabled) || Boolean(loading);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (haptic && Platform.OS !== "web") {
        const feedback =
          variant === "destructive"
            ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        void feedback.catch(() => {
          // Haptics are decorative and must never block the action.
        });
      }

      onPress?.(event);
    },
    [haptic, onPress, variant]
  );

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    size === "compact" && styles.labelCompact,
    { color: tokens.content }
  ];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        size === "compact" && styles.baseCompact,
        {
          backgroundColor: pressed && !isDisabled
            ? tokens.backgroundPressed
            : tokens.background,
          borderColor: tokens.border
        },
        tokens.raised && elevation("soft", theme.isDark, theme.colors.shadowColor),
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={tokens.content} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "leading" ? (
            <Ionicons color={tokens.content} name={icon} size={size === "compact" ? 16 : 18} />
          ) : null}
          <Text numberOfLines={1} style={labelStyle}>
            {title}
          </Text>
          {icon && iconPosition === "trailing" ? (
            <Ionicons color={tokens.content} name={icon} size={size === "compact" ? 16 : 18} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

function getVariantTokens(
  variant: AppButtonVariant,
  colors: AppColors,
  isDark: boolean
): VariantTokens {
  switch (variant) {
    case "primary":
      return {
        background: colors.brandGreenFill,
        backgroundPressed: colors.brandGreenPressed,
        border: "transparent",
        content: colors.brandGreenInk,
        raised: true
      };
    case "secondary":
      return {
        background: colors.surfacePrimary,
        backgroundPressed: colors.surfaceSecondary,
        border: colors.separatorStrong,
        content: colors.textPrimary,
        raised: !isDark
      };
    case "tonal":
      return {
        background: colors.brandGreenTint,
        backgroundPressed: isDark
          ? "rgba(69,209,143,0.26)"
          : "rgba(23,128,76,0.14)",
        border: "transparent",
        content: colors.brandGreenText,
        raised: false
      };
    case "pro":
      return {
        background: colors.rewardAmberFill,
        backgroundPressed: isDark ? "#DDAE4C" : "#E0A526",
        border: "transparent",
        content: colors.rewardAmberInk,
        raised: true
      };
    case "ghost":
      return {
        background: "transparent",
        backgroundPressed: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(23,33,30,0.05)",
        border: "transparent",
        content: colors.textSecondary,
        raised: false
      };
    case "destructive":
      return {
        background: colors.dangerFill,
        backgroundPressed: isDark ? "#B93832" : "#A72F29",
        border: "transparent",
        content: colors.dangerInk,
        raised: false
      };
  }
}

function createStyles(colors: AppColors, _isDark: boolean) {
  return StyleSheet.create({
    base: {
      alignItems: "center",
      borderCurve: "continuous",
      borderRadius: radius.button,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: HIT_SLOP_SIZE + 4,
      paddingHorizontal: spacing.s20,
      paddingVertical: spacing.s12
    },
    baseCompact: {
      minHeight: HIT_SLOP_SIZE,
      paddingHorizontal: spacing.s16,
      paddingVertical: spacing.s8
    },
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s8,
      justifyContent: "center"
    },
    disabled: {
      opacity: 0.45
    },
    label: {
      ...typeRoles.buttonLabel,
      color: colors.textPrimary,
      flexShrink: 1
    },
    labelCompact: {
      fontSize: 14,
      lineHeight: 19
    },
    pressed: {
      transform: [{ scale: pressScale }]
    }
  });
}
