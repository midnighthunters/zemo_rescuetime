import { useMemo } from "react";
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { useAppTheme } from "../theme/colors";
import { type TypeRole, type as typeRoles } from "../theme/typography";

export type AppTextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "green"
  | "blue"
  | "amber"
  | "coral"
  | "danger"
  | "locked";

type AppTextProps = TextProps & {
  role?: TypeRole;
  tone?: AppTextTone;
  align?: TextStyle["textAlign"];
};

/**
 * Single entry point for text so every screen inherits the semantic type ramp
 * and contrast-checked tones instead of re-declaring font sizes and weights.
 */
export function AppText({
  align,
  role = "body",
  style,
  tone = "primary",
  ...props
}: AppTextProps) {
  const theme = useAppTheme();

  const resolved = useMemo<TextStyle>(() => {
    const { colors } = theme;
    const toneColor: Record<AppTextTone, string> = {
      amber: colors.rewardAmberText,
      blue: colors.stepBlueText,
      coral: colors.activeCoralText,
      danger: colors.dangerText,
      green: colors.brandGreenText,
      inverse: colors.textInverse,
      locked: colors.lockedText,
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      tertiary: colors.textTertiary
    };

    return { color: toneColor[tone], textAlign: align };
  }, [align, theme, tone]);

  return (
    <Text
      {...props}
      style={StyleSheet.flatten([typeRoles[role] as TextStyle, resolved, style])}
    />
  );
}
