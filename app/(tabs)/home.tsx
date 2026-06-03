import { router } from "expo-router";
import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { RescueModal } from "../../src/components/RescueModal";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StepHeroCard } from "../../src/components/StepHeroCard";
import { UiSprite } from "../../src/components/UiSprite";
import type { UiSpriteKey } from "../../src/data/ui.generated";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning, Rescuer";
  }
  if (hour < 18) {
    return "Good afternoon, Rescuer";
  }
  return "Good evening, Rescuer";
}

function getCareSprite(label: string): UiSpriteKey {
  const normalized = label.toLowerCase();

  if (normalized.includes("water")) {
    return "careWaterBowl";
  }

  if (normalized.includes("food") || normalized.includes("feed")) {
    return "careFoodBowl";
  }

  return "careMedkit";
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const {
    currentAnimal,
    getAnimalMetrics,
    stepsToday,
    steps,
    lastCareEvent,
    lastRescueEvent,
    animals,
    dismissCareEvent,
    dismissRescueEvent
  } = useRescue();
  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const rescuedAnimal = lastRescueEvent
    ? animals.find((animal) => animal.id === lastRescueEvent.animalId)
    : undefined;

  useEffect(() => {
    if (!lastCareEvent) {
      return undefined;
    }

    const timer = setTimeout(dismissCareEvent, 3200);
    return () => clearTimeout(timer);
  }, [dismissCareEvent, lastCareEvent]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{getGreeting()}</Text>
          <Text style={styles.greeting}>Rescue Steps</Text>
          <Text style={styles.subtitle}>
            Walk today. Open gates. Give them a better tomorrow.
          </Text>
        </View>
        <View style={styles.heroBadgePanel}>
          <UiSprite
            spriteKey="progressPawTrophy"
            size={118}
            style={styles.headerSprite}
          />
        </View>
      </View>

      {steps.error || steps.permissionStatus === "denied" ? (
        <View style={styles.permissionCard}>
          <View style={styles.permissionTop}>
            <UiSprite spriteKey="emptyAnimalWave" size={118} />
            <View style={styles.permissionCopyWrap}>
              <Text style={styles.permissionTitle}>Pedometer access needed</Text>
              <Text style={styles.permissionCopy}>
                Allow motion access so rescue progress uses real device steps.
              </Text>
              {steps.error ? <Text style={styles.errorText}>{steps.error}</Text> : null}
            </View>
          </View>
          <View style={styles.permissionActions}>
            <AppButton
              icon="refresh"
              loading={steps.isLoading}
              onPress={steps.refreshSteps}
              title="Retry"
              variant="secondary"
            />
            <AppButton
              icon="settings"
              onPress={() => Linking.openSettings()}
              title="Settings"
              variant="ghost"
            />
          </View>
        </View>
      ) : (
        <View style={styles.statusStrip}>
          <UiSprite spriteKey="microWalkingShoe" size={34} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusLabel}>Real Step Tracking</Text>
            <Text style={styles.statusValue}>{steps.sourceLabel}</Text>
          </View>
          <Text style={styles.statusSteps}>{steps.permissionStatus}</Text>
        </View>
      )}

      {lastCareEvent ? (
        <Pressable onPress={dismissCareEvent} style={styles.careToast}>
          <UiSprite spriteKey={getCareSprite(lastCareEvent.label)} size={54} />
          <View style={styles.careCopyWrap}>
            <Text style={styles.careTitle}>Care complete</Text>
            <Text style={styles.careCopy}>
              {lastCareEvent.animalName} got {lastCareEvent.label}.
            </Text>
          </View>
        </Pressable>
      ) : null}

      <StepHeroCard
        isRefreshing={steps.isLoading}
        metrics={metrics}
        onOpenPaywall={() => router.push("/paywall")}
        onRefreshSteps={steps.refreshSteps}
        onViewAnimal={() => {
          if (currentAnimal) {
            router.push(`/animal/${currentAnimal.id}`);
          }
        }}
        sourceLabel={steps.sourceLabel}
        stepsToday={stepsToday}
      />

      <RescueModal
        animalImage={rescuedAnimal?.happyImage}
        animalName={lastRescueEvent?.animalName ?? ""}
        onNextRescue={dismissRescueEvent}
        onViewAnimals={() => {
          dismissRescueEvent();
          router.push("/(tabs)/animals");
        }}
        visible={Boolean(lastRescueEvent)}
      />
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
  careCopy: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800"
  },
  careTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  careToast: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: isDark ? colors.border : "#BFE9CE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.md,
    ...shadows.soft
  },
  careCopyWrap: {
    flex: 1,
    gap: spacing.xs
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  greeting: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "900"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs
  },
  headerSprite: {
    marginRight: -6
  },
  heroBadgePanel: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 118
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  permissionActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft
  },
  permissionCopy: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  permissionCopyWrap: {
    flex: 1,
    gap: spacing.xs
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  permissionTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  statusCopy: {
    flex: 1,
    gap: 2
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  statusSteps: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  statusStrip: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: isDark ? colors.border : "#CBEED8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft
  },
  statusValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27
  }
  });
}
