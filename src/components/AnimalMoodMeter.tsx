import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { getMoodMeta } from "../data/milestones";
import type { AnimalMood } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslateFn } from "../i18n/translations";
import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AppText } from "./AppText";
import { ProgressBar } from "./ProgressBar";

type AnimalMoodMeterProps = {
  mood: AnimalMood;
  progress: number;
  proLocked?: boolean;
};

function getMoodText(mood: AnimalMood, t: TranslateFn) {
  switch (mood) {
    case "very_sad":
      return { helper: t("mood.verySad.helper"), label: t("mood.verySad.label") };
    case "sad":
      return { helper: t("mood.sad.helper"), label: t("mood.sad.label") };
    case "hopeful":
      return { helper: t("mood.hopeful.helper"), label: t("mood.hopeful.label") };
    case "happy":
      return { helper: t("mood.happy.helper"), label: t("mood.happy.label") };
    case "rescued":
      return { helper: t("mood.rescued.helper"), label: t("mood.rescued.label") };
  }
}

function getMoodTone(mood: AnimalMood, colors: AppColors) {
  switch (mood) {
    case "very_sad":
    case "sad":
      return { content: colors.stepBlueText, tint: colors.stepBlueTint };
    case "hopeful":
      return { content: colors.brandGreenText, tint: colors.brandGreenTint };
    case "happy":
      return { content: colors.activeCoralText, tint: colors.activeCoralTint };
    case "rescued":
      return { content: colors.brandGreenText, tint: colors.brandGreenTint };
  }
}

/** Compact mood readout: icon badge, label, helper line, and one care bar. */
export function AnimalMoodMeter({
  mood,
  progress,
  proLocked
}: AnimalMoodMeterProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const { locale, t } = useLanguage();
  const meta = getMoodMeta(mood);
  const moodText = getMoodText(mood, t);
  const clamped = Math.max(0, Math.min(1, progress));

  if (proLocked) {
    return (
      <View style={styles.root}>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: theme.colors.rewardAmberTint }]}>
            <Ionicons
              color={theme.colors.rewardAmberText}
              name="lock-closed"
              size={18}
            />
          </View>
          <View style={styles.copy}>
            <AppText role="cardTitle">{t("mood.locked.title")}</AppText>
            <AppText role="caption" tone="secondary">
              {t("mood.locked.helper")}
            </AppText>
          </View>
        </View>
        <ProgressBar
          accessibilityLabel={t("mood.locked.title")}
          progress={0.18}
          variant="pro"
        />
      </View>
    );
  }

  const tone = getMoodTone(mood, theme.colors);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: tone.tint }]}>
          <Ionicons
            color={tone.content}
            name={meta.icon as keyof typeof Ionicons.glyphMap}
            size={18}
          />
        </View>
        <View style={styles.copy}>
          <AppText role="cardTitle">
            {t("mood.prefix", { mood: moodText.label })}
          </AppText>
          <AppText role="caption" tone="secondary">
            {moodText.helper}
          </AppText>
        </View>
        <AppText role="supportiveMedium" style={styles.percent} tone="secondary">
          {formatPercent(clamped, locale)}
        </AppText>
      </View>
      <ProgressBar
        accessibilityLabel={t("mood.prefix", { mood: moodText.label })}
        progress={clamped}
        variant="care"
      />
    </View>
  );
}

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    badge: {
      alignItems: "center",
      borderRadius: radius.chip,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    copy: {
      flex: 1,
      gap: 1,
      minWidth: 0
    },
    percent: {
      fontVariant: ["tabular-nums"]
    },
    root: {
      gap: spacing.s8
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    }
  });
}
