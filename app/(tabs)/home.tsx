import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { CareEventModal } from "../../src/components/CareEventModal";
import { MotionView } from "../../src/components/Motion";
import { PremiumCard } from "../../src/components/PremiumCard";
import { RescueModal } from "../../src/components/RescueModal";
import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { StatusChip } from "../../src/components/StatusChip";
import { StepHeroCard } from "../../src/components/StepHeroCard";
import type { RewardImage } from "../../src/data/types";
import { shareAnimalUnlock } from "../../src/features/animals/shareAnimal";
import { dismissUnlockNotification } from "../../src/features/notifications/unlockNotifications";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import {
  getAnimalImageSource,
  getRewardImageSource,
  getRewardTargetImageSource
} from "../../src/services/assets/getAppAssetSource";
import { useEntitlements } from "../../src/state/EntitlementProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting.morning" as const;
  if (hour < 18) return "greeting.afternoon" as const;
  return "greeting.evening" as const;
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );
  const { formatDate, language, t } = useLanguage();
  const { isPro } = useEntitlements();
  const {
    animals,
    currentAnimal,
    dismissCareEvent,
    dismissRescueEvent,
    getAnimalMetrics,
    lastCareEvent,
    lastRescueEvent,
    milestones,
    steps,
    stepsToday,
    unlockedAnimals
  } = useRescue();
  const [showStepDetail, setShowStepDetail] = useState(false);

  const metrics = currentAnimal ? getAnimalMetrics(currentAnimal.id) : undefined;
  const rescuedAnimal = lastRescueEvent
    ? animals.find((animal) => animal.id === lastRescueEvent.animalId)
    : undefined;

  const rescuedIndex = rescuedAnimal
    ? animals.findIndex((animal) => animal.id === rescuedAnimal.id)
    : -1;
  const nextAnimal = rescuedIndex >= 0 ? animals[rescuedIndex + 1] : undefined;
  const nextMilestone = nextAnimal
    ? milestones.find((milestone) => milestone.animalId === nextAnimal.id)
    : undefined;
  const nextRewardTarget = nextMilestone?.rewardTargets[0];

  const careMilestone = lastCareEvent
    ? milestones.find((milestone) => milestone.animalId === lastCareEvent.animalId)
    : undefined;
  const careRewardTarget =
    lastCareEvent && careMilestone
      ? careMilestone.rewardTargets.find(
          (target) => target.rewardId === lastCareEvent.rewardId
        )
      : undefined;
  const careNextRewardTarget =
    lastCareEvent && careMilestone
      ? careMilestone.rewardTargets[lastCareEvent.rewardIndex + 1]
      : undefined;
  const careNextTarget = careMilestone
    ? careNextRewardTarget?.stepTarget ?? careMilestone.unlockSteps
    : undefined;
  const careNextLabel = careMilestone
    ? careNextRewardTarget?.title ?? t("common.rescue")
    : undefined;
  const visibleUnlockEventId = lastCareEvent?.id ?? lastRescueEvent?.id;

  const hasPermissionIssue =
    !steps.isLoading &&
    Boolean(
      steps.error || !steps.isAvailable || steps.permissionStatus !== "granted"
    );
  const needsFirstGrant = steps.permissionStatus === "undetermined";

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

  // After the first rescue, non-Pro users see the paywall — but only once the
  // rescue celebration has finished closing.
  const justRescuedFirst =
    Boolean(lastRescueEvent) && rescuedAnimal?.id === animals[0]?.id && !isPro;

  const handleRescueDismiss = () => {
    dismissRescueEvent();
    if (justRescuedFirst) {
      setTimeout(() => router.push("/paywall"), 350);
    }
  };

  const today = useMemo(
    () => formatDate(new Date(), { day: "numeric", month: "long", weekday: "long" }),
    [formatDate]
  );

  return (
    <ScreenScaffold>
      {/* ── Greeting and date ── */}
      <MotionView style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText role="label" tone="secondary">
            {t("home.greeting", { period: t(getGreetingKey()) })}
          </AppText>
          <AppText accessibilityRole="header" role="screenTitle">
            {t("home.title")}
          </AppText>
          <AppText role="caption" tone="tertiary">
            {today}
          </AppText>
        </View>
      </MotionView>

      {/* ── Step source status or a single, calm warning card ── */}
      {hasPermissionIssue ? (
        <MotionView delay={60}>
          <PremiumCard gap={spacing.s12} variant="warning">
            <View style={styles.warningTop}>
              <Ionicons
                color={theme.colors.dangerText}
                name="alert-circle"
                size={22}
              />
              <View style={styles.warningCopy}>
                <AppText role="cardTitle" tone="danger">
                  {t("home.permissionNeeded")}
                </AppText>
                <AppText
                  accessibilityLiveRegion="polite"
                  role="supportive"
                  tone="secondary"
                >
                  {needsFirstGrant
                    ? t("home.permissionExplainer")
                    : t("home.permissionRecovery")}
                </AppText>
              </View>
            </View>

            <AppButton
              icon={needsFirstGrant ? "heart" : "refresh"}
              loading={steps.isLoading}
              onPress={
                needsFirstGrant ? steps.requestPermission : steps.refreshSteps
              }
              title={
                needsFirstGrant ? t("onboarding.enableSteps") : t("home.retry")
              }
              variant="primary"
            />

            <View style={styles.warningActions}>
              <AppButton
                onPress={() => Linking.openSettings()}
                size="compact"
                style={styles.warningAction}
                title={t("common.settings")}
                variant="ghost"
              />
              {steps.error ? (
                <AppButton
                  icon={showStepDetail ? "chevron-up" : "chevron-down"}
                  iconPosition="trailing"
                  onPress={() => setShowStepDetail((value) => !value)}
                  size="compact"
                  style={styles.warningAction}
                  title={t("home.showDetails")}
                  variant="ghost"
                />
              ) : null}
            </View>

            {showStepDetail && steps.error ? (
              <AppText role="caption" selectable tone="secondary">
                {steps.error}
              </AppText>
            ) : null}
          </PremiumCard>
        </MotionView>
      ) : (
        <MotionView delay={60} style={styles.trackingRow}>
          <StatusChip
            icon="pulse"
            label={t("home.tracking", { source: steps.sourceLabel })}
            tone="steps"
          />
        </MotionView>
      )}

      {/* ── The rescue in progress ── */}
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
        rescuedCount={unlockedAnimals.length}
        sourceLabel={steps.sourceLabel}
        stepsToday={stepsToday}
      />

      {/* ── Care reward moment ── */}
      {lastCareEvent ? (
        <CareEventModal
          animalName={lastCareEvent.animalName}
          key={lastCareEvent.id}
          label={lastCareEvent.label}
          nextTargetImage={
            careNextRewardTarget
              ? getRewardTargetImageSource(careNextRewardTarget)
              : undefined
          }
          nextTargetLabel={careNextLabel}
          nextTargetSteps={careNextTarget}
          onDismiss={dismissCareEvent}
          rewardImage={
            careRewardTarget
              ? getRewardTargetImageSource(careRewardTarget)
              : getRewardImageSource({
                  image: lastCareEvent.image,
                  remoteAssetId: lastCareEvent.remoteAssetId
                } as RewardImage)
          }
          rewardIndex={lastCareEvent.rewardIndex}
          title={lastCareEvent.title}
          visible={Boolean(lastCareEvent)}
        />
      ) : null}

      {/* ── Rescue celebration ── */}
      <RescueModal
        animalImage={
          rescuedAnimal ? getAnimalImageSource(rescuedAnimal, "happy") : undefined
        }
        animalName={lastRescueEvent?.animalName ?? ""}
        key={lastRescueEvent?.id ?? "rescue-modal"}
        nextAnimalImage={
          nextAnimal ? getAnimalImageSource(nextAnimal, "sad") : undefined
        }
        nextAnimalName={nextAnimal?.name}
        nextTargetImage={
          nextRewardTarget ? getRewardTargetImageSource(nextRewardTarget) : undefined
        }
        nextTargetSteps={nextRewardTarget?.stepTarget ?? nextMilestone?.unlockSteps}
        nextTargetTitle={nextRewardTarget?.title ?? t("common.rescue")}
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
    </ScreenScaffold>
  );
}

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      gap: spacing.s12
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    trackingRow: {
      flexDirection: "row"
    },
    warningAction: {
      flex: 1
    },
    warningActions: {
      flexDirection: "row",
      gap: spacing.s8
    },
    warningCopy: {
      flex: 1,
      gap: spacing.s4,
      minWidth: 0
    },
    warningTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.s12
    }
  });
}
