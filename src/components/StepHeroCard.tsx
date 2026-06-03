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
import { CareMilestoneRow } from "./CareMilestoneRow";
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
};

function getProgressCopy(metrics: AnimalMetrics) {
  if (metrics.status === "pro_locked") {
    return "Unlock Pro to continue this rescue path.";
  }

  if (metrics.progress <= 0.25) {
    return `${metrics.animal.name} is waiting. Every counted step moves the gate.`;
  }

  if (metrics.progress <= 0.5) {
    return `${metrics.animal.name} has water. Keep the streak alive.`;
  }

  if (metrics.progress <= 0.75) {
    return `${metrics.animal.name} is stronger and almost ready.`;
  }

  if (metrics.progress < 1) {
    return `Almost there. One more push opens the gate.`;
  }

  return `${metrics.animal.name} is safe.`;
}

export function StepHeroCard({
  metrics,
  stepsToday,
  sourceLabel,
  isRefreshing,
  onOpenPaywall,
  onRefreshSteps
}: StepHeroCardProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);

  if (!metrics) {
    return (
      <View style={styles.card}>
        <View style={styles.counterOnly}>
          <UiSprite spriteKey="emptySanctuaryNest" size={118} />
          <Text style={styles.eyebrow}>Today</Text>
          <Text selectable style={styles.steps}>{formatNumber(stepsToday)}</Text>
          <Text style={styles.copy}>
            Every animal in this world is safe. Your pedometer is still counting.
          </Text>
          <AppButton
            icon="refresh"
            loading={isRefreshing}
            onPress={onRefreshSteps}
            title="Refresh Steps"
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = metrics.isRescued ? metrics.animal.happyImage : metrics.animal.sadImage;
  const progressPercent = `${Math.round(metrics.progress * 100)}%` as `${number}%`;
  const nextTarget = metrics.nextMiniMilestone ?? metrics.milestone.unlockSteps;
  const targetLabel =
    metrics.nextMiniMilestone && !proLocked ? "Next care" : "Rescue target";
  const remainingLabel = proLocked
    ? "Pro locked"
    : metrics.remainingSteps > 0
      ? `${formatNumber(metrics.remainingSteps)} left`
      : "Ready";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.stepsPanel}>
          <View style={styles.sourceChip}>
            <Ionicons color={theme.colors.primaryDark} name="footsteps" size={16} />
            <Text style={styles.sourceText}>{sourceLabel}</Text>
          </View>
          <Text style={styles.eyebrow}>Today</Text>
          <Text selectable style={styles.steps}>{formatNumber(stepsToday)}</Text>
          <Text style={styles.stepsCaption}>Pedometer steps only</Text>
        </View>
        <View style={styles.progressWrap}>
          <CircularStepProgress progress={metrics.progress} />
          <UiSprite
            spriteKey="homeProgressRingMascot"
            size={54}
            style={styles.progressMascot}
          />
        </View>
      </View>

      <View style={styles.rescueHeader}>
        <View>
          <Text style={styles.eyebrow}>
            {metrics.isRescued ? "Safe friend" : "Active rescue"}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {metrics.animal.name}
          </Text>
        </View>
        {proLocked ? <ProBadge /> : null}
      </View>

      <View style={styles.sceneWrap}>
        <AnimalCage
          animalImage={image}
          careState={metrics.careState}
          isRescued={metrics.isRescued}
          progress={metrics.progress}
        />
        <UiSprite
          spriteKey={metrics.progress >= 0.9 ? "homeAnimalSteppingOut" : "homeCageOpening"}
          size={76}
          style={styles.sceneBadge}
        />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressPercent }]} />
      </View>

      <View style={styles.statRow}>
        <View style={styles.statPill}>
          <Ionicons color={theme.colors.primary} name="flag" size={17} />
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>{targetLabel}</Text>
            <Text style={styles.statValue}>{formatNumber(nextTarget)}</Text>
          </View>
        </View>
        <View style={styles.statPill}>
          <Ionicons color={theme.colors.coral} name="timer" size={17} />
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>{remainingLabel}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.copy}>{getProgressCopy(metrics)}</Text>

      <View style={styles.moodWrap}>
        <AnimalMoodMeter
          mood={metrics.mood}
          progress={metrics.progress}
          proLocked={proLocked}
        />
        <UiSprite spriteKey="microMoodTrail" size={46} style={styles.moodSprite} />
      </View>

      <View style={styles.careWrap}>
        <UiSprite spriteKey="homeRescueBackpack" size={56} style={styles.backpackSprite} />
        <CareMilestoneRow
          claimedMiniMilestones={metrics.claimedMiniMilestones}
          milestone={metrics.milestone}
          proLocked={proLocked}
          stepsToday={stepsToday}
        />
      </View>

      <View style={styles.actionRow}>
        <AppButton
          icon="refresh"
          loading={isRefreshing}
          onPress={onRefreshSteps}
          style={styles.actionButton}
          title="Refresh"
          variant="secondary"
        />
        {proLocked ? (
        <AppButton
          icon="sparkles"
          onPress={onOpenPaywall}
          style={styles.actionButton}
          title="Unlock All Rescues"
          variant="pro"
        />
        ) : null}
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.lg,
    ...shadows.card
  },
  backpackSprite: {
    position: "absolute",
    right: -8,
    top: -18,
    zIndex: 2
  },
  careWrap: {
    position: "relative"
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  counterOnly: {
    alignItems: "center",
    gap: spacing.md
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  rescueHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
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
    fontSize: 44,
    fontVariant: ["tabular-nums"],
    fontWeight: "900"
  },
  moodSprite: {
    bottom: -6,
    position: "absolute",
    right: 2
  },
  moodWrap: {
    position: "relative"
  },
  progressMascot: {
    position: "absolute",
    right: -22,
    top: -22,
    zIndex: 2
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
  progressWrap: {
    position: "relative"
  },
  stepsPanel: {
    flex: 1,
    gap: spacing.xs
  },
  stepsCaption: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  statCopy: {
    flex: 1,
    gap: 2
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  statPill: {
    alignItems: "center",
    backgroundColor: isDark ? colors.surfaceElevated : "#FAFCF7",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.md
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  sceneBadge: {
    bottom: 6,
    position: "absolute",
    right: 6,
    zIndex: 10
  },
  sceneWrap: {
    position: "relative"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    maxWidth: 240
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
  });
}
