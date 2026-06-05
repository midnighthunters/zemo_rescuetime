import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { UiSpriteKey } from "../data/ui.generated";
import { MotionView, PulseView } from "./Motion";
import { UiSprite } from "./UiSprite";

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  spriteKey?: UiSpriteKey | null;
  title: string;
  message: string;
};

export function EmptyState({
  icon = "paw-outline",
  spriteKey = "emptyAnimalWave",
  title,
  message
}: EmptyStateProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);

  return (
    <MotionView direction="fade" style={styles.root}>
      {spriteKey ? (
        <PulseView floatDistance={5} pulseScale={1.04}>
          <UiSprite spriteKey={spriteKey} size={86} />
        </PulseView>
      ) : (
        <PulseView pulseScale={1.08}>
          <Ionicons color={theme.colors.primary} name={icon} size={30} />
        </PulseView>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </MotionView>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  root: {
    alignItems: "center",
    backgroundColor: isDark ? "rgba(31,42,39,0.64)" : "rgba(255,255,255,0.64)",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  }
  });
}
