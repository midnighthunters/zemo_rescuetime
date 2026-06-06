import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { CareEventModal } from "../../src/components/CareEventModal";
import { MotionView, PulseView } from "../../src/components/Motion";
import { RescueModal } from "../../src/components/RescueModal";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { StepHeroCard } from "../../src/components/StepHeroCard";
import { UiSprite } from "../../src/components/UiSprite";
import { dismissUnlockNotification } from "../../src/features/notifications/unlockNotifications";
import { useEntitlements } from "../../src/state/EntitlementProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/** Pulsing glow behind the dev FAB */
function DevFabGlow({ color }: { color: string }) {
  return (
    <View
      style={{
        position: "absolute",
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: color,
        opacity: 0.24
      }}
    />
  );
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { isPro } = useEntitlements();
  const {
    currentAnimal,
    getAnimalMetrics,
    stepsToday,
    steps,
    lastCareEvent,
    lastRescueEvent,
    animals,
    milestones,
    unlockedAnimals,
    devMockSteps,
    advanceMockSteps,
    resetMockSteps,
    dismissCareEvent,
    dismissRescueEvent
  } = useRescue();

  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const rescuedAnimal = lastRescueEvent
    ? animals.find((a) => a.id === lastRescueEvent.animalId)
    : undefined;

  const rescuedIndex = rescuedAnimal ? animals.findIndex((a) => a.id === rescuedAnimal.id) : -1;
  const nextAnimal = rescuedIndex >= 0 ? animals[rescuedIndex + 1] : undefined;
  const nextMilestone = nextAnimal ? milestones.find((m) => m.animalId === nextAnimal.id) : undefined;
  const nextRewardTarget = nextMilestone?.rewardTargets[0];

  const careMilestone = lastCareEvent
    ? milestones.find((m) => m.animalId === lastCareEvent.animalId)
    : undefined;
  const careNextRewardTarget =
    lastCareEvent && careMilestone
      ? careMilestone.rewardTargets[lastCareEvent.rewardIndex + 1]
      : undefined;
  const careNextTarget =
    careMilestone
      ? (careNextRewardTarget?.stepTarget ?? careMilestone.unlockSteps)
      : undefined;
  const careNextLabel =
    careMilestone ? (careNextRewardTarget?.title ?? "Rescue") : undefined;
  const visibleUnlockEventId = lastCareEvent?.id ?? lastRescueEvent?.id;

  const hasPermissionIssue = Boolean(steps.error || steps.permissionStatus === "denied");

  useEffect(() => {
    if (!visibleUnlockEventId) {
      return undefined;
    }

    void dismissUnlockNotification(visibleUnlockEventId).catch(() => {});
    const retryTimer = setTimeout(() => {
      void dismissUnlockNotification(visibleUnlockEventId).catch(() => {});
    }, 750);

    return () => clearTimeout(retryTimer);
  }, [visibleUnlockEventId]);

  // After first animal rescued, non-pro users see the paywall
  const justRescuedFirst =
    Boolean(lastRescueEvent) &&
    rescuedAnimal?.id === animals[0]?.id &&
    !isPro;

  const handleRescueDismiss = () => {
    dismissRescueEvent();
    if (justRescuedFirst) {
      // Small delay so the rescue modal finishes closing first
      setTimeout(() => router.push("/paywall"), 350);
    }
  };

  // What the next dev mock target label is
  const allTargets = metrics
    ? [...(metrics.milestone.miniMilestones), metrics.milestone.unlockSteps]
    : [];
  const nextMockTarget = allTargets.find((t) => stepsToday < t);
  const mockIsAtUnlock =
    metrics !== undefined &&
    nextMockTarget === metrics.milestone.unlockSteps;

  return (
    <ScreenContainer>
      {/* ── Compact header ── */}
      <MotionView style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.headerTitle}>Rescue Steps</Text>
        </View>
        <PulseView floatDistance={4} pulseScale={1.04}>
          <UiSprite spriteKey="progressPawTrophy" size={52} />
        </PulseView>
      </MotionView>

      {/* ── Pedometer status pill / warning ── */}
      {hasPermissionIssue ? (
        <MotionView delay={70} style={styles.permissionBanner}>
          <Ionicons color={theme.colors.danger} name="warning" size={18} />
          <Text style={styles.permissionBannerText}>Pedometer access needed</Text>
          <View style={styles.permissionBannerActions}>
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
        </MotionView>
      ) : (
        <MotionView delay={70} style={styles.trackingPill}>
          <PulseView pulseScale={1.4}>
            <View style={[styles.trackingDot, devMockSteps !== undefined && styles.trackingDotMock]} />
          </PulseView>
          <Text style={styles.trackingText}>
            {devMockSteps !== undefined ? `🎭 Mock • ${devMockSteps.toLocaleString()} steps` : `Live • ${steps.sourceLabel}`}
          </Text>
          {devMockSteps !== undefined ? (
            <Pressable onPress={resetMockSteps}>
              <Text style={styles.trackingReset}>✕ Reset</Text>
            </Pressable>
          ) : (
            <Text style={styles.trackingStatus}>{steps.permissionStatus}</Text>
          )}
        </MotionView>
      )}

      {/* ── Care event modal ── */}
      {lastCareEvent ? (
        <CareEventModal
          key={lastCareEvent.id}
          visible={Boolean(lastCareEvent)}
          animalName={lastCareEvent.animalName}
          label={lastCareEvent.label}
          title={lastCareEvent.title}
          rewardImage={lastCareEvent.image}
          rewardIndex={lastCareEvent.rewardIndex}
          nextTargetLabel={careNextLabel}
          nextTargetSteps={careNextTarget}
          nextTargetImage={careNextRewardTarget?.image}
          onDismiss={dismissCareEvent}
        />
      ) : null}

      {/* ── Main rescue card ── */}
      <StepHeroCard
        isRefreshing={steps.isLoading}
        metrics={metrics}
        onOpenPaywall={() => router.push("/paywall")}
        onRefreshSteps={steps.refreshSteps}
        onViewAnimal={() => {
          if (currentAnimal) router.push(`/animal/${currentAnimal.id}`);
        }}
        sourceLabel={steps.sourceLabel}
        stepsToday={stepsToday}
      />

      {/* ── Rescue unlock modal ── */}
      <RescueModal
        key={lastRescueEvent?.id ?? "rescue-modal"}
        animalImage={rescuedAnimal?.happyImage}
        animalName={lastRescueEvent?.animalName ?? ""}
        nextAnimalName={nextAnimal?.name}
        nextAnimalImage={nextAnimal?.sadImage}
        nextTargetImage={nextRewardTarget?.image}
        nextTargetTitle={nextRewardTarget?.title ?? "Rescue"}
        nextTargetSteps={nextRewardTarget?.stepTarget ?? nextMilestone?.unlockSteps}
        onNextRescue={handleRescueDismiss}
        onViewAnimals={() => {
          dismissRescueEvent();
          router.push("/(tabs)/animals");
        }}
        visible={Boolean(lastRescueEvent)}
      />

      {/* ── DEV: Floating mock-advance button ── */}
      {__DEV__ && metrics && !metrics.isRescued ? (
        <View style={styles.devFab} pointerEvents="box-none">
          <DevFabGlow
            color={mockIsAtUnlock ? theme.colors.secondary : theme.colors.primary}
          />
          <Pressable
            accessibilityLabel="Dev: advance to next target"
            onPress={advanceMockSteps}
            style={[
              styles.devFabBtn,
              mockIsAtUnlock && styles.devFabBtnUnlock
            ]}
          >
            <Text style={styles.devFabIcon}>{mockIsAtUnlock ? "🔑" : "⚡"}</Text>
            <Text style={styles.devFabLabel} numberOfLines={1}>
              {mockIsAtUnlock
                ? "Unlock"
                : nextMockTarget
                  ? `→ ${nextMockTarget.toLocaleString()}`
                  : "Done"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    devFab: {
      alignItems: "center",
      bottom: 100,
      justifyContent: "center",
      position: "absolute",
      right: 20,
      zIndex: 999
    },
    devFabBtn: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 28,
      elevation: 8,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 13,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      zIndex: 2
    },
    devFabBtnUnlock: {
      backgroundColor: colors.secondary
    },
    devFabIcon: {
      fontSize: 18
    },
    devFabLabel: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "900"
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.xs
    },
    headerGreeting: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    headerLeft: {
      gap: 2
    },
    headerTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    permissionBanner: {
      alignItems: "center",
      backgroundColor: isDark ? "#2A1818" : "#FFF3F3",
      borderColor: colors.danger,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      padding: spacing.md
    },
    permissionBannerActions: {
      flexDirection: "row",
      gap: spacing.xs,
      marginLeft: "auto"
    },
    permissionBannerText: {
      color: colors.danger,
      flex: 1,
      fontSize: 13,
      fontWeight: "800"
    },
    trackingDot: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      height: 8,
      width: 8
    },
    trackingDotMock: {
      backgroundColor: colors.secondary
    },
    trackingPill: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceSoft,
      borderColor: isDark ? colors.border : "#CBEED8",
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 5
    },
    trackingReset: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: "900"
    },
    trackingStatus: {
      color: colors.primaryDark,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "capitalize"
    },
    trackingText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700"
    }
  });
}
