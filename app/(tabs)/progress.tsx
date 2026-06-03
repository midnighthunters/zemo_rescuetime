import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import { feedingMilestoneLabels } from "../../src/data/milestones";
import type { UiSpriteKey } from "../../src/data/ui.generated";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { formatNumber } from "../../src/utils/format";

function StatCard({
  label,
  value,
  icon,
  spriteKey
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  spriteKey: UiSpriteKey;
}) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);

  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Ionicons color={theme.colors.primary} name={icon} size={22} />
        <UiSprite spriteKey={spriteKey} size={42} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const {
    currentAnimal,
    getAnimalMetrics,
    rescueProgress,
    stepsToday,
    weeklySteps,
    unlockedAnimals
  } = useRescue();
  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const careMilestonesCompleted = Object.values(
    rescueProgress.claimedMiniMilestones
  ).reduce((total, steps) => total + steps.length, 0);

  const timeline = metrics
    ? [
        ...metrics.milestone.miniMilestones.map((stepTarget, index) => ({
          key: `${stepTarget}`,
          complete: metrics.claimedMiniMilestones.includes(stepTarget),
          title: `${formatNumber(stepTarget)} steps - ${feedingMilestoneLabels[index] ?? "Care"}`,
          copy:
            index === 0
              ? `Gave ${metrics.animal.name} water`
              : index === 1
                ? `Fed ${metrics.animal.name}`
                : `${metrics.animal.name} started smiling`
        })),
        {
          key: "rescue",
          complete: metrics.isRescued,
          title: `${formatNumber(metrics.milestone.unlockSteps)} steps - Rescue`,
          copy: `Rescue ${metrics.animal.name}`
        }
      ]
    : [];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Rescue Progress</Text>
        <Text style={styles.subtitle}>
          Your care milestones show how every walk changes the story.
        </Text>
      </View>

      <View style={styles.statGrid}>
        <StatCard
          icon="paw"
          label="Animals rescued"
          spriteKey="progressPawTrophy"
          value={formatNumber(unlockedAnimals.length)}
        />
        <StatCard
          icon="footsteps"
          label="Steps today"
          spriteKey="microWalkingShoe"
          value={formatNumber(stepsToday)}
        />
        <StatCard
          icon="heart"
          label="Care milestones"
          spriteKey="careRewardChest"
          value={formatNumber(careMilestonesCompleted)}
        />
        <StatCard
          icon="calendar"
          label="Steps this week"
          spriteKey="progressWeeklyCalendar"
          value={formatNumber(weeklySteps)}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Timeline</Text>
          <UiSprite spriteKey="progressTimelineTrail" size={66} />
        </View>
        {timeline.length === 0 ? (
          <EmptyState
            message="You rescued everyone in this world. Future rescue paths can start here."
            title="No active rescue"
          />
        ) : (
          timeline.map((item, index) => (
            <View key={item.key} style={styles.timelineItem}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    item.complete && styles.timelineDotComplete
                  ]}
                >
                  {item.complete ? (
                    <Ionicons color={theme.colors.white} name="checkmark" size={12} />
                  ) : null}
                </View>
                {index < timeline.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineText}>{item.copy}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  header: {
    gap: spacing.xs
  },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    width: 2
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    ...shadows.card
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 112,
    padding: spacing.md,
    ...shadows.card
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  statTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  timelineCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.lg
  },
  timelineDot: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  timelineDotComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  timelineItem: {
    flexDirection: "row",
    gap: spacing.md
  },
  timelineRail: {
    alignItems: "center"
  },
  timelineText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  }
  });
}
