import { Image } from "expo-image";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType
} from "react-native";

import {
  playUnlockChime,
  type UnlockChimeSound
} from "../features/audio/playUnlockChime";
import { useUnlockAudioSettings } from "../features/audio/useUnlockAudioSettings";
import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { duration, easing, useReduceMotion } from "../theme/motion";
import { elevation } from "../theme/shadows";
import { radius, spacing } from "../theme/spacing";
import { AnimalCage } from "./AnimalCage";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { StatusChip } from "./StatusChip";

type RescueModalProps = {
  visible: boolean;
  animalName: string;
  animalImage?: ImageSourcePropType;
  nextAnimalName?: string;
  nextAnimalImage?: ImageSourcePropType;
  nextTargetImage?: ImageSourcePropType;
  nextTargetTitle?: string;
  nextTargetSteps?: number;
  onShareAnimal: () => void;
  onViewAnimals: () => void;
  onNextRescue: () => void;
};

const BURST_COUNT = 8;
const RELEASE_DELAY = 420;

/**
 * The strongest celebration in the app: the cage crossfades into a sanctuary
 * stage, one short sparkle burst plays, and the rescue result is stated before
 * the next target. Everything is one-shot and Reduce Motion aware.
 */
export function RescueModal({
  animalImage,
  animalName,
  nextAnimalImage,
  nextAnimalName,
  nextTargetImage,
  nextTargetSteps,
  nextTargetTitle,
  onNextRescue,
  onShareAnimal,
  onViewAnimals,
  visible
}: RescueModalProps) {
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { formatNumber: formatLocalizedNumber, speechLocale, t } = useLanguage();
  const {
    defaultUnlockAudioEnabled,
    isLoading: isUnlockAudioLoading,
    unlockAudioEnabled
  } = useUnlockAudioSettings();
  const shouldPlayUnlockAudio = isUnlockAudioLoading
    ? defaultUnlockAudioEnabled
    : unlockAudioEnabled;
  const unlockSoundRef = useRef<UnlockChimeSound | null>(null);

  const backdrop = useRef(new Animated.Value(0)).current;
  const cardEntry = useRef(new Animated.Value(0)).current;
  const release = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const [released, setReleased] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const burstSeeds = useMemo(
    () =>
      Array.from({ length: BURST_COUNT }, (_, index) => ({
        angle: (index / BURST_COUNT) * Math.PI * 2,
        distance: 64 + (index % 3) * 18,
        size: 8 + (index % 3) * 3
      })),
    []
  );

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      cardEntry.setValue(0);
      release.setValue(0);
      burst.setValue(0);
      setReleased(false);
      setIsSettled(false);
      return undefined;
    }

    if (reduceMotion) {
      backdrop.setValue(1);
      cardEntry.setValue(1);
      release.setValue(1);
      setReleased(true);
      setIsSettled(true);
      return undefined;
    }

    const releaseTimer = setTimeout(() => setReleased(true), RELEASE_DELAY);
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(backdrop, {
          duration: duration.state,
          easing: easing.standard,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(cardEntry, {
          duration: duration.enter,
          easing: easing.decelerate,
          toValue: 1,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(release, {
          duration: duration.celebrate,
          easing: easing.settle,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(burst, {
          duration: 900,
          easing: easing.decelerate,
          toValue: 1,
          useNativeDriver: true
        })
      ])
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setIsSettled(true);
      }
    });

    return () => {
      clearTimeout(releaseTimer);
      animation.stop();
    };
  }, [backdrop, burst, cardEntry, reduceMotion, release, visible]);

  useEffect(() => {
    if (!visible || !animalName || !shouldPlayUnlockAudio) {
      Speech.stop();
      unlockSoundRef.current?.unloadAsync().catch(() => undefined);
      unlockSoundRef.current = null;
      return undefined;
    }

    let cancelled = false;
    const speechDelay = setTimeout(() => {
      if (cancelled) {
        return;
      }

      Speech.speak(t("speech.rescueUnlocked", { animal: animalName }), {
        language: speechLocale,
        pitch: 1.04,
        rate: 0.9,
        volume: 0.88
      });
    }, 850);

    async function playRescueChime() {
      try {
        const sound = await playUnlockChime(0.42);

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        unlockSoundRef.current = sound;
      } catch {
        // Audio is celebratory only; the rescue flow continues regardless.
      }
    }

    void playRescueChime();

    return () => {
      cancelled = true;
      clearTimeout(speechDelay);
      Speech.stop();
      unlockSoundRef.current?.unloadAsync().catch(() => undefined);
      unlockSoundRef.current = null;
    };
  }, [animalName, shouldPlayUnlockAudio, speechLocale, t, visible]);

  if (!visible) {
    return null;
  }

  const cardTransform = reduceMotion
    ? undefined
    : [
        {
          translateY: cardEntry.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0]
          })
        },
        {
          scale: cardEntry.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1]
          })
        }
      ];

  const stageIsCompact = height < 760;

  return (
    <Modal
      animationType="none"
      onRequestClose={isSettled ? onNextRescue : undefined}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdrop }]}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.card,
              { opacity: reduceMotion ? 1 : cardEntry, transform: cardTransform }
            ]}
          >
            {/* ── Cage crossfades into sanctuary ── */}
            <View
              style={[styles.stage, stageIsCompact && styles.stageCompact]}
            >
              {animalImage ? (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        opacity: reduceMotion
                          ? 0
                          : release.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 0]
                            })
                      }
                    ]}
                  >
                    <AnimalCage
                      animalImage={animalImage}
                      careState="ready_to_rescue"
                      compact
                      progress={1}
                    />
                  </Animated.View>
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      !released && !reduceMotion ? styles.hidden : null
                    ]}
                  >
                    <AnimalCage
                      animalImage={animalImage}
                      careState="ready_to_rescue"
                      compact
                      isRescued
                      progress={1}
                    />
                  </View>
                </>
              ) : null}

              {!reduceMotion
                ? burstSeeds.map((seed, index) => (
                    <Animated.View
                      key={`burst-${index}`}
                      pointerEvents="none"
                      style={[
                        styles.spark,
                        {
                          backgroundColor:
                            index % 2 === 0
                              ? theme.colors.rewardAmber
                              : theme.colors.brandGreen,
                          height: seed.size,
                          opacity: burst.interpolate({
                            inputRange: [0, 0.2, 1],
                            outputRange: [0, 0.9, 0]
                          }),
                          transform: [
                            {
                              translateX: burst.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, Math.cos(seed.angle) * seed.distance]
                              })
                            },
                            {
                              translateY: burst.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, Math.sin(seed.angle) * seed.distance]
                              })
                            }
                          ],
                          width: seed.size
                        }
                      ]}
                    />
                  ))
                : null}
            </View>

            {/* ── Result first ── */}
            <View style={styles.copy}>
              <StatusChip
                icon="sparkles"
                label={t("rescueModal.animalRescued")}
                tone="safe"
              />
              <AppText align="center" role="largeTitle">
                {t("rescueModal.isFree", { animal: animalName })}
              </AppText>
              <AppText align="center" role="supportive" tone="secondary">
                {t("rescueModal.subtitle", { animal: animalName })}
              </AppText>
            </View>

            {/* ── Then the next target ── */}
            {nextAnimalName ? (
              <View style={styles.nextPanel}>
                <View style={styles.nextHeader}>
                  <StatusChip icon="flag" label={t("rescueModal.upNext")} tone="steps" />
                </View>
                <View style={styles.nextRow}>
                  {nextAnimalImage ? (
                    <Image
                      contentFit="contain"
                      source={nextAnimalImage}
                      style={styles.nextThumb}
                    />
                  ) : null}
                  <View style={styles.nextCopy}>
                    <AppText numberOfLines={1} role="cardTitle">
                      {nextAnimalName}
                    </AppText>
                    {nextTargetSteps !== undefined ? (
                      <AppText role="caption" tone="secondary">
                        {t("rescueModal.nextSteps", {
                          steps: formatLocalizedNumber(nextTargetSteps),
                          target: nextTargetTitle ?? t("rescueModal.firstReward")
                        })}
                      </AppText>
                    ) : null}
                  </View>
                  {nextTargetImage ? (
                    <Image
                      contentFit="contain"
                      source={nextTargetImage}
                      style={styles.nextReward}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <AppButton
                disabled={!isSettled}
                icon="arrow-forward"
                iconPosition="trailing"
                onPress={onNextRescue}
                title={t("rescueModal.nextRescue")}
                variant="primary"
              />
              <View style={styles.secondaryRow}>
                <AppButton
                  onPress={onViewAnimals}
                  size="compact"
                  style={styles.secondaryAction}
                  title={t("rescueModal.myAnimals")}
                  variant="secondary"
                />
                <AppButton
                  icon="share-outline"
                  onPress={onShareAnimal}
                  size="compact"
                  style={styles.secondaryAction}
                  title={t("common.share")}
                  variant="ghost"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    actions: {
      gap: spacing.s8,
      width: "100%"
    },
    backdrop: {
      backgroundColor: colors.scrim,
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderCurve: "continuous",
      borderRadius: radius.sheet,
      borderWidth: isDark ? 1 : 0,
      gap: spacing.s16,
      maxWidth: 440,
      padding: spacing.s20,
      width: "100%",
      ...elevation("sheet", isDark, colors.shadowColor)
    },
    copy: {
      alignItems: "center",
      gap: spacing.s8
    },
    hidden: {
      opacity: 0
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextHeader: {
      flexDirection: "row"
    },
    nextPanel: {
      backgroundColor: colors.surfaceBlue,
      borderCurve: "continuous",
      borderRadius: radius.control,
      gap: spacing.s8,
      padding: spacing.s12,
      width: "100%"
    },
    nextReward: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: radius.chip,
      height: 44,
      width: 44
    },
    nextRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    nextThumb: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: radius.chip,
      height: 48,
      width: 48
    },
    root: {
      flex: 1
    },
    scrollContent: {
      alignItems: "center",
      flexGrow: 1,
      justifyContent: "center",
      padding: spacing.s20
    },
    secondaryAction: {
      flex: 1
    },
    secondaryRow: {
      flexDirection: "row",
      gap: spacing.s8
    },
    spark: {
      borderRadius: radius.round,
      position: "absolute"
    },
    stage: {
      aspectRatio: 1,
      borderCurve: "continuous",
      borderRadius: radius.card,
      overflow: "hidden",
      width: "100%"
    },
    stageCompact: {
      alignSelf: "center",
      maxWidth: 250
    }
  });
}
