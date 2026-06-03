import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { AnimalMetrics } from "../state/RescueProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { formatNumber } from "../utils/format";
import { AnimalCage } from "./AnimalCage";
import { AnimalMoodMeter } from "./AnimalMoodMeter";
import { AppButton } from "./AppButton";
import { CircularStepProgress } from "./CircularStepProgress";
import { ProBadge } from "./ProBadge";
import { UiSprite } from "./UiSprite";

type StepHeroCardProps = {
  metrics?: AnimalMetrics;
  stepsToday: number;
  sourceLabel: string;
  isRefreshing: boolean;
  onOpenPaywall: () => void;
  onRefreshSteps: () => void;
  onViewAnimal: () => void;
};

function getProgressCopy(metrics: AnimalMetrics) {
  if (metrics.status === "pro_locked") {
    return "Unlock Pro to continue this rescue path.";
  }

  if (metrics.progress <= 0.25) {
    return `${metrics.animal.name} is waiting`;
  }

  if (metrics.progress <= 0.5) {
    return `${metrics.animal.name} needs care`;
  }

  if (metrics.progress <= 0.75) {
    return `${metrics.animal.name} is almost safe`;
  }

  if (metrics.progress < 1) {
    return "Gate is nearly open";
  }

  return `${metrics.animal.name} is safe`;
}

export function StepHeroCard({
  metrics,
  stepsToday,
  sourceLabel,
  isRefreshing,
  onOpenPaywall,
  onRefreshSteps,
  onViewAnimal
}: StepHeroCardProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);

  if (!metrics) {
    return (
      <View style={styles.emptyCard}>
        <UiSprite spriteKey="emptySanctuaryNest" size={128} />
        <Text style={styles.emptyTitle}>All friends are safe</Text>
        <Text selectable style={styles.emptySteps}>
          {formatNumber(stepsToday)}
        </Text>
        <Text style={styles.copy}>
          Your pedometer is still counting today&apos;s real device steps.
        </Text>
        <AppButton
          icon="refresh"
          loading={isRefreshing}
          onPress={onRefreshSteps}
          title="Refresh Steps"
          variant="secondary"
        />
      </View>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = metrics.isRescued ? metrics.animal.happyImage : metrics.animal.sadImage;
  const progressPercent = `${Math.round(metrics.progress * 100)}%` as `${number}%`;
  const nextTarget = metrics.nextMiniMilestone ?? metrics.milestone.unlockSteps;
  const targetLabel =
    metrics.nextMiniMilestone && !proLocked ? "Next Care" : "Target";
  const remainingLabel = proLocked
    ? "Pro"
    : metrics.remainingSteps > 0
      ? `${formatNumber(metrics.remainingSteps)} left`
      : "Ready";

  return (
    <View style={styles.root}>
      <View style={styles.summaryCard}>
        <View style={styles.todayColumn}>
          <View style={styles.sourceChip}>
            <Ionicons color={theme.colors.primaryDark} name="footsteps" size={16} />
            <Text numberOfLines={1} style={styles.sourceText}>
              {sourceLabel}
            </Text>
          </View>
          <Text style={styles.label}>Today</Text>
          <View style={styles.stepsRow}>
            <Text selectable style={styles.steps}>
              {formatNumber(stepsToday)}
            </Text>
            <Text style={styles.stepsUnit}>Steps</Text>
          </View>
          <Text style={styles.stepsCaption}>Pedometer steps only</Text>
        </View>

        <View style={styles.activeColumn}>
          <Text style={styles.label}>Active Rescue</Text>
          <View style={styles.activeAnimal}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.activeName}>
              {metrics.animal.name}
            </Text>
            <AppButton
              icon="paw"
              onPress={onViewAnimal}
              title="View Animal"
              variant="ghost"
            />
          </View>
        </View>

        <View style={styles.progressColumn}>
          <Text style={styles.label}>Progress</Text>
          <CircularStepProgress progress={metrics.progress} />
        </View>
      </View>

      <View style={styles.rescueStage}>
        <View style={styles.cageColumn}>
          <AnimalCage
            animalImage={image}
            careState={metrics.careState}
            isRescued={metrics.isRescued}
            progress={metrics.progress}
          />
        </View>

        <View style={styles.rescueCopyColumn}>
          <View style={styles.rescueHeader}>
            <View style={styles.rescueTitleWrap}>
              <Text style={styles.rescueTitle}>{getProgressCopy(metrics)}</Text>
              <Text style={styles.rescueSubtitle}>Every step moves the gate.</Text>
            </View>
            {proLocked ? <ProBadge /> : <UiSprite spriteKey="microPawConfetti" size={38} />}
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricPill}>
              <Ionicons color={theme.colors.primary} name="flag" size={26} />
              <View style={styles.metricCopy}>
                <Text style={styles.metricLabel}>{targetLabel}</Text>
                <Text style={styles.metricValue}>{formatNumber(nextTarget)}</Text>
              </View>
            </View>
            <View style={styles.metricPill}>
              <Ionicons color={theme.colors.coral} name="timer" size={26} />
              <View style={styles.metricCopy}>
                <Text style={styles.metricLabel}>Remaining</Text>
                <Text style={styles.metricValue}>{remainingLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressPercent }]} />
          </View>

          <AnimalMoodMeter
            mood={metrics.mood}
            progress={metrics.progress}
            proLocked={proLocked}
          />

          <View style={styles.actionRow}>
            <AppButton
              icon="refresh"
              loading={isRefreshing}
              onPress={onRefreshSteps}
              style={styles.actionButton}
              title="Retry"
              variant="secondary"
            />
            {proLocked ? (
              <AppButton
                icon="sparkles"
                onPress={onOpenPaywall}
                style={styles.actionButton}
                title="Unlock"
                variant="pro"
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    actionButton: {
      flex: 1
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    activeAnimal: {
      gap: spacing.sm
    },
    activeColumn: {
      flex: 1.1,
      gap: spacing.sm,
      minWidth: 116
    },
    activeName: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "900"
    },
    cageColumn: {
      flex: 1,
      minWidth: 190
    },
    copy: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 21,
      textAlign: "center"
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.xl,
      ...shadows.card
    },
    emptySteps: {
      color: colors.text,
      fontSize: 44,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center"
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    metricCopy: {
      flex: 1,
      gap: 2
    },
    metricGrid: {
      flexDirection: "row",
      gap: spacing.sm
    },
    metricLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    metricPill: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "rgba(255,255,255,0.86)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 66,
      padding: spacing.md
    },
    metricValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900"
    },
    progressColumn: {
      alignItems: "center",
      gap: spacing.sm,
      minWidth: 112
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: "100%"
    },
    progressTrack: {
      backgroundColor: colors.border,
      borderRadius: 8,
      height: 12,
      overflow: "hidden"
    },
    rescueCopyColumn: {
      flex: 1.08,
      gap: spacing.md,
      minWidth: 210
    },
    rescueHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
    },
    rescueStage: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceSoft : "#EAF8DD",
      borderColor: isDark ? colors.border : "#C9E8C2",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
      overflow: "hidden",
      padding: spacing.lg,
      ...shadows.soft
    },
    rescueSubtitle: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    rescueTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900"
    },
    rescueTitleWrap: {
      flex: 1,
      gap: spacing.xs
    },
    root: {
      gap: spacing.lg
    },
    sourceChip: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      maxWidth: "100%",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    sourceText: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900"
    },
    steps: {
      color: colors.text,
      fontSize: 52,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    stepsCaption: {
      alignSelf: "flex-start",
      backgroundColor: isDark ? colors.surfaceElevated : "rgba(255,255,255,0.68)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    stepsRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs
    },
    stepsUnit: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "900",
      paddingBottom: 9
    },
    summaryCard: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surface : "#D9F4FF",
      borderColor: isDark ? colors.border : "#A8DFF2",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
      justifyContent: "space-between",
      overflow: "hidden",
      padding: spacing.lg,
      ...shadows.card
    },
    todayColumn: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 130
    }
  });
}
