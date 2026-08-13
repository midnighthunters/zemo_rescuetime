import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, type ComponentProps } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { pressScale } from "../theme/motion";
import { elevation } from "../theme/shadows";
import { HIT_SLOP_SIZE, radius } from "../theme/spacing";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type IconButtonVariant = "surface" | "tonal" | "plain" | "danger";

type IconButtonProps = {
  accessibilityLabel: string;
  icon: IoniconName;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 44x44 minimum circular control used for back, close, and inline actions. */
export function IconButton({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
  size = 22,
  style,
  variant = "surface"
}: IconButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  const handlePress = useCallback(
    (_event: GestureResponderEvent) => {
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Optional feedback only.
        });
      }

      onPress();
    },
    [onPress]
  );

  const contentColor =
    variant === "danger"
      ? theme.colors.dangerText
      : variant === "tonal"
        ? theme.colors.brandGreenText
        : theme.colors.textPrimary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variant === "surface" &&
          elevation("soft", theme.isDark, theme.colors.shadowColor),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      <Ionicons color={contentColor} name={icon} size={size} />
    </Pressable>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    base: {
      alignItems: "center",
      borderRadius: radius.round,
      borderWidth: StyleSheet.hairlineWidth,
      height: HIT_SLOP_SIZE,
      justifyContent: "center",
      width: HIT_SLOP_SIZE
    },
    danger: {
      backgroundColor: colors.surfaceDanger,
      borderColor: "transparent"
    },
    disabled: {
      opacity: 0.45
    },
    plain: {
      backgroundColor: "transparent",
      borderColor: "transparent"
    },
    pressed: {
      opacity: isDark ? 0.82 : 0.9,
      transform: [{ scale: pressScale }]
    },
    surface: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator
    },
    tonal: {
      backgroundColor: colors.brandGreenTint,
      borderColor: "transparent"
    }
  });
}
