import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AnimalMetrics } from "../state/RescueProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslateFn } from "../i18n/translations";
import { type AppColors, useAppTheme } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AnimalCage } from "./AnimalCage";
import { AnimalMoodMeter } from "./AnimalMoodMeter";
import { AppButton } from "./AppButton";
import { CircularStepProgress } from "./CircularStepProgress";
import { AnimatedProgressFill, MotionView, PulseView } from "./Motion";
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

function getStatusCopy(metrics: AnimalMetrics, t: TranslateFn) {
  if (metrics.status === "pro_locked") return t("stepHero.unlockProToRescue");
  if (metrics.progress <= 0.25) return t("stepHero.waitingForYou");
  if (metrics.progress <= 0.5) return t("stepHero.needsCare");
  if (metrics.progress <= 0.75) return t("stepHero.almostSafe");
  if (metrics.progress < 1) return t("stepHero.gateNearlyOpen");
  return t("stepHero.safeAndFree");
}

export function StepHeroCard({
  metrics,
  stepsToday,
  isRefreshing,
  onOpenPaywall,
  onRefreshSteps,
  onViewAnimal
}: StepHeroCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const {
    formatNumber: formatLocalizedNumber,
    locale,
    t
  } = useLanguage();

  /* ── Empty state ── */
  if (!metrics) {
    return (
      <MotionView direction="fade" style={styles.emptyCard}>
        <PulseView floatDistance={6} pulseScale={1.03}>
          <UiSprite spriteKey="emptySanctuaryNest" size={96} />
        </PulseView>
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>{t("stepHero.allSafe")}</Text>
          <Text selectable style={styles.emptySteps}>
            {formatLocalizedNumber(stepsToday)}
          </Text>
          <Text style={styles.emptySubtitle}>{t("stepHero.stepsToday")}</Text>
        </View>
        <AppButton
          icon="refresh"
          loading={isRefreshing}
          onPress={onRefreshSteps}
          title={t("stepHero.refreshSteps")}
          variant="secondary"
        />
      </MotionView>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = metrics.isRescued ? metrics.animal.happyImage : metrics.animal.sadImage;
  const nextRewardTarget = metrics.nextRewardTarget;
  const nextTarget = nextRewardTarget?.stepTarget ?? metrics.milestone.unlockSteps;
  const targetLabel =
    nextRewardTarget && !proLocked
      ? t("stepHero.nextReward")
      : t("stepHero.target");
  const remainingLabel = proLocked
    ? t("stepHero.proRequired")
    : metrics.remainingSteps > 0
      ? t("common.stepsLeft", {
          steps: formatLocalizedNumber(metrics.remainingSteps)
        })
      : t("stepHero.ready");

  return (
    <View style={styles.root}>

      {/* ── Step counter hero row ── */}
      <MotionView style={styles.stepHero}>
        <View style={styles.stepHeroLeft}>
          <Text style={styles.stepHeroLabel}>{t("stepHero.todaySteps")}</Text>
          <Text selectable style={styles.stepHeroNumber}>
            {formatLocalizedNumber(stepsToday)}
          </Text>
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBarTrack}>
              <AnimatedProgressFill
                progress={metrics.progress}
                style={styles.progressBarFill}
              />
            </View>
            <Text style={styles.progressBarPct}>
              {formatPercent(metrics.progress, locale)}
            </Text>
          </View>
        </View>
        <PulseView active={metrics.progress > 0} floatDistance={3} pulseScale={1.02}>
          <CircularStepProgress progress={metrics.progress} />
        </PulseView>
      </MotionView>

      {/* ── Cage + Animal info ── */}
      <MotionView delay={90} style={styles.rescueCard}>
        {/* Animal header row */}
        <View style={styles.animalHeader}>
          <View style={styles.animalHeaderLeft}>
            <View style={styles.rescuingBadge}>
              <Ionicons color={theme.colors.primaryDark} name="paw" size={12} />
              <Text style={styles.rescuingBadgeText}>{t("stepHero.rescuing")}</Text>
            </View>
            <Text numberOfLines={1} style={styles.animalName}>
              {metrics.animal.name}
            </Text>
            <Text style={styles.animalStatus}>{getStatusCopy(metrics, t)}</Text>
          </View>
          <View style={styles.animalHeaderRight}>
            {proLocked ? (
              <ProBadge />
            ) : (
              <PulseView floatDistance={4} pulseScale={1.06}>
                <UiSprite spriteKey="microPawConfetti" size={44} />
              </PulseView>
            )}
            <Pressable onPress={onViewAnimal} style={styles.viewBtn}>
              <Ionicons color={theme.colors.primaryDark} name="eye-outline" size={15} />
              <Text style={styles.viewBtnText}>{t("stepHero.view")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Cage — full width, prominent */}
        <View style={styles.cageWrap}>
          <AnimalCage
            animalImage={image}
            careState={metrics.careState}
            isRescued={metrics.isRescued}
            progress={metrics.progress}
          />
        </View>

        {/* Mood meter */}
        <AnimalMoodMeter
          mood={metrics.mood}
          progress={metrics.progress}
          proLocked={proLocked}
        />

        {nextRewardTarget && !proLocked ? (
          <MotionView delay={160} style={styles.nextRewardPanel}>
            <PulseView floatDistance={3} pulseScale={1.04}>
              <Image
                contentFit="contain"
                source={nextRewardTarget.image}
                style={styles.nextRewardImage}
              />
            </PulseView>
            <View style={styles.nextRewardCopy}>
              <Text style={styles.nextRewardLabel}>{t("stepHero.nextReward")}</Text>
              <Text numberOfLines={2} style={styles.nextRewardTitle}>
                {nextRewardTarget.title}
              </Text>
              <Text style={styles.nextRewardSteps}>
                {t("common.stepsToTarget", {
                  steps: formatLocalizedNumber(nextRewardTarget.stepTarget)
                })}
              </Text>
            </View>
          </MotionView>
        ) : null}

        {/* Metric chips row */}
        <MotionView delay={210} style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons color={theme.colors.primary} name="flag-outline" size={16} />
            <View style={styles.chipText}>
              <Text style={styles.chipLabel}>{targetLabel}</Text>
              <Text style={styles.chipValue}>{formatLocalizedNumber(nextTarget)}</Text>
            </View>
          </View>
          <View style={[styles.chip, styles.chipDivider]} />
          <View style={styles.chip}>
            <Ionicons color={theme.colors.coral} name="timer-outline" size={16} />
            <View style={styles.chipText}>
              <Text style={styles.chipLabel}>{t("stepHero.remaining")}</Text>
              <Text style={[styles.chipValue, metrics.remainingSteps === 0 && styles.chipValueReady]}>
                {remainingLabel}
              </Text>
            </View>
          </View>
        </MotionView>

        {/* Action row */}
        <MotionView delay={260} style={styles.actionRow}>
          <AppButton
            icon="refresh"
            loading={isRefreshing}
            onPress={onRefreshSteps}
            style={styles.actionBtn}
            title={t("common.refresh")}
            variant="secondary"
          />
          {proLocked ? (
            <AppButton
              icon="sparkles"
              onPress={onOpenPaywall}
              style={styles.actionBtn}
              title={t("stepHero.unlockPro")}
              variant="pro"
            />
          ) : (
            <AppButton
              icon="paw"
              onPress={onViewAnimal}
              style={styles.actionBtn}
              title={t("stepHero.viewAnimal")}
              variant="primary"
            />
          )}
        </MotionView>
      </MotionView>
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    actionBtn: {
      flex: 1
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    animalHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
    },
    animalHeaderLeft: {
      flex: 1,
      gap: 3,
      minWidth: 0
    },
    animalHeaderRight: {
      alignItems: "center",
      gap: spacing.xs
    },
    animalName: {
      color: colors.text,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.4
    },
    animalStatus: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    cageWrap: {
      borderRadius: 10,
      overflow: "hidden"
    },
    chip: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.xs
    },
    chipDivider: {
      backgroundColor: colors.border,
      flex: 0,
      height: 28,
      width: 1
    },
    chipLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    chipRow: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "rgba(255,255,255,0.7)",
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    chipText: {
      gap: 1
    },
    chipValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900"
    },
    chipValueReady: {
      color: colors.primary
    },
    nextRewardCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextRewardImage: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 66,
      width: 66
    },
    nextRewardLabel: {
      color: colors.primaryDark,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    nextRewardPanel: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "#FFFFFF",
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.sm
    },
    nextRewardSteps: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800"
    },
    nextRewardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
      lineHeight: 19
    },
    emptyCopy: {
      alignItems: "center",
      gap: 4
    },
    emptyCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.xl,
      ...shadows.card
    },
    emptySteps: {
      color: colors.text,
      fontSize: 48,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    emptySubtitle: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700"
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center"
    },
    progressBarFill: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      height: "100%"
    },
    progressBarPct: {
      color: colors.primaryDark,
      fontSize: 11,
      fontWeight: "900"
    },
    progressBarTrack: {
      backgroundColor: colors.border,
      borderRadius: 4,
      flex: 1,
      height: 6,
      overflow: "hidden"
    },
    progressBarWrap: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    rescuingBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3
    },
    rescuingBadgeText: {
      color: colors.primaryDark,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    rescueCard: {
      backgroundColor: isDark ? colors.surfaceSoft : "#F2FBF5",
      borderColor: isDark ? colors.border : "#C3E8C9",
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.md,
      ...shadows.soft
    },
    root: {
      gap: spacing.md
    },
    stepHero: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surface : "#E8F7FF",
      borderColor: isDark ? colors.border : "#B4DEFF",
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      padding: spacing.lg,
      ...shadows.card
    },
    stepHeroLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    stepHeroLeft: {
      flex: 1,
      gap: spacing.sm
    },
    stepHeroNumber: {
      color: colors.text,
      fontSize: 48,
      fontVariant: ["tabular-nums"],
      fontWeight: "900",
      letterSpacing: -1
    },
    viewBtn: {
      alignItems: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5
    },
    viewBtnText: {
      color: colors.primaryDark,
      fontSize: 11,
      fontWeight: "900"
    }
  });
}
