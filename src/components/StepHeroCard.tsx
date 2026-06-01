import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { cageImage } from "../data/assets";
import type { AnimalMetrics } from "../state/RescueProvider";
import { colors } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { formatNumber } from "../utils/format";
import { AnimalCage } from "./AnimalCage";
import { AnimalMoodMeter } from "./AnimalMoodMeter";
import { AppButton } from "./AppButton";
import { CareMilestoneRow } from "./CareMilestoneRow";
import { CircularStepProgress } from "./CircularStepProgress";
import { ProBadge } from "./ProBadge";

type StepHeroCardProps = {
  metrics?: AnimalMetrics;
  stepsToday: number;
  onOpenPaywall: () => void;
};

function getProgressCopy(metrics: AnimalMetrics) {
  if (metrics.status === "pro_locked") {
    return "Unlock Pro to keep the rescue path going.";
  }

  if (metrics.progress <= 0.25) {
    return `${metrics.animal.name} is scared, but your steps are bringing hope.`;
  }

  if (metrics.progress <= 0.5) {
    return `You gave ${metrics.animal.name} water. Keep walking.`;
  }

  if (metrics.progress <= 0.75) {
    return `${metrics.animal.name} is getting stronger because of you.`;
  }

  if (metrics.progress < 1) {
    return `Almost there. ${metrics.animal.name} can feel freedom.`;
  }

  return `You did it. ${metrics.animal.name} is free.`;
}

export function StepHeroCard({
  metrics,
  stepsToday,
  onOpenPaywall
}: StepHeroCardProps) {
  if (!metrics) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Everyone is safe</Text>
        <Text style={styles.copy}>
          You rescued every animal in this world. Keep walking to stay ready for
          the next one.
        </Text>
      </View>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = metrics.isRescued ? metrics.animal.happyImage : metrics.animal.sadImage;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>Today's Steps</Text>
          <Text style={styles.steps}>{formatNumber(stepsToday)}</Text>
        </View>
        <CircularStepProgress progress={metrics.progress} />
      </View>

      <View style={styles.rescueHeader}>
        <View>
          <Text style={styles.eyebrow}>Next Rescue</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {metrics.animal.name} needs you
          </Text>
        </View>
        {proLocked ? <ProBadge /> : null}
      </View>

      <AnimalCage
        animalImage={image}
        cageImage={cageImage}
        careState={metrics.careState}
        isRescued={metrics.isRescued}
        progress={metrics.progress}
      />

      <View style={styles.stepsLine}>
        <Ionicons color={colors.primary} name="footsteps" size={18} />
        <Text style={styles.stepsLineText}>
          {formatNumber(stepsToday)} / {formatNumber(metrics.milestone.unlockSteps)} steps
        </Text>
      </View>

      <Text style={styles.copy}>{getProgressCopy(metrics)}</Text>

      <AnimalMoodMeter
        mood={metrics.mood}
        progress={metrics.progress}
        proLocked={proLocked}
      />

      <CareMilestoneRow
        claimedMiniMilestones={metrics.claimedMiniMilestones}
        milestone={metrics.milestone}
        proLocked={proLocked}
        stepsToday={stepsToday}
      />

      <View style={styles.nextCare}>
        <Text style={styles.nextCareLabel}>Next care milestone</Text>
        <Text style={styles.nextCareValue}>
          {proLocked
            ? "Upgrade to care for this animal"
            : metrics.nextMiniMilestone
              ? `Feed ${metrics.animal.name} at ${formatNumber(metrics.nextMiniMilestone)} steps`
              : `${formatNumber(metrics.remainingSteps)} steps left to rescue`}
        </Text>
      </View>

      {proLocked ? (
        <AppButton
          icon="sparkles"
          onPress={onOpenPaywall}
          title="Unlock All Rescues"
          variant="pro"
        />
      ) : (
        <AppButton
          icon="walk"
          title={`Keep Walking To Save ${metrics.animal.name}`}
          variant="primary"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    ...shadows.card
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  nextCare: {
    backgroundColor: colors.surfaceWarm,
    borderColor: "#FFE0A8",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  nextCareLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  nextCareValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  rescueHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  steps: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  stepsLine: {
    alignItems: "center",
    backgroundColor: "#EFFAF4",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  stepsLineText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    maxWidth: 240
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
