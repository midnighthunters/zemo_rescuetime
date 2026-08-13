import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import type { UiSpriteKey } from "../data/ui.generated";
import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { MotionView, PulseView } from "./Motion";
import { UiSprite } from "./UiSprite";

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  spriteKey?: UiSpriteKey | null;
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({
  action,
  compact = false,
  icon = "paw-outline",
  spriteKey = "emptyAnimalWave",
  title,
  message
}: EmptyStateProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  return (
    <MotionView direction="fade" style={[styles.root, compact && styles.compact]}>
      {spriteKey ? (
        <PulseView floatDistance={4} pulseScale={1.03}>
          <UiSprite
            accessibilityIgnore
            spriteKey={spriteKey}
            size={compact ? 64 : 84}
          />
        </PulseView>
      ) : (
        <View style={styles.iconWrap}>
          <Ionicons color={theme.colors.brandGreenText} name={icon} size={24} />
        </View>
      )}
      <AppText align="center" role="cardTitle">
        {title}
      </AppText>
      <AppText align="center" role="supportive" tone="secondary">
        {message}
      </AppText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </MotionView>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    action: {
      paddingTop: spacing.s8,
      width: "100%"
    },
    compact: {
      padding: spacing.s16
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: colors.brandGreenTint,
      borderRadius: radius.round,
      height: 48,
      justifyContent: "center",
      width: 48
    },
    root: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.separator,
      borderCurve: "continuous",
      borderRadius: radius.card,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      gap: spacing.s8,
      padding: spacing.s24
    }
  });
}
