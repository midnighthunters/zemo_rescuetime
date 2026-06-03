import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type AppButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  icon?: IoniconName;
  variant?: "primary" | "secondary" | "pro" | "ghost" | "danger";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  title,
  icon,
  variant = "primary",
  loading,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const isDisabled = disabled || loading;
  const contentColor =
    variant === "ghost"
      ? theme.colors.primary
      : variant === "secondary" || variant === "pro"
        ? "#172033"
        : theme.colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              color={contentColor}
              name={icon}
              size={18}
            />
          ) : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.label,
              variant === "ghost" && styles.ghostLabel,
              (variant === "secondary" || variant === "pro") &&
                styles.accentLabel
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.52
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1
  },
  ghostLabel: {
    color: colors.primary
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  },
  primary: {
    backgroundColor: colors.primary
  },
  pro: {
    backgroundColor: colors.pro
  },
  secondary: {
    backgroundColor: colors.secondary
  },
  accentLabel: {
    color: "#172033"
  }
  });
}
