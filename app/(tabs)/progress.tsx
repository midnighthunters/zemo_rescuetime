import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../src/components/AppText";
import { CareMilestoneRow } from "../../src/components/CareMilestoneRow";
import { EmptyState } from "../../src/components/EmptyState";
import { MetricCard } from "../../src/components/MetricCard";
import { MotionView } from "../../src/components/Motion";
import { PremiumCard } from "../../src/components/PremiumCard";
import { ProgressBar } from "../../src/components/ProgressBar";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { SectionHeader } from "../../src/components/SectionHeader";
import { StatusChip } from "../../src/components/StatusChip";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { useResponsiveLayout } from "../../src/theme/layout";
import { radius, spacing } from "../../src/theme/spacing";
import { getCurrentWeekDateKeys, getLocalDateKey } from "../../src/utils/date";

const CHART_HEIGHT = 120;

export default function ProgressScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { formatNumber: formatLocalizedNumber, locale, t } = useLanguage();
  const {
    activeStepsToday,
    currentAnimal,
    getAnimalMetrics,
    rescueProgress,
    stepsToday,
    unlockedAnimals,
    weeklySteps
  } = useRescue();

  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const weekKeys = getCurrentWeekDateKeys();
  const todayKey = getLocalDateKey();
  const weekValues = weekKeys.map(
    (key) => rescueProgress.dailyStepHistory[key] ?? 0
  );
  const visibleWeeklySteps =
    weeklySteps +
    Math.max(0, stepsToday - (rescueProgress.dailyStepHistory[todayKey] ?? 0));
  const maxWeekValue = Math.max(stepsToday, ...weekValues, 1);
  const careMilestonesCompleted = Object.values(
    rescueProgress.claimedMiniMilestones
  ).reduce((total, steps) => total + steps.length, 0);

  const nextTarget = metrics?.nextRewardTarget;
  const nextTargetStep =
    nextTarget?.stepTarget ?? metrics?.milestone.unlockSteps ?? 0;
  const nextTargetRemaining = metrics
    ? Math.max(0, nextTargetStep - activeStepsToday)
    : 0;
  const nextTargetProgress =
    nextTargetStep > 0 ? Math.min(1, activeStepsToday / nextTargetStep) : 1;

  /* One accessible summary line so VoiceOver never has to read 7 bars. */
  const chartSummary = t("progress.chartSummary", {
    days: weekKeys.length,
    steps: formatLocalizedNumber(visibleWeeklySteps)
  });

  return (
    <ScreenScaffold>
      <ScreenHeader
        eyebrow={t("progress.kicker")}
        subtitle={
          metrics
            ? t("progress.stepsLeftForAnimal", {
                animal: metrics.animal.name,
                steps: formatLocalizedNumber(metrics.remainingSteps)
              })
            : t("progress.everyJourneyComplete")
        }
        title={t("progress.stepJourney")}
      />

      {/* ── This week hero ── */}
      <MotionView delay={40}>
        <PremiumCard gap={spacing.s16} variant="hero">
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <AppText role="label" tone="secondary">
                {t("common.thisWeek")}
              </AppText>
              <AppText role={layout.isCompact ? "heroNumber" : "largeHeroNumber"}>
                {formatLocalizedNumber(visibleWeeklySteps)}
              </AppText>
              <AppText role="supportive" tone="secondary">
                {t("progress.weekPulse")}
              </AppText>
            </View>
            <StatusChip
              icon="footsteps"
              label={t("common.today")}
              tone="steps"
            />
          </View>

          {/* ── Seven-day chart ── */}
          <View
            accessibilityLabel={chartSummary}
            accessibilityRole="image"
            style={styles.chart}
          >
            {weekKeys.map((key, index) => {
              const isToday = key === todayKey;
              const value = isToday
                ? Math.max(weekValues[index], stepsToday)
                : weekValues[index];
              const ratio = value / maxWeekValue;
              const barHeight = Math.max(6, Math.round(ratio * CHART_HEIGHT));
              const [year, month, day] = key.split("-").map(Number);
              const date = new Date(year, month - 1, day);

              return (
                <View key={key} style={styles.chartColumn}>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        { height: barHeight },
                        isToday && styles.chartBarToday
                      ]}
                    />
                  </View>
                  <AppText
                    role="caption"
                    tone={isToday ? "blue" : "tertiary"}
                  >
                    {date.toLocaleDateString(locale, { weekday: "narrow" })}
                  </AppText>
                </View>
              );
            })}
          </View>
        </PremiumCard>
      </MotionView>

      {/* ── Current rescue ── */}
      <MotionView delay={90}>
        <PremiumCard gap={spacing.s12} variant="standard">
          <View style={styles.rescueTop}>
            <View style={styles.heroCopy}>
              <AppText role="label" tone="secondary">
                {nextTarget ? t("progress.nextReveal") : t("common.currentTarget")}
              </AppText>
              <AppText numberOfLines={1} role="cardTitle">
                {metrics ? metrics.animal.name : t("progress.journeyComplete")}
              </AppText>
            </View>
            <AppText role="supportiveMedium" style={styles.tabular} tone="green">
              {t("common.stepsToTarget", {
                steps: formatLocalizedNumber(nextTargetStep)
              })}
            </AppText>
          </View>
          <ProgressBar
            accessibilityLabel={t("animalDetail.rescueProgress")}
            progress={nextTargetProgress}
            variant="care"
          />
          <AppText role="caption" tone="secondary">
            {metrics
              ? nextTarget
                ? t("progress.stepsToNextReveal", {
                    steps: formatLocalizedNumber(nextTargetRemaining)
                  })
                : t("progress.stepsToRescueGate", {
                    steps: formatLocalizedNumber(metrics.remainingSteps)
                  })
              : t("common.noActiveTarget")}
          </AppText>
        </PremiumCard>
      </MotionView>

      {/* ── Care journey ── */}
      <SectionHeader
        subtitle={t("progress.milestonePath")}
        title={
          metrics ? metrics.animal.name : t("progress.journeyComplete")
        }
      />
      {metrics ? (
        <MotionView delay={140}>
          <CareMilestoneRow
            claimedMiniMilestones={metrics.claimedMiniMilestones}
            milestone={metrics.milestone}
            proLocked={metrics.status === "pro_locked"}
            stepsToday={activeStepsToday}
          />
        </MotionView>
      ) : (
        <EmptyState
          message={t("progress.emptyJourneyMessage")}
          spriteKey="emptySanctuaryNest"
          title={t("progress.emptyJourneyTitle")}
        />
      )}

      {/* ── Lifetime stats ── */}
      <SectionHeader title={t("progress.kicker")} />
      <View style={styles.statGrid}>
        <MetricCard
          label={t("progress.rescuedStat")}
          style={styles.statCard}
          tone="rescued"
          value={formatLocalizedNumber(unlockedAnimals.length)}
        />
        <MetricCard
          label={t("progress.todayStat")}
          style={styles.statCard}
          tone="steps"
          value={formatLocalizedNumber(stepsToday)}
        />
        <MetricCard
          label={t("progress.rewardsEarned")}
          style={styles.statCard}
          tone="reward"
          value={formatLocalizedNumber(careMilestonesCompleted)}
        />
        <MetricCard
          label={t("common.thisWeek")}
          style={styles.statCard}
          tone="weekly"
          value={formatLocalizedNumber(visibleWeeklySteps)}
        />
      </View>
    </ScreenScaffold>
  );
}

function createStyles(colors: AppColors, _isDark: boolean) {
  return StyleSheet.create({
    chart: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.s4
    },
    chartBar: {
      backgroundColor: colors.brandGreen,
      borderRadius: radius.chip,
      width: "100%"
    },
    chartBarToday: {
      backgroundColor: colors.stepBlue
    },
    chartColumn: {
      alignItems: "center",
      flex: 1,
      gap: spacing.s4
    },
    chartTrack: {
      backgroundColor: colors.trackNeutral,
      borderCurve: "continuous",
      borderRadius: radius.chip,
      height: CHART_HEIGHT,
      justifyContent: "flex-end",
      overflow: "hidden",
      width: "100%"
    },
    heroCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    heroTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.s12
    },
    rescueTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    statCard: {
      flexBasis: "47%",
      flexGrow: 1,
      minWidth: 140
    },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.s12
    },
    tabular: {
      fontVariant: ["tabular-nums"]
    }
  });
}
