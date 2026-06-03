import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AnimalCage } from "../../src/components/AnimalCage";
import { AnimalMoodMeter } from "../../src/components/AnimalMoodMeter";
import { AppButton } from "../../src/components/AppButton";
import { CareMilestoneRow } from "../../src/components/CareMilestoneRow";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
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

  return (
    <ScreenContainer>
      <AppButton
        icon="arrow-back"
        onPress={() => router.back()}
        title="Back"
        variant="ghost"
      />

      <View style={styles.card}>
        <View style={styles.detailHeader}>
          <View style={styles.detailCopy}>
            <Text style={styles.eyebrow}>
              {metrics.isRescued ? "Safe friend" : "Rescue target"}
            </Text>
            <Text style={styles.title}>{animal.name}</Text>
          </View>
          <UiSprite
            spriteKey={metrics.isRescued ? "microHeartBubble" : "homeRescuerFlag"}
            size={68}
          />
        </View>
        <AnimalCage
          animalImage={image}
          careState={metrics.careState}
          isRescued={metrics.isRescued}
          progress={metrics.progress}
        />
        {metrics.isRescued ? (
          <View style={styles.safePanel}>
            <Text style={styles.safeTitle}>
              {animal.name} is safe because of your steps.
            </Text>
            <Text style={styles.copy}>
              Rescued {formatRescueDate(rescueProgress.rescuedDates[animal.id])}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Today</Text>
                <Text style={styles.statValue}>{formatNumber(stepsToday)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>
                  {formatNumber(metrics.milestone.unlockSteps)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Left</Text>
                <Text style={styles.statValue}>
                  {formatNumber(metrics.remainingSteps)}
                </Text>
              </View>
            </View>
            <Text style={styles.copy}>
              {formatNumber(stepsToday)} / {formatNumber(metrics.milestone.unlockSteps)} steps.
              {metrics.remainingSteps > 0
                ? ` ${formatNumber(metrics.remainingSteps)} steps left.`
                : " Ready to rescue."}
            </Text>
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
            {proLocked ? (
              <AppButton
                icon="sparkles"
                onPress={() => router.push("/paywall")}
                title="Unlock Pro To Rescue"
                variant="pro"
              />
            ) : null}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    lineHeight: 22
  },
  detailCopy: {
    flex: 1,
    gap: spacing.xs
  },
  detailHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  safePanel: {
    backgroundColor: colors.surfaceSoft,
    borderColor: isDark ? colors.border : "#BFE9CE",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  safeTitle: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: "900"
  },
  statItem: {
    backgroundColor: isDark ? colors.surfaceElevated : "#FAFCF7",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  }
  });
}
