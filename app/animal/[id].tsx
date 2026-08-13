import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AnimalCage } from "../../src/components/AnimalCage";
import { AnimalMoodMeter } from "../../src/components/AnimalMoodMeter";
import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { CareMilestoneRow } from "../../src/components/CareMilestoneRow";
import { CircularStepProgress } from "../../src/components/CircularStepProgress";
import { EmptyState } from "../../src/components/EmptyState";
import { MotionView } from "../../src/components/Motion";
import { PremiumCard } from "../../src/components/PremiumCard";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { SectionHeader } from "../../src/components/SectionHeader";
import { StatusChip } from "../../src/components/StatusChip";
import { getAnimalFunFacts } from "../../src/data/animalFacts";
import { shareAnimalUnlock } from "../../src/features/animals/shareAnimal";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import {
  getAnimalImageSource,
  getRewardTargetImageSource
} from "../../src/services/assets/getAppAssetSource";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";

export default function AnimalDetailScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const {
    formatNumber: formatLocalizedNumber,
    language,
    locale,
    t
  } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeStepsToday, animals, getAnimalMetrics, rescueProgress } =
    useRescue();
  const animal = animals.find((item) => item.id === id);
  const metrics = animal ? getAnimalMetrics(animal.id) : undefined;

  if (!animal || !metrics) {
    return (
      <ScreenScaffold withTabBar={false}>
        <ScreenHeader
          backAccessibilityLabel={t("common.back")}
          onBack={() => router.back()}
          title={t("animalDetail.notFound")}
        />
        <EmptyState
          message={t("animals.emptyWaitingMessage")}
          spriteKey="emptyLostPathSign"
          title={t("animalDetail.notFound")}
        />
      </ScreenScaffold>
    );
  }

  const proLocked = metrics.status === "pro_locked";
  const image = getAnimalImageSource(animal, metrics.isRescued ? "happy" : "sad");
  const displayedProgress = metrics.isRescued ? 1 : metrics.progress;
  const displayedSteps = metrics.isRescued
    ? metrics.milestone.unlockSteps
    : activeStepsToday;
  const nextRewardTarget = metrics.nextRewardTarget;
  const nextCareTarget =
    nextRewardTarget?.stepTarget ?? metrics.milestone.unlockSteps;
  const funFacts = getAnimalFunFacts(animal.name);

  const handleShareAnimal = () => {
    void shareAnimalUnlock({
      animalName: animal.name,
      happyImage: getAnimalImageSource(animal, "happy"),
      language
    });
  };

  return (
    <ScreenScaffold withTabBar={false}>
      <ScreenHeader
        backAccessibilityLabel={t("common.back")}
        onBack={() => router.back()}
        title={animal.name}
        trailing={
          <StatusChip
            label={
              metrics.isRescued
                ? t("animalDetail.safeFriend")
                : proLocked
                  ? t("common.pro")
                  : t("animalDetail.activeRescue")
            }
            tone={metrics.isRescued ? "safe" : proLocked ? "pro" : "active"}
          />
        }
      />

      {/* ── Hero stage ── */}
      <MotionView delay={40}>
        <PremiumCard
          gap={spacing.s16}
          variant={metrics.isRescued ? "sanctuary" : "hero"}
        >
          <View style={styles.stage}>
            <AnimalCage
              animalImage={image}
              careState={metrics.careState}
              isRescued={metrics.isRescued}
              progress={displayedProgress}
            />
          </View>

          <View style={styles.progressRow}>
            <CircularStepProgress
              progress={displayedProgress}
              size={96}
              tone={metrics.isRescued ? "rescue" : "care"}
            />
            <View style={styles.progressCopy}>
              <AppText role="label" tone="secondary">
                {t("animalDetail.rescueProgress")}
              </AppText>
              <AppText role="heroNumber">
                {formatLocalizedNumber(displayedSteps)}
              </AppText>
              <AppText role="caption" tone="secondary">
                {t("common.stepsToTarget", {
                  steps: formatLocalizedNumber(metrics.milestone.unlockSteps)
                })}
              </AppText>
              {!metrics.isRescued ? (
                <AppText
                  role="caption"
                  tone={metrics.remainingSteps === 0 ? "green" : "coral"}
                >
                  {metrics.remainingSteps === 0
                    ? t("stepHero.ready")
                    : t("common.stepsLeft", {
                        steps: formatLocalizedNumber(metrics.remainingSteps)
                      })}
                </AppText>
              ) : null}
            </View>
          </View>
        </PremiumCard>
      </MotionView>

      {metrics.isRescued ? (
        <>
          {/* ── Safe status ── */}
          <MotionView delay={90}>
            <PremiumCard gap={spacing.s8} variant="standard">
              <StatusChip
                icon="shield-checkmark"
                label={t("animalDetail.safeFriend")}
                tone="safe"
              />
              <AppText role="cardTitle">
                {t("animalDetail.safeNow", { animal: animal.name })}
              </AppText>
              <AppText role="supportive" tone="secondary">
                {t("animalDetail.rescuedDateCopy", {
                  date: formatRescueDate(
                    rescueProgress.rescuedDates[animal.id],
                    locale,
                    t("common.today")
                  )
                })}
              </AppText>
              <AppButton
                icon="share-outline"
                onPress={handleShareAnimal}
                style={styles.shareButton}
                title={t("common.share")}
                variant="secondary"
              />
            </PremiumCard>
          </MotionView>

          {/* ── Earned rewards ── */}
          <SectionHeader title={t("animalDetail.rewardsEarned")} />
          <MotionView delay={130}>
            <CareMilestoneRow
              claimedMiniMilestones={metrics.claimedMiniMilestones}
              milestone={metrics.milestone}
              stepsToday={displayedSteps}
            />
          </MotionView>

          {/* ── Fun facts as an editorial list ── */}
          <SectionHeader
            subtitle={t("animalDetail.meetSafeFriend")}
            title={t("animalDetail.funFacts")}
          />
          <MotionView delay={170}>
            <PremiumCard gap={0} padded={false} variant="standard">
              {funFacts.map((fact, index) => (
                <View
                  key={`${fact.label}-${index}`}
                  style={[
                    styles.factRow,
                    index === funFacts.length - 1 && styles.factRowLast
                  ]}
                >
                  <Ionicons
                    color={theme.colors.brandGreenText}
                    name={index % 2 === 0 ? "leaf-outline" : "bulb-outline"}
                    size={20}
                  />
                  <View style={styles.factCopy}>
                    <AppText role="cardTitle">{fact.label}</AppText>
                    <AppText role="supportive" tone="secondary">
                      {fact.copy}
                    </AppText>
                  </View>
                </View>
              ))}
            </PremiumCard>
          </MotionView>
        </>
      ) : (
        <>
          {/* ── Mood ── */}
          <MotionView delay={90}>
            <PremiumCard variant="standard">
              <AnimalMoodMeter
                mood={metrics.mood}
                progress={metrics.progress}
                proLocked={proLocked}
              />
            </PremiumCard>
          </MotionView>

          {/* ── Next target ── */}
          {nextRewardTarget && !proLocked ? (
            <MotionView delay={130}>
              <PremiumCard gap={spacing.s12} variant="reward">
                <View style={styles.nextRow}>
                  <View style={styles.nextThumb}>
                    <Image
                      contentFit="contain"
                      source={getRewardTargetImageSource(nextRewardTarget)}
                      style={styles.nextImage}
                    />
                  </View>
                  <View style={styles.nextCopy}>
                    <AppText role="label" tone="amber">
                      {t("animalDetail.nextTarget")}
                    </AppText>
                    <AppText numberOfLines={2} role="cardTitle">
                      {nextRewardTarget.title}
                    </AppText>
                    <AppText role="caption" tone="secondary">
                      {t("animalDetail.targetSubtitle", {
                        animal: animal.name,
                        steps: formatLocalizedNumber(nextCareTarget)
                      })}
                    </AppText>
                  </View>
                </View>
              </PremiumCard>
            </MotionView>
          ) : null}

          {/* ── Care journey ── */}
          <SectionHeader title={t("progress.milestonePath")} />
          <MotionView delay={170}>
            <CareMilestoneRow
              claimedMiniMilestones={metrics.claimedMiniMilestones}
              milestone={metrics.milestone}
              proLocked={proLocked}
              stepsToday={activeStepsToday}
            />
          </MotionView>

          {proLocked ? (
            <AppButton
              icon="sparkles"
              onPress={() => router.push("/paywall")}
              title={t("animalDetail.unlockProToRescue")}
              variant="pro"
            />
          ) : (
            <AppButton
              icon="footsteps"
              onPress={() => router.back()}
              title={t("animalDetail.keepWalking")}
              variant="primary"
            />
          )}
        </>
      )}
    </ScreenScaffold>
  );
}

function createStyles(colors: AppColors, _isDark: boolean) {
  return StyleSheet.create({
    factCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    factRow: {
      alignItems: "flex-start",
      borderBottomColor: colors.separator,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.s12,
      padding: spacing.s16
    },
    factRowLast: {
      borderBottomWidth: 0
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextImage: {
      height: 54,
      width: 54
    },
    nextRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    nextThumb: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth,
      height: 64,
      justifyContent: "center",
      overflow: "hidden",
      width: 64
    },
    progressCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s16
    },
    shareButton: {
      marginTop: spacing.s4
    },
    stage: {
      borderCurve: "continuous",
      borderRadius: radius.card,
      overflow: "hidden"
    }
  });
}
