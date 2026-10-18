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
import { FREE_ANIMAL_COUNT } from "../../src/features/animals/animalAccess";
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

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors]
  );
  const { language, t } = useLanguage();
  const { isPro } = useEntitlements();
  const {
    animals,
    careEvents,
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
  const maxCareRewardIndex =
    careEvents.length > 0
      ? Math.max(...careEvents.map((e) => e.rewardIndex))
      : (lastCareEvent?.rewardIndex ?? 0);
  const careNextRewardTarget = careMilestone
    ? careMilestone.rewardTargets[maxCareRewardIndex + 1]
    : undefined;
  const careNextTarget = careMilestone
    ? careNextRewardTarget?.stepTarget ?? careMilestone.unlockSteps
    : undefined;
  const careNextLabel = careMilestone
    ? careNextRewardTarget?.title ?? t("common.rescue")
    : undefined;

  const careModalItems = useMemo(
    () =>
      careEvents.map((event) => {
        const milestone = milestones.find((m) => m.animalId === event.animalId);
        const target = milestone?.rewardTargets.find(
          (t) => t.rewardId === event.rewardId
        );
        return {
          id: event.id,
          image: target
            ? getRewardTargetImageSource(target)
            : getRewardImageSource({
                image: event.image,
                remoteAssetId: event.remoteAssetId
              } as RewardImage),
          label: event.label,
          remoteAssetId: event.remoteAssetId,
          rewardIndex: event.rewardIndex,
          title: event.title
        };
      }),
    [careEvents, milestones]
  );

  const visibleUnlockEventId = lastCareEvent?.id ?? lastRescueEvent?.id;

  const hasPermissionIssue =
    !steps.isLoading &&
    Boolean(
      steps.error || !steps.isAvailable || steps.permissionStatus !== "granted"
    );
  const needsPermissionRequest = steps.permissionStatus !== "granted";

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

  // After all free animals are rescued, non-Pro users see the paywall — but only once the
  // rescue celebration has finished closing.
  const justRescuedLastFree =
    Boolean(lastRescueEvent) &&
    (rescuedAnimal?.id === animals[FREE_ANIMAL_COUNT - 1]?.id ||
      unlockedAnimals.length >= FREE_ANIMAL_COUNT) &&
    !isPro;

  const handleRescueDismiss = () => {
    dismissRescueEvent();
    if (justRescuedLastFree) {
      setTimeout(() => router.push("/paywall"), 350);
    }
  };

  return (
    <ScreenScaffold>
      {/* ── Title ── */}
      <MotionView style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText accessibilityRole="header" role="screenTitle">
            Rescue Time
          </AppText>
        </View>
      </MotionView>

      {/* ── Step source warning if permission issue ── */}
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
                  {needsPermissionRequest
                    ? t("home.permissionNeeded")
                    : t("settings.stepsProblem")}
                </AppText>
                <AppText
                  accessibilityLiveRegion="polite"
                  role="supportive"
                  tone="secondary"
                >
                  {steps.error ??
                    (needsPermissionRequest
                      ? t("home.permissionExplainer")
                      : t("home.permissionRecovery"))}
                </AppText>
              </View>
            </View>

            <AppButton
              icon={needsPermissionRequest ? "heart" : "refresh"}
              loading={steps.isLoading}
              onPress={
                needsPermissionRequest
                  ? steps.requestPermission
                  : steps.refreshSteps
              }
              title={
                needsPermissionRequest
                  ? t("onboarding.enableSteps")
                  : t("home.retry")
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
      ) : null}

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
          items={careModalItems}
          key={careEvents.map((e) => e.id).join("-")}
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
