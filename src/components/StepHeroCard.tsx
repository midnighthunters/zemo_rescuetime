import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslateFn } from "../i18n/translations";
import { getAnimalImageSource, getRewardTargetImageSource } from "../services/assets/getAppAssetSource";
import type { AnimalMetrics } from "../state/RescueProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { useResponsiveLayout } from "../theme/layout";
import { radius, spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AnimalCage } from "./AnimalCage";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";
import { MotionView } from "./Motion";
import { PremiumCard } from "./PremiumCard";
import { ProgressBar } from "./ProgressBar";
import { StatusChip } from "./StatusChip";
import { UiSprite } from "./UiSprite";

type StepHeroCardProps = {
  metrics?: AnimalMetrics;
  stepsToday: number;
  sourceLabel: string;
  isRefreshing: boolean;
  rescuedCount: number;
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

/**
 * The single focal card on Home: one animal, one step total, one progress
 * indicator, one next reward, one primary action.
 */
export function StepHeroCard({
  isRefreshing,
  metrics,
  onOpenPaywall,
  onRefreshSteps,
  onViewAnimal,
  rescuedCount,
  stepsToday
}: StepHeroCardProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { formatNumber: formatLocalizedNumber, locale, t } = useLanguage();

  /* ── All animals safe: warm sanctuary completion card ── */
  if (!metrics) {
    return (
      <MotionView>
        <PremiumCard gap={spacing.s16} variant="sanctuary">
          <View style={styles.sanctuaryTop}>
            <UiSprite spriteKey="emptySanctuaryNest" size={layout.isCompact ? 72 : 88} />
            <View style={styles.sanctuaryCopy}>
              <StatusChip label={t("state.complete")} tone="safe" />
              <AppText role="sectionTitle">{t("stepHero.allSafe")}</AppText>
              <AppText role="supportive" tone="secondary">
                {t("stepHero.allSafeBody")}
              </AppText>
            </View>
          </View>
          <View style={styles.sanctuaryStats}>
            <View style={styles.sanctuaryStat}>
              <AppText role="metric">{formatLocalizedNumber(stepsToday)}</AppText>
              <AppText role="caption" tone="secondary">
                {t("stepHero.stepsToday")}
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.sanctuaryStat}>
              <AppText role="metric">{formatLocalizedNumber(rescuedCount)}</AppText>
              <AppText role="caption" tone="secondary">
                {t("animals.safe")}
              </AppText>
            </View>
          </View>
          <AppButton
            icon="refresh"
            loading={isRefreshing}
            onPress={onRefreshSteps}
            title={t("stepHero.refreshSteps")}
            variant="secondary"
          />
        </PremiumCard>
      </MotionView>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const animalImage = getAnimalImageSource(
    metrics.animal,
    metrics.isRescued ? "happy" : "sad"
  );
  const nextRewardTarget = metrics.nextRewardTarget;
  const isReady = metrics.remainingSteps === 0;

  return (
    <MotionView>
      <PremiumCard gap={spacing.s16} variant="hero">
        {/* ── Who we are rescuing ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <StatusChip
              label={proLocked ? t("common.pro") : t("stepHero.rescuing")}
              tone={proLocked ? "pro" : "active"}
            />
            <AppText numberOfLines={1} role="sectionTitle">
              {metrics.animal.name}
            </AppText>
            <AppText numberOfLines={2} role="supportive" tone="secondary">
              {getStatusCopy(metrics, t)}
            </AppText>
          </View>
          <IconButton
            accessibilityLabel={t("stepHero.refreshSteps")}
            disabled={isRefreshing}
            icon="refresh"
            onPress={onRefreshSteps}
            variant="surface"
          />
        </View>

        {/* ── The stage: the animal is the largest thing on screen ── */}
        <View style={styles.stage}>
          <AnimalCage
            animalImage={animalImage}
            careState={metrics.careState}
            isRescued={metrics.isRescued}
            progress={metrics.progress}
          />
        </View>

        {/* ── Today's steps and the single rescue indicator ── */}
        <View style={styles.stepBlock}>
          <AppText role="label" tone="secondary">
            {t("stepHero.todaySteps")}
          </AppText>
          <AppText
            accessibilityLiveRegion="polite"
            role={layout.isCompact ? "heroNumber" : "largeHeroNumber"}
          >
            {formatLocalizedNumber(stepsToday)}
          </AppText>
          <ProgressBar
            accessibilityLabel={t("animalDetail.rescueProgress")}
            progress={metrics.progress}
            variant={proLocked ? "pro" : "rescue"}
          />
          <View style={styles.metaRow}>
            <AppText role="caption" tone="secondary">
              {t("animalDetail.percentComplete", {
                percent: formatLocalizedNumber(Math.round(metrics.progress * 100))
              })}
            </AppText>
            <AppText role="caption" tone={isReady ? "green" : "secondary"}>
              {proLocked
                ? t("stepHero.proRequired")
                : isReady
                  ? t("stepHero.ready")
                  : t("common.stepsLeft", {
                      steps: formatLocalizedNumber(metrics.remainingSteps)
                    })}
            </AppText>
          </View>
        </View>

        {/* ── Next care reward ── */}
        {nextRewardTarget && !proLocked ? (
          <View style={styles.rewardCard}>
            <View style={styles.rewardThumb}>
              <Image
                contentFit="contain"
                source={getRewardTargetImageSource(nextRewardTarget)}
                style={styles.rewardImage}
              />
            </View>
            <View style={styles.rewardCopy}>
              <AppText role="label" tone="amber">
                {t("stepHero.nextReward")}
              </AppText>
              <AppText numberOfLines={1} role="cardTitle">
                {nextRewardTarget.title}
              </AppText>
              <AppText role="caption" tone="secondary">
                {t("common.stepsToTarget", {
                  steps: formatLocalizedNumber(nextRewardTarget.stepTarget)
                })}
              </AppText>
            </View>
          </View>
        ) : null}

        {/* ── One primary action ── */}
        {proLocked ? (
          <AppButton
            icon="sparkles"
            onPress={onOpenPaywall}
            title={t("stepHero.unlockPro")}
            variant="pro"
          />
        ) : (
          <AppButton
            icon="footsteps"
            onPress={onViewAnimal}
            title={isReady ? t("stepHero.viewAnimal") : t("animalDetail.keepWalking")}
            variant="primary"
          />
        )}
        <AppText align="center" role="caption" tone="tertiary">
          {formatPercent(metrics.progress, locale)} ·{" "}
          {t("common.stepsToTarget", {
            steps: formatLocalizedNumber(metrics.milestone.unlockSteps)
          })}
        </AppText>
      </PremiumCard>
    </MotionView>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    headerCopy: {
      flex: 1,
      gap: spacing.s4,
      minWidth: 0
    },
    headerRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.s12
    },
    metaRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s8,
      justifyContent: "space-between"
    },
    rewardCard: {
      alignItems: "center",
      backgroundColor: colors.surfaceAmber,
      borderColor: isDark ? colors.separatorStrong : "rgba(138,94,6,0.16)",
      borderCurve: "continuous",
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.s12,
      padding: spacing.s12
    },
    rewardCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    rewardImage: {
      height: 46,
      width: 46
    },
    rewardThumb: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderRadius: radius.chip,
      borderWidth: StyleSheet.hairlineWidth,
      height: 54,
      justifyContent: "center",
      overflow: "hidden",
      width: 54
    },
    sanctuaryCopy: {
      flex: 1,
      gap: spacing.s4,
      minWidth: 0
    },
    sanctuaryStat: {
      flex: 1,
      gap: 2
    },
    sanctuaryStats: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderCurve: "continuous",
      borderRadius: radius.control,
      flexDirection: "row",
      gap: spacing.s12,
      padding: spacing.s12
    },
    sanctuaryTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s16
    },
    stage: {
      borderCurve: "continuous",
      borderRadius: radius.card,
      overflow: "hidden"
    },
    statDivider: {
      backgroundColor: colors.separator,
      height: 32,
      width: StyleSheet.hairlineWidth
    },
    stepBlock: {
      gap: spacing.s8
    }
  });
}
