import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AnimalCage } from "../../src/components/AnimalCage";
import { getAnimalImageSource, getRewardTargetImageSource } from "../../src/services/assets/getAppAssetSource";
import { AnimalMoodMeter } from "../../src/components/AnimalMoodMeter";
import { AppButton } from "../../src/components/AppButton";
import { CareMilestoneRow } from "../../src/components/CareMilestoneRow";
import { CircularStepProgress } from "../../src/components/CircularStepProgress";
import { AnimatedProgressFill, MotionView, PulseView } from "../../src/components/Motion";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import { getAnimalFunFacts } from "../../src/data/animalFacts";
import { shareAnimalUnlock } from "../../src/features/animals/shareAnimal";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";

export default function AnimalDetailScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const {
    formatNumber: formatLocalizedNumber,
    language,
    locale,
    t
  } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeStepsToday,
    animals,
    getAnimalMetrics,
    rescueProgress
  } = useRescue();
  const animal = animals.find((item) => item.id === id);
  const metrics = animal ? getAnimalMetrics(animal.id) : undefined;

  if (!animal || !metrics) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>{t("animalDetail.notFound")}</Text>
        <AppButton
          onPress={() => router.back()}
          title={t("common.back")}
          variant="ghost"
        />
      </ScreenContainer>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = getAnimalImageSource(animal, metrics.isRescued ? "happy" : "sad");
  const displayedProgress = metrics.isRescued ? 1 : metrics.progress;
  const displayedSteps = metrics.isRescued
    ? metrics.milestone.unlockSteps
    : activeStepsToday;
  const nextRewardTarget = metrics.nextRewardTarget;
  const nextCareTarget = nextRewardTarget?.stepTarget ?? metrics.milestone.unlockSteps;
  const nextTargetLabel = nextRewardTarget?.title ?? t("common.rescue");
  const funFacts = getAnimalFunFacts(animal.name);
  const handleShareAnimal = () => {
    void shareAnimalUnlock({
      animalName: animal.name,
      happyImage: getAnimalImageSource(animal, "happy"),
      language
    });
  };

  return (
    <ScreenContainer>
      <MotionView style={styles.topBar}>
        <AppButton
          icon="arrow-back"
          onPress={() => router.back()}
          title={t("common.back")}
          variant="ghost"
        />
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {animal.name}
          </Text>
          <View style={styles.activePill}>
            <Ionicons color={theme.colors.primaryDark} name="paw" size={16} />
            <Text style={styles.activePillText}>
              {metrics.isRescued
                ? t("animalDetail.safeFriend")
                : t("animalDetail.activeRescue")}
            </Text>
          </View>
        </View>
        <PulseView floatDistance={3} pulseScale={1.05} style={styles.heartButton}>
          <UiSprite spriteKey="microHeartBubble" size={44} />
        </PulseView>
      </MotionView>

      <MotionView delay={70} style={styles.heroStage}>
        <AnimalCage
          animalImage={image}
          careState={metrics.careState}
          isRescued={metrics.isRescued}
          progress={displayedProgress}
        />
      </MotionView>

      {metrics.isRescued ? (
        <View style={styles.rewardsPanel}>
          <View style={styles.rewardsHeader}>
            <Ionicons color={theme.colors.primary} name="gift" size={22} />
            <Text style={styles.panelTitle}>{t("animalDetail.rewardsEarned")}</Text>
          </View>
          <CareMilestoneRow
            claimedMiniMilestones={metrics.claimedMiniMilestones}
            milestone={metrics.milestone}
            proLocked={proLocked}
            stepsToday={displayedSteps}
          />
        </View>
      ) : null}

      <MotionView delay={120} style={styles.progressPanel}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleRow}>
            <Ionicons color={theme.colors.muted} name="paw" size={22} />
            <Text style={styles.panelTitle}>{t("animalDetail.rescueProgress")}</Text>
          </View>
          <Text style={styles.percentText}>
            {t("animalDetail.percentComplete", {
              percent: formatLocalizedNumber(Math.round(displayedProgress * 100))
            })}
          </Text>
        </View>
        <View style={styles.track}>
          <AnimatedProgressFill progress={displayedProgress} style={styles.fill} />
        </View>
        <View style={styles.trackLabels}>
          <Text style={styles.smallStat}>{formatLocalizedNumber(displayedSteps)}</Text>
          <Text style={styles.smallStat}>
            {t("common.stepsToTarget", {
              steps: formatLocalizedNumber(metrics.milestone.unlockSteps)
            })}
          </Text>
        </View>
      </MotionView>

      {metrics.isRescued ? (
        <>
          <MotionView delay={170} style={styles.safePanel}>
            <PulseView floatDistance={3} pulseScale={1.05}>
              <UiSprite spriteKey="microHeartBubble" size={58} />
            </PulseView>
            <View style={styles.safeCopy}>
              <Text style={styles.safeTitle}>
                {t("animalDetail.safeNow", { animal: animal.name })}
              </Text>
              <Text style={styles.copy}>
                {t("animalDetail.rescuedDateCopy", {
                  date: formatRescueDate(
                    rescueProgress.rescuedDates[animal.id],
                    locale,
                    t("common.today")
                  )
                })}
              </Text>
            </View>
          </MotionView>

          <MotionView delay={195} style={styles.sharePanel}>
            <Image contentFit="contain" source={getAnimalImageSource(animal, "happy")} style={styles.shareImage} />
            <View style={styles.shareCopy}>
              <Text style={styles.shareTitle}>{t("animalDetail.shareTitle")}</Text>
              <Text style={styles.shareText}>
                {t("animalDetail.shareText", { animal: animal.name })}
              </Text>
            </View>
            <AppButton
              icon="share-social"
              onPress={handleShareAnimal}
              style={styles.shareButton}
              title={t("common.share")}
              variant="secondary"
            />
          </MotionView>

          <MotionView delay={220} style={styles.factsSection}>
            <View style={styles.factsHeader}>
              <View style={styles.factsIconBadge}>
                <Ionicons color={theme.colors.primaryDark} name="sparkles" size={20} />
              </View>
              <View style={styles.factsTitleBlock}>
                <Text style={styles.factsEyebrow}>{t("animalDetail.funFacts")}</Text>
                <Text style={styles.factsTitle}>
                  {t("animalDetail.meetSafeFriend")}
                </Text>
              </View>
            </View>
            {funFacts.map((fact, index) => (
              <MotionView
                delay={260 + index * 70}
                key={`${fact.label}-${index}`}
                style={styles.factCard}
              >
                <View style={styles.factIconCircle}>
                  <Ionicons
                    color={index % 2 === 0 ? theme.colors.primaryDark : theme.colors.coral}
                    name={index % 2 === 0 ? "leaf" : "bulb"}
                    size={19}
                  />
                </View>
                <View style={styles.factCopy}>
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={styles.factText}>{fact.copy}</Text>
                </View>
              </MotionView>
            ))}
          </MotionView>

        </>
      ) : (
        <>
          <MotionView delay={170} style={styles.infoGrid}>
            <View style={styles.infoTile}>
              <Ionicons color={theme.colors.primary} name="flag" size={34} />
              <View>
                <Text style={styles.tileLabel}>{t("animalDetail.nextTarget")}</Text>
                <Text style={styles.tileValue}>
                  {formatLocalizedNumber(nextCareTarget)}
                </Text>
                <Text style={styles.tileUnit}>{t("common.steps")}</Text>
              </View>
            </View>
            <View style={styles.infoTile}>
              <Ionicons color={theme.colors.coral} name="timer" size={34} />
              <View>
                <Text style={styles.tileLabel}>{t("animalDetail.remaining")}</Text>
                <Text style={styles.tileValue}>
                  {formatLocalizedNumber(metrics.remainingSteps)}
                </Text>
                <Text style={styles.tileUnit}>{t("common.steps")}</Text>
              </View>
            </View>
          </MotionView>

          <MotionView delay={220} style={styles.nextTargetPanel}>
            {nextRewardTarget ? (
              <PulseView floatDistance={3} pulseScale={1.04}>
                <Image
                  contentFit="contain"
                  source={getRewardTargetImageSource(nextRewardTarget)}
                  style={styles.nextRewardImage}
                />
              </PulseView>
            ) : (
              <View style={styles.nextRewardFallback}>
                <Ionicons color="#096DD9" name="key" size={38} />
              </View>
            )}
            <View style={styles.targetCopy}>
              <View style={styles.targetPill}>
                <Ionicons
                  color="#096DD9"
                  name={nextRewardTarget ? "gift" : "key"}
                  size={16}
                />
                <Text style={styles.targetPillText}>
                  {t("animalDetail.nextTarget")}
                </Text>
              </View>
              <Text adjustsFontSizeToFit numberOfLines={2} style={styles.targetTitle}>
                {nextTargetLabel}
              </Text>
              <Text style={styles.targetSubtitle}>
                {t("animalDetail.targetSubtitle", {
                  animal: animal.name,
                  steps: formatLocalizedNumber(nextCareTarget)
                })}
              </Text>
            </View>
            <PulseView floatDistance={3} pulseScale={1.03}>
              <UiSprite spriteKey="homeProgressRingMascot" size={72} />
            </PulseView>
          </MotionView>

          <MotionView delay={270} style={styles.moodPanel}>
            <AnimalMoodMeter
              mood={metrics.mood}
              progress={metrics.progress}
              proLocked={proLocked}
            />
          </MotionView>

          <CareMilestoneRow
            claimedMiniMilestones={metrics.claimedMiniMilestones}
            milestone={metrics.milestone}
            proLocked={proLocked}
            stepsToday={activeStepsToday}
          />

          <MotionView delay={350} style={styles.actionRow}>
            <View style={styles.progressRingWrap}>
              <CircularStepProgress progress={metrics.progress} />
            </View>
            {proLocked ? (
              <AppButton
                icon="sparkles"
                onPress={() => router.push("/paywall")}
                style={styles.primaryAction}
                title={t("animalDetail.unlockProToRescue")}
                variant="pro"
              />
            ) : (
              <AppButton
                icon="footsteps"
                onPress={() => router.back()}
                style={styles.primaryAction}
                title={t("animalDetail.keepWalking")}
                variant="primary"
              />
            )}
          </MotionView>
        </>
      )}
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    actionRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md
    },
    activePill: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    activePillText: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900"
    },
    copy: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 22
    },
    factCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 94,
      padding: spacing.lg,
      ...shadows.soft
    },
    factCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    factIconCircle: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceSoft : "#FFF7DF",
      borderColor: isDark ? colors.border : "#FFE0A3",
      borderRadius: 8,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46
    },
    factLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900"
    },
    factText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 21
    },
    factsEyebrow: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    factsHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md
    },
    factsIconBadge: {
      alignItems: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#BFE9CE",
      borderRadius: 8,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46,
      ...shadows.soft
    },
    factsSection: {
      gap: spacing.md
    },
    factsTitle: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "900"
    },
    factsTitleBlock: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    fill: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: "100%"
    },
    heartButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      width: 56,
      ...shadows.soft
    },
    heroStage: {
      backgroundColor: isDark ? colors.surface : "#CDEFFF",
      borderColor: colors.white,
      borderRadius: 8,
      borderWidth: 1,
      overflow: "hidden",
      padding: spacing.sm,
      ...shadows.card
    },
    infoGrid: {
      flexDirection: "row",
      gap: spacing.md
    },
    infoTile: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 92,
      padding: spacing.lg,
      ...shadows.soft
    },
    moodPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: spacing.lg,
      ...shadows.soft
    },
    nextTargetPanel: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surface : "#EAF6FF",
      borderColor: isDark ? colors.border : "#48AEEF",
      borderRadius: 8,
      borderWidth: 2,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    nextRewardFallback: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : "#B8E3FF",
      borderRadius: 8,
      borderWidth: 1,
      height: 96,
      justifyContent: "center",
      width: 96
    },
    nextRewardImage: {
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : "#B8E3FF",
      borderRadius: 8,
      borderWidth: 1,
      height: 96,
      width: 96
    },
    panelTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900"
    },
    percentText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    primaryAction: {
      flex: 1
    },
    progressHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    progressPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    progressRingWrap: {
      alignItems: "center",
      width: 112
    },
    progressTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    rewardsHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    rewardsPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    safeCopy: {
      flex: 1,
      gap: spacing.xs
    },
    safePanel: {
      alignItems: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#BFE9CE",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    safeTitle: {
      color: colors.primaryDark,
      fontSize: 20,
      fontWeight: "900"
    },
    shareButton: {
      minWidth: 104
    },
    shareCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    shareImage: {
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : "#BFE9CE",
      borderRadius: 8,
      borderWidth: 1,
      height: 64,
      width: 64
    },
    sharePanel: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      padding: spacing.lg,
      ...shadows.soft
    },
    shareText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20
    },
    shareTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900"
    },
    smallStat: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    targetCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    targetPill: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderColor: "#8ED0FF",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    targetPillText: {
      color: "#096DD9",
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    targetSubtitle: {
      color: colors.muted,
      fontSize: 17,
      fontWeight: "800"
    },
    targetTitle: {
      color: "#0D55B8",
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 28
    },
    tileLabel: {
      color: colors.primaryDark,
      fontSize: 13,
      fontWeight: "900"
    },
    tileUnit: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800"
    },
    tileValue: {
      color: colors.text,
      fontSize: 30,
      fontVariant: ["tabular-nums"],
      fontWeight: "900"
    },
    title: {
      color: colors.text,
      fontSize: 40,
      fontWeight: "900",
      textAlign: "center"
    },
    titleWrap: {
      alignItems: "center",
      flex: 1,
      gap: spacing.xs,
      minWidth: 0
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
    },
    track: {
      backgroundColor: colors.border,
      borderRadius: 8,
      height: 14,
      overflow: "hidden"
    },
    trackLabels: {
      flexDirection: "row",
      justifyContent: "space-between"
    }
  });
}
