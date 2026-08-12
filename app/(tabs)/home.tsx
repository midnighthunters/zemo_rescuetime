import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  Linking,
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
import { shareAnimalUnlock } from "../../src/features/animals/shareAnimal";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useEntitlements } from "../../src/state/EntitlementProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { getAnimalImageSource, getRewardTargetImageSource } from "../../src/services/assets/getAppAssetSource";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting.morning" as const;
  if (hour < 18) return "greeting.afternoon" as const;
  return "greeting.evening" as const;
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { language, t } = useLanguage();
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
    careMilestone ? (careNextRewardTarget?.title ?? t("common.rescue")) : undefined;
  const visibleUnlockEventId = lastCareEvent?.id ?? lastRescueEvent?.id;

  const hasPermissionIssue =
    !steps.isLoading &&
    Boolean(
      steps.error ||
        !steps.isAvailable ||
        steps.permissionStatus !== "granted"
    );

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

  return (
    <ScreenContainer>
      {/* ── Compact header ── */}
      <MotionView style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>
            {t("home.greeting", { period: t(getGreetingKey()) })}
          </Text>
          <Text style={styles.headerTitle}>{t("home.title")}</Text>
        </View>
        <PulseView floatDistance={4} pulseScale={1.04}>
          <UiSprite spriteKey="progressPawTrophy" size={52} />
        </PulseView>
      </MotionView>

      {/* ── Pedometer status pill / warning ── */}
      {hasPermissionIssue ? (
        <MotionView delay={70} style={styles.permissionBanner}>
          <Ionicons color={theme.colors.danger} name="warning" size={18} />
          <View accessibilityLiveRegion="polite" style={styles.permissionCopy}>
            <Text style={styles.permissionBannerText}>
              {t("home.permissionNeeded")}
            </Text>
            <Text selectable style={styles.permissionBannerDetail}>
              {steps.error ??
                "Connect your device step source to count today’s rescue progress."}
            </Text>
          </View>
          <View style={styles.permissionBannerActions}>
            <AppButton
              icon={steps.permissionStatus === "undetermined" ? "heart" : "refresh"}
              loading={steps.isLoading}
              onPress={
                steps.permissionStatus === "undetermined"
                  ? steps.requestPermission
                  : steps.refreshSteps
              }
              style={styles.permissionAction}
              title={
                steps.permissionStatus === "undetermined"
                  ? t("onboarding.enableSteps")
                  : t("home.retry")
              }
              variant="secondary"
            />
            <AppButton
              icon="settings"
              onPress={() => Linking.openSettings()}
              style={styles.permissionAction}
              title={t("common.settings")}
              variant="ghost"
            />
          </View>
        </MotionView>
      ) : (
        <MotionView delay={70} style={styles.trackingPill}>
          <PulseView pulseScale={1.4}>
            <View style={styles.trackingDot} />
          </PulseView>
          <Text style={styles.trackingText}>
            {t("home.tracking", { source: steps.sourceLabel })}
          </Text>
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
          rewardImage={getRewardTargetImageSource({ image: lastCareEvent.image, remoteAssetId: lastCareEvent.remoteAssetId } as any)}
          rewardIndex={lastCareEvent.rewardIndex}
          nextTargetLabel={careNextLabel}
          nextTargetSteps={careNextTarget}
          nextTargetImage={careNextRewardTarget ? getRewardTargetImageSource(careNextRewardTarget) : undefined}
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
        animalImage={rescuedAnimal ? getAnimalImageSource(rescuedAnimal, "happy") : undefined}
        animalName={lastRescueEvent?.animalName ?? ""}
        nextAnimalName={nextAnimal?.name}
        nextAnimalImage={nextAnimal ? getAnimalImageSource(nextAnimal, "sad") : undefined}
        nextTargetImage={nextRewardTarget ? getRewardTargetImageSource(nextRewardTarget) : undefined}
        nextTargetTitle={nextRewardTarget?.title ?? t("common.rescue")}
        nextTargetSteps={nextRewardTarget?.stepTarget ?? nextMilestone?.unlockSteps}
        onNextRescue={handleRescueDismiss}
        onShareAnimal={() => {
          if (rescuedAnimal) {
            void shareAnimalUnlock({
              animalName: rescuedAnimal.name,
              happyImage: getAnimalImageSource(rescuedAnimal, "happy"),
              language
            });
          }
        }}
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
    permissionAction: {
      flex: 1
    },
    permissionBanner: {
      alignItems: "flex-start",
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
      flex: 1,
      flexBasis: "100%",
      flexDirection: "row",
      gap: spacing.xs,
      marginLeft: 26
    },
    permissionBannerDetail: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 17
    },
    permissionBannerText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: "800"
    },
    permissionCopy: {
      flex: 1,
      gap: 2,
      minWidth: 180
    },
    trackingDot: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      height: 8,
      width: 8
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
    trackingText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700"
    }
  });
}
