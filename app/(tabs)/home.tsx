import { router } from "expo-router";
import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { RescueModal } from "../../src/components/RescueModal";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StepHeroCard } from "../../src/components/StepHeroCard";
import { useRescue } from "../../src/state/RescueProvider";
import { colors } from "../../src/theme/colors";
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

export default function HomeScreen() {
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
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>
          Every walk can make today safer for someone small.
        </Text>
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
          <Text style={styles.careTitle}>You gave {lastCareEvent.animalName} {lastCareEvent.label}.</Text>
          <Text style={styles.careCopy}>Mood improved. Keep going.</Text>
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

const styles = StyleSheet.create({
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
    backgroundColor: "#E9F8EF",
    borderColor: "#BFE9CE",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    ...shadows.card
  },
  greeting: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  header: {
    gap: spacing.xs
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
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
