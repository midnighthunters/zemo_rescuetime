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
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>
            Every walk can make today safer for someone small.
          </Text>
        </View>
        <UiSprite spriteKey="homeSanctuaryIsland" size={104} style={styles.headerSprite} />
      </View>

      {steps.error || steps.permissionStatus === "denied" ? (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Step tracking is off</Text>
          <Text style={styles.permissionCopy}>
            Allow motion access so your walks can rescue animals.
          </Text>
          <AppButton
            icon="settings"
            onPress={() => Linking.openSettings()}
            title="Open Settings"
            variant="secondary"
          />
        </View>
      ) : null}

      {lastCareEvent ? (
        <Pressable onPress={dismissCareEvent} style={styles.careToast}>
          <UiSprite spriteKey={getCareSprite(lastCareEvent.label)} size={54} />
          <View style={styles.careCopyWrap}>
            <Text style={styles.careTitle}>You gave {lastCareEvent.animalName} {lastCareEvent.label}.</Text>
            <Text style={styles.careCopy}>Mood improved. Keep going.</Text>
          </View>
        </Pressable>
      ) : null}

      <StepHeroCard
        metrics={metrics}
        onOpenPaywall={() => router.push("/paywall")}
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
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.md,
    ...shadows.card
  },
  careCopyWrap: {
    flex: 1,
    gap: spacing.xs
  },
  greeting: {
    color: colors.text,
    fontSize: 30,
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
    marginRight: -8
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  permissionCopy: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  }
  });
}
