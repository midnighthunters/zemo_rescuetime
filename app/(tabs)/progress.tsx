import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { EmptyState } from "../../src/components/EmptyState";
import { AnimatedProgressFill, MotionView, PulseView } from "../../src/components/Motion";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import type { RescueRewardTarget } from "../../src/data/types";
import type { UiSpriteKey } from "../../src/data/ui.generated";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import type { TranslateFn } from "../../src/i18n/translations";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { getCurrentWeekDateKeys, getLocalDateKey } from "../../src/utils/date";

type JourneyState = "earned" | "next" | "locked" | "rescued" | "ready";

type JourneyItem = {
  key: string;
  state: JourneyState;
  stepTarget: number;
  title: string;
  copy: string;
  image?: RescueRewardTarget["image"];
};

function getStateCopy(state: JourneyState, t: TranslateFn) {
  switch (state) {
    case "earned":
      return t("state.earned");
    case "next":
      return t("state.next");
    case "ready":
      return t("state.ready");
    case "rescued":
      return t("state.complete");
    case "locked":
      return t("state.locked");
  }
}

function getStateIcon(state: JourneyState): keyof typeof Ionicons.glyphMap {
  switch (state) {
    case "earned":
      return "checkmark";
    case "next":
      return "sparkles";
    case "ready":
      return "flag";
    case "rescued":
      return "shield-checkmark";
    case "locked":
      return "lock-closed";
  }
}

function StatCard({
  accent,
  icon,
  label,
  index = 0,
  spriteKey,
  value
}: {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  index?: number;
  label: string;
  spriteKey: UiSpriteKey;
  value: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, false),
    [theme.colors, theme.isDark]
  );

  return (
    <MotionView delay={index * 70} style={[styles.statCard, { borderTopColor: accent }]}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}1A` }]}>
        <Ionicons color={accent} name={icon} size={19} />
      </View>
      <View style={styles.statCopy}>
        <Text selectable style={styles.statValue}>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <PulseView floatDistance={3} pulseScale={1.04}>
        <UiSprite spriteKey={spriteKey} size={44} />
      </PulseView>
    </MotionView>
  );
}

function AnimatedWeekBar({
  colors,
  height,
  style
}: {
  colors: readonly [string, string];
  height: number;
  style: ReturnType<typeof createStyles>["weekBarFill"];
}) {
  return (
    <View style={[style, { height }]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function WeekBars({
  maxWeekValue,
  stepsToday,
  weekKeys,
  weekValues
}: {
  maxWeekValue: number;
  stepsToday: number;
  weekKeys: string[];
  weekValues: number[];
}) {
  const theme = useAppTheme();
  const { locale } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, false),
    [theme.colors, theme.isDark]
  );

  return (
    <View style={styles.weekBars}>
      {weekKeys.map((key, index) => {
        const isToday = key === getLocalDateKey();
        const value = isToday ? Math.max(weekValues[index], stepsToday) : weekValues[index];
        const [year, month, day] = key.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const height = Math.max(12, Math.round((value / maxWeekValue) * 92));

        return (
          <View key={key} style={styles.weekBarItem}>
            <View style={styles.weekBarTrack}>
              <AnimatedWeekBar
                colors={
                  isToday
                    ? [theme.colors.coral, theme.colors.secondary]
                    : [theme.colors.primary, theme.colors.primaryDark]
                }
                height={height}
                style={styles.weekBarFill}
              />
            </View>
            <Text style={[styles.weekDay, isToday && styles.weekDayToday]}>
              {date.toLocaleDateString(locale, { weekday: "narrow" })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function JourneyNode({
  index,
  isLast,
  item
}: {
  index: number;
  isLast: boolean;
  item: JourneyItem;
}) {
  const theme = useAppTheme();
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, false),
    [theme.colors, theme.isDark]
  );
  const isRevealed = item.state === "earned" || item.state === "rescued";
  const isActive = item.state === "next" || item.state === "ready";

  return (
    <MotionView delay={index * 80} style={styles.journeyItem}>
      <View style={styles.journeyRail}>
        <LinearGradient
          colors={
            isRevealed
              ? [theme.colors.primary, theme.colors.primaryDark]
              : isActive
                ? [theme.colors.coral, theme.colors.secondary]
                : [theme.colors.border, theme.colors.border]
          }
          style={[
            styles.journeyDot,
            item.state === "locked" && styles.journeyDotLocked
          ]}
        >
          <Ionicons color={theme.colors.white} name={getStateIcon(item.state)} size={14} />
        </LinearGradient>
        {!isLast ? (
          <View
            style={[
              styles.journeyLine,
              isRevealed && styles.journeyLineComplete
            ]}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.journeyCard,
          isActive && styles.journeyCardActive,
          isRevealed && styles.journeyCardEarned
        ]}
      >
          <View style={styles.rewardFrame}>
            {isRevealed && item.image ? (
            <PulseView active={isRevealed} floatDistance={2} pulseScale={1.05}>
              <Image contentFit="contain" source={item.image} style={styles.rewardImage} />
            </PulseView>
          ) : (
            <View
              style={[
                styles.lockedReward,
                isActive && styles.lockedRewardActive
              ]}
            >
              <Ionicons
                color={isActive ? theme.colors.coral : theme.colors.locked}
                name={isActive ? "gift" : "lock-closed"}
                size={28}
              />
            </View>
          )}
        </View>

        <View style={styles.journeyCopy}>
          <View style={styles.journeyMetaRow}>
            <Text style={styles.journeyStep}>
              {t("progress.stage", { number: index + 1 })}
            </Text>
            <View
              style={[
                styles.statePill,
                isActive && styles.statePillActive,
                isRevealed && styles.statePillEarned
              ]}
            >
              <Text
                style={[
                  styles.stateText,
                  isActive && styles.stateTextActive,
                  isRevealed && styles.stateTextEarned
                ]}
              >
                {getStateCopy(item.state, t)}
              </Text>
            </View>
          </View>
          <Text numberOfLines={2} style={styles.journeyTitle}>
            {item.title}
          </Text>
          <Text style={styles.journeyText}>{item.copy}</Text>
          <Text selectable style={styles.journeyTarget}>
            {t("common.stepsToTarget", {
              steps: formatLocalizedNumber(item.stepTarget)
            })}
          </Text>
        </View>
      </View>
    </MotionView>
  );
}

export default function ProgressScreen() {
  const theme = useAppTheme();
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();
  const { width } = useWindowDimensions();
  const isCompact = width <= 430;
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, isCompact),
    [isCompact, theme.colors, theme.isDark]
  );
  const {
    activeStepsToday,
    currentAnimal,
    getAnimalMetrics,
    rescueProgress,
    stepsToday,
    weeklySteps,
    unlockedAnimals
  } = useRescue();
  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const weekKeys = getCurrentWeekDateKeys();
  const todayKey = getLocalDateKey();
  const weekValues = weekKeys.map((key) => rescueProgress.dailyStepHistory[key] ?? 0);
  const visibleWeeklySteps =
    weeklySteps + Math.max(0, stepsToday - (rescueProgress.dailyStepHistory[todayKey] ?? 0));
  const maxWeekValue = Math.max(stepsToday, ...weekValues, 1);
  const careMilestonesCompleted = Object.values(
    rescueProgress.claimedMiniMilestones
  ).reduce((total, steps) => total + steps.length, 0);
  const progressPercent = metrics ? Math.round(metrics.progress * 100) : 100;
  const nextTarget = metrics?.nextRewardTarget;
  const nextTargetStep = nextTarget?.stepTarget ?? metrics?.milestone.unlockSteps ?? 0;
  const nextTargetRemaining = metrics
    ? Math.max(0, nextTargetStep - activeStepsToday)
    : 0;
  const nextTargetProgress =
    nextTargetStep > 0 ? Math.min(1, activeStepsToday / nextTargetStep) : 1;

  const timeline: JourneyItem[] = metrics
    ? [
        ...metrics.milestone.rewardTargets.map((target) => {
          const isEarned = metrics.claimedMiniMilestones.includes(target.stepTarget);
          const isNext = nextTarget?.id === target.id && !isEarned;
          const state: JourneyState = isEarned ? "earned" : isNext ? "next" : "locked";

          return {
            key: target.id,
            state,
            stepTarget: target.stepTarget,
            title: isEarned
              ? target.title
              : isNext
                ? t("progress.nextCareReward")
                : t("progress.lockedReward"),
            copy: isEarned
              ? t("progress.rewardUnlockedFor", {
                  reward: target.label,
                  animal: metrics.animal.name
                })
              : isNext
                ? t("progress.stepsToReveal", {
                    steps: formatLocalizedNumber(
                      Math.max(0, target.stepTarget - activeStepsToday)
                    )
                  })
                : t("progress.revealsAt", {
                    steps: formatLocalizedNumber(target.stepTarget)
                  }),
            image: isEarned ? target.image : undefined
          };
        }),
        {
          key: "rescue",
          state: metrics.isRescued
            ? "rescued"
            : metrics.remainingSteps === 0
              ? "ready"
              : "locked",
          stepTarget: metrics.milestone.unlockSteps,
          title: metrics.isRescued
            ? t("progress.animalRescued", { animal: metrics.animal.name })
            : metrics.remainingSteps === 0
              ? t("progress.rescueReady")
              : t("progress.finalRescueGate"),
          copy: metrics.isRescued
            ? t("common.safeAndComplete")
            : metrics.remainingSteps === 0
              ? t("progress.finalStepComplete")
              : t("common.stepsLeft", {
                  steps: formatLocalizedNumber(metrics.remainingSteps)
                }),
          image: undefined
        }
      ]
    : [];

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <MotionView>
      <LinearGradient
        colors={
          theme.isDark
            ? ["#1F3C36", "#1A232D"]
            : ["#FFFFFF", "#EAF8F0"]
        }
        style={styles.hero}
      >
        <View style={styles.heroCopy}>
          <View style={styles.kickerRow}>
            <Ionicons color={theme.colors.primaryDark} name="trail-sign" size={16} />
            <Text style={styles.kicker}>{t("progress.kicker")}</Text>
          </View>
          <Text style={styles.title}>{t("progress.stepJourney")}</Text>
          <Text style={styles.subtitle}>
            {metrics
              ? t("progress.stepsLeftForAnimal", {
                  animal: metrics.animal.name,
                  steps: formatLocalizedNumber(metrics.remainingSteps)
                })
              : t("progress.everyJourneyComplete")}
          </Text>
        </View>
        <View style={styles.heroArt}>
          <PulseView floatDistance={4} pulseScale={1.03}>
            <UiSprite spriteKey="progressMountainTrail" size={isCompact ? 86 : 112} />
          </PulseView>
          <View style={styles.heroBadge}>
            <Text selectable style={styles.heroBadgeValue}>
              {progressPercent}%
            </Text>
            <Text style={styles.heroBadgeLabel}>{t("common.done")}</Text>
          </View>
        </View>
      </LinearGradient>
      </MotionView>

      <MotionView delay={90} style={styles.todayPanel}>
        <View style={styles.todayTop}>
          <View style={styles.todayCopy}>
            <Text style={styles.panelEyebrow}>{t("common.today")}</Text>
            <Text selectable style={styles.todayValue}>
              {formatLocalizedNumber(stepsToday)}
            </Text>
            <Text style={styles.todayText}>
              {metrics
                ? nextTarget
                  ? t("progress.stepsToNextReveal", {
                      steps: formatLocalizedNumber(nextTargetRemaining)
                    })
                  : t("progress.stepsToRescueGate", {
                      steps: formatLocalizedNumber(metrics.remainingSteps)
                    })
                : t("common.noActiveTarget")}
            </Text>
          </View>
          <PulseView floatDistance={3} pulseScale={1.04}>
            <UiSprite spriteKey="progressCompletedBadge" size={82} />
          </PulseView>
        </View>
        <View style={styles.targetMeter}>
          <View style={styles.targetMeterTop}>
            <Text style={styles.targetMeterLabel}>
              {nextTarget ? t("progress.nextReveal") : t("common.currentTarget")}
            </Text>
            <Text selectable style={styles.targetMeterValue}>
              {t("common.stepsToTarget", {
                steps: formatLocalizedNumber(nextTargetStep)
              })}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <AnimatedProgressFill progress={nextTargetProgress} style={styles.progressFill}>
              <LinearGradient
                colors={[theme.colors.coral, theme.colors.secondary]}
                style={styles.progressFillGradient}
              />
            </AnimatedProgressFill>
          </View>
        </View>
      </MotionView>

      <MotionView delay={160} style={styles.weekPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelEyebrow}>{t("progress.weekPulse")}</Text>
            <Text style={styles.panelTitle}>{t("progress.dailyMovement")}</Text>
          </View>
          <Text selectable style={styles.weekTotal}>
            {t("common.stepsToTarget", {
              steps: formatLocalizedNumber(visibleWeeklySteps)
            })}
          </Text>
        </View>
        <WeekBars
          maxWeekValue={maxWeekValue}
          stepsToday={stepsToday}
          weekKeys={weekKeys}
          weekValues={weekValues}
        />
      </MotionView>

      <View style={styles.statGrid}>
        <StatCard
          accent={theme.colors.primary}
          icon="shield-checkmark"
          index={0}
          label={t("progress.rescuedStat")}
          spriteKey="progressPawTrophy"
          value={formatLocalizedNumber(unlockedAnimals.length)}
        />
        <StatCard
          accent={theme.colors.coral}
          icon="footsteps"
          index={1}
          label={t("progress.todayStat")}
          spriteKey="microWalkingShoe"
          value={formatLocalizedNumber(stepsToday)}
        />
        <StatCard
          accent={theme.colors.secondary}
          icon="gift"
          index={2}
          label={t("progress.rewardsEarned")}
          spriteKey="careRewardChest"
          value={formatLocalizedNumber(careMilestonesCompleted)}
        />
        <StatCard
          accent={theme.colors.primaryDark}
          icon="calendar"
          index={3}
          label={t("common.thisWeek")}
          spriteKey="progressWeeklyCalendar"
          value={formatLocalizedNumber(visibleWeeklySteps)}
        />
      </View>

      <MotionView delay={220} style={styles.journeyPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelEyebrow}>{t("progress.milestonePath")}</Text>
            <Text style={styles.panelTitle}>
              {metrics ? metrics.animal.name : t("progress.journeyComplete")}
            </Text>
          </View>
          <PulseView floatDistance={3} pulseScale={1.03}>
            <UiSprite spriteKey="progressTimelineTrail" size={64} />
          </PulseView>
        </View>

        {timeline.length === 0 ? (
          <EmptyState
            message={t("progress.emptyJourneyMessage")}
            title={t("progress.emptyJourneyTitle")}
          />
        ) : (
          <View style={styles.journeyList}>
            {timeline.map((item, index) => (
              <JourneyNode
                index={index}
                isLast={index === timeline.length - 1}
                item={item}
                key={item.key}
              />
            ))}
          </View>
        )}
      </MotionView>
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark: boolean, isCompact: boolean) {
  return StyleSheet.create({
    hero: {
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(34,48,71,0.08)",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      overflow: "hidden",
      padding: spacing.lg,
      ...shadows.card
    },
    heroArt: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: isCompact ? 96 : 126
    },
    heroBadge: {
      alignItems: "center",
      backgroundColor: colors.text,
      borderColor: "rgba(255,255,255,0.18)",
      borderRadius: 8,
      borderWidth: 1,
      bottom: 0,
      minWidth: 66,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      position: "absolute",
      right: 0
    },
    heroBadgeLabel: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    heroBadgeValue: {
      color: colors.white,
      fontSize: 18,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    heroCopy: {
      flex: 1,
      gap: spacing.xs,
      justifyContent: "center"
    },
    journeyCard: {
      backgroundColor: isDark ? "rgba(23,33,31,0.86)" : "rgba(255,255,255,0.86)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md
    },
    journeyCardActive: {
      backgroundColor: isDark ? "rgba(55,42,34,0.82)" : "#FFF6E8",
      borderColor: colors.coral
    },
    journeyCardEarned: {
      borderColor: colors.primary
    },
    journeyCopy: {
      flex: 1,
      gap: spacing.xs
    },
    journeyDot: {
      alignItems: "center",
      borderColor: colors.surface,
      borderRadius: 14,
      borderWidth: 2,
      height: 28,
      justifyContent: "center",
      width: 28
    },
    journeyDotLocked: {
      opacity: 0.86
    },
    journeyItem: {
      flexDirection: "row",
      gap: spacing.md
    },
    journeyLine: {
      backgroundColor: colors.border,
      flex: 1,
      width: 2
    },
    journeyLineComplete: {
      backgroundColor: colors.primary
    },
    journeyList: {
      gap: spacing.sm
    },
    journeyMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
    },
    journeyPanel: {
      backgroundColor: isDark ? "rgba(23,33,31,0.76)" : "rgba(255,255,255,0.78)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.lg,
      ...shadows.card
    },
    journeyRail: {
      alignItems: "center",
      alignSelf: "stretch"
    },
    journeyStep: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    journeyTarget: {
      color: colors.primaryDark,
      fontSize: 12,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    journeyText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18
    },
    journeyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
      lineHeight: 20
    },
    kicker: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    kickerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs
    },
    lockedReward: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F2F5F1",
      borderColor: colors.border,
      borderRadius: 8,
      borderStyle: "dashed",
      borderWidth: 1,
      height: "100%",
      justifyContent: "center",
      width: "100%"
    },
    lockedRewardActive: {
      backgroundColor: isDark ? "rgba(255,138,91,0.14)" : "#FFF0DE",
      borderColor: colors.coral
    },
    panelEyebrow: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    panelHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between"
    },
    panelTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900"
    },
    progressFill: {
      borderRadius: 8,
      height: "100%"
    },
    progressFillGradient: {
      height: "100%",
      width: "100%"
    },
    progressTrack: {
      backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(34,48,71,0.10)",
      borderRadius: 8,
      height: 12,
      overflow: "hidden"
    },
    rewardFrame: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 72,
      justifyContent: "center",
      overflow: "hidden",
      width: 72
    },
    rewardImage: {
      height: 68,
      width: 68
    },
    screenContent: {
      gap: spacing.lg
    },
    statCard: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(23,33,31,0.78)" : "rgba(255,255,255,0.84)",
      borderColor: colors.border,
      borderRadius: 8,
      borderTopWidth: 3,
      borderWidth: 1,
      flexBasis: isCompact ? "100%" : "47%",
      flexDirection: "row",
      flexGrow: 1,
      gap: spacing.md,
      minHeight: 94,
      padding: spacing.md,
      ...shadows.soft
    },
    statCopy: {
      flex: 1,
      gap: 2
    },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md
    },
    statIcon: {
      alignItems: "center",
      borderRadius: 8,
      height: 38,
      justifyContent: "center",
      width: 38
    },
    statLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800"
    },
    statValue: {
      color: colors.text,
      fontSize: 22,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    statePill: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(34,48,71,0.06)",
      borderRadius: 8,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3
    },
    statePillActive: {
      backgroundColor: `${colors.coral}1F`
    },
    statePillEarned: {
      backgroundColor: `${colors.primary}1F`
    },
    stateText: {
      color: colors.locked,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    stateTextActive: {
      color: colors.coral
    },
    stateTextEarned: {
      color: colors.primaryDark
    },
    subtitle: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 21
    },
    targetMeter: {
      gap: spacing.sm
    },
    targetMeterLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    targetMeterTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    targetMeterValue: {
      color: colors.text,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    title: {
      color: colors.text,
      fontSize: isCompact ? 29 : 34,
      fontWeight: "900",
      lineHeight: isCompact ? 34 : 39
    },
    todayCopy: {
      flex: 1,
      gap: spacing.xs
    },
    todayPanel: {
      backgroundColor: isDark ? "rgba(31,42,39,0.78)" : "rgba(255,255,255,0.86)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.card
    },
    todayText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20
    },
    todayTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between"
    },
    todayValue: {
      color: colors.text,
      fontSize: 44,
      fontVariant: ["tabular-nums"],
      fontWeight: "900",
      lineHeight: 49
    },
    weekBarFill: {
      borderRadius: 8,
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0
    },
    weekBarItem: {
      alignItems: "center",
      flex: 1,
      gap: spacing.xs
    },
    weekBarTrack: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(34,48,71,0.08)",
      borderRadius: 8,
      height: 96,
      overflow: "hidden",
      position: "relative",
      width: "100%"
    },
    weekBars: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs
    },
    weekDay: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900"
    },
    weekDayToday: {
      color: colors.coral
    },
    weekPanel: {
      backgroundColor: isDark ? "rgba(23,33,31,0.78)" : "rgba(255,255,255,0.82)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    weekTotal: {
      color: colors.primaryDark,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    }
  });
}
