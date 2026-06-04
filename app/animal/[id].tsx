import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AnimalCage } from "../../src/components/AnimalCage";
import { AnimalMoodMeter } from "../../src/components/AnimalMoodMeter";
import { AppButton } from "../../src/components/AppButton";
import { CareMilestoneRow } from "../../src/components/CareMilestoneRow";
import { CircularStepProgress } from "../../src/components/CircularStepProgress";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import { feedingMilestoneIcons, feedingMilestoneLabels } from "../../src/data/milestones";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";
import { formatNumber } from "../../src/utils/format";

export default function AnimalDetailScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { animals, getAnimalMetrics, rescueProgress, stepsToday } = useRescue();
  const animal = animals.find((item) => item.id === id);
  const metrics = animal ? getAnimalMetrics(animal.id) : undefined;

  if (!animal || !metrics) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Animal not found</Text>
        <AppButton onPress={() => router.back()} title="Back" variant="ghost" />
      </ScreenContainer>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = metrics.isRescued ? animal.happyImage : animal.sadImage;
  const progressPercent = `${Math.round(metrics.progress * 100)}%` as `${number}%`;
  const nextCareTarget = metrics.nextMiniMilestone ?? metrics.milestone.unlockSteps;

  // Work out which mini-milestone is next and get its label/icon
  const nextMiniIndex = metrics.nextMiniMilestone
    ? metrics.milestone.miniMilestones.indexOf(metrics.nextMiniMilestone)
    : -1;
  const nextTargetLabel = metrics.nextMiniMilestone
    ? (feedingMilestoneLabels[nextMiniIndex] ?? "Care")
    : "Rescue";
  const nextTargetIcon = metrics.nextMiniMilestone
    ? (feedingMilestoneIcons[nextMiniIndex] ?? "heart")
    : "key";
  const nextTargetSpriteKey = metrics.nextMiniMilestone
    ? nextMiniIndex === 0
      ? ("careWaterBowl" as const)
      : nextMiniIndex === 1
        ? ("careFoodBowl" as const)
        : ("careMedkit" as const)
    : ("proGoldenKey" as const);

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <AppButton
          icon="arrow-back"
          onPress={() => router.back()}
          title="Back"
          variant="ghost"
        />
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {animal.name}
          </Text>
          <View style={styles.activePill}>
            <Ionicons color={theme.colors.primaryDark} name="paw" size={16} />
            <Text style={styles.activePillText}>
              {metrics.isRescued ? "Safe Friend" : "Active Rescue"}
            </Text>
          </View>
        </View>
        <View style={styles.heartButton}>
          <UiSprite spriteKey="microHeartBubble" size={44} />
        </View>
      </View>

      <View style={styles.heroStage}>
        <AnimalCage
          animalImage={image}
          careState={metrics.careState}
          isRescued={metrics.isRescued}
          progress={metrics.progress}
        />
      </View>

      <View style={styles.progressPanel}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleRow}>
            <Ionicons color={theme.colors.muted} name="paw" size={22} />
            <Text style={styles.panelTitle}>Rescue Progress</Text>
          </View>
          <Text style={styles.percentText}>{Math.round(metrics.progress * 100)}% Complete</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: progressPercent }]} />
        </View>
        <View style={styles.trackLabels}>
          <Text style={styles.smallStat}>{formatNumber(stepsToday)}</Text>
          <Text style={styles.smallStat}>
            {formatNumber(metrics.milestone.unlockSteps)} Steps
          </Text>
        </View>
      </View>

      {metrics.isRescued ? (
        <View style={styles.safePanel}>
          <UiSprite spriteKey="microHeartBubble" size={58} />
          <View style={styles.safeCopy}>
            <Text style={styles.safeTitle}>{animal.name} is safe now</Text>
            <Text style={styles.copy}>
              Rescued {formatRescueDate(rescueProgress.rescuedDates[animal.id])}
              . Your steps opened this gate.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.infoGrid}>
            <View style={styles.infoTile}>
              <Ionicons color={theme.colors.primary} name="flag" size={34} />
              <View>
                <Text style={styles.tileLabel}>Next Care</Text>
                <Text style={styles.tileValue}>{formatNumber(nextCareTarget)}</Text>
                <Text style={styles.tileUnit}>steps</Text>
              </View>
            </View>
            <View style={styles.infoTile}>
              <Ionicons color={theme.colors.coral} name="timer" size={34} />
              <View>
                <Text style={styles.tileLabel}>Remaining</Text>
                <Text style={styles.tileValue}>{formatNumber(metrics.remainingSteps)}</Text>
                <Text style={styles.tileUnit}>steps left</Text>
              </View>
            </View>
          </View>

          <View style={styles.nextTargetPanel}>
            <UiSprite spriteKey={nextTargetSpriteKey} size={96} />
            <View style={styles.targetCopy}>
              <View style={styles.targetPill}>
                <Ionicons
                  color="#096DD9"
                  name={nextTargetIcon as keyof typeof Ionicons.glyphMap}
                  size={16}
                />
                <Text style={styles.targetPillText}>Next Target</Text>
              </View>
              <Text style={styles.targetTitle}>{nextTargetLabel}</Text>
              <Text style={styles.targetSubtitle}>
                {animal.name} needs {nextTargetLabel.toLowerCase()} at{" "}
                <Text style={{ fontWeight: "900", color: "#0D55B8" }}>
                  {formatNumber(nextCareTarget)}
                </Text>
                {" "}steps
              </Text>
            </View>
            <UiSprite spriteKey="homeProgressRingMascot" size={72} />
          </View>

          <View style={styles.moodPanel}>
            <AnimalMoodMeter
              mood={metrics.mood}
              progress={metrics.progress}
              proLocked={proLocked}
            />
          </View>

          <CareMilestoneRow
            claimedMiniMilestones={metrics.claimedMiniMilestones}
            milestone={metrics.milestone}
            proLocked={proLocked}
            stepsToday={stepsToday}
          />

          <View style={styles.actionRow}>
            <View style={styles.progressRingWrap}>
              <CircularStepProgress progress={metrics.progress} />
            </View>
            {proLocked ? (
              <AppButton
                icon="sparkles"
                onPress={() => router.push("/paywall")}
                style={styles.primaryAction}
                title="Unlock Pro To Rescue"
                variant="pro"
              />
            ) : (
              <AppButton
                icon="footsteps"
                onPress={() => router.back()}
                style={styles.primaryAction}
                title="Keep Walking"
                variant="primary"
              />
            )}
          </View>
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
      fontSize: 30,
      fontWeight: "900"
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
