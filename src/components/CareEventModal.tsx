import { Image } from "expo-image";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
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
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { StatusChip } from "./StatusChip";

type CareEventModalProps = {
  visible: boolean;
  animalName: string;
  label: string;
  title: string;
  rewardImage: ImageSourcePropType;
  rewardIndex: number;
  nextTargetLabel?: string;
  nextTargetSteps?: number;
  nextTargetImage?: ImageSourcePropType;
  onDismiss: () => void;
};

/**
 * Reward moment. A restrained scrim, one scale-and-settle on the reward object,
 * and an explicit Continue action. No particle storms, no strobing.
 */
export function CareEventModal({
  animalName,
  label,
  nextTargetImage,
  nextTargetLabel,
  nextTargetSteps,
  onDismiss,
  rewardImage,
  rewardIndex,
  title,
  visible
}: CareEventModalProps) {
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

  /* Presented as a bottom sheet on short devices, a centered card otherwise. */
  const asSheet = height < 720;

  const backdrop = useRef(new Animated.Value(0)).current;
  const cardEntry = useRef(new Animated.Value(0)).current;
  const rewardSettle = useRef(new Animated.Value(0)).current;
  const unlockSoundRef = useRef<UnlockChimeSound | null>(null);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      cardEntry.setValue(0);
      rewardSettle.setValue(0);
      setIsSettled(false);
      return undefined;
    }

    if (reduceMotion) {
      backdrop.setValue(1);
      cardEntry.setValue(1);
      rewardSettle.setValue(1);
      setIsSettled(true);
      return undefined;
    }

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
      Animated.timing(rewardSettle, {
        duration: duration.celebrate,
        easing: easing.settle,
        toValue: 1,
        useNativeDriver: true
      })
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setIsSettled(true);
      }
    });

    return () => animation.stop();
  }, [backdrop, cardEntry, reduceMotion, rewardSettle, visible]);

  useEffect(() => {
    if (!shouldPlayUnlockAudio || !visible) {
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

      Speech.speak(
        t("speech.careUnlocked", { animal: animalName, reward: title }),
        { language: speechLocale, pitch: 1.02, rate: 0.92, volume: 0.84 }
      );
    }, 620);

    async function playRewardChime() {
      try {
        const sound = await playUnlockChime(0.36);

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        unlockSoundRef.current = sound;
      } catch {
        // Reward cards should still appear if celebratory audio cannot play.
      }
    }

    void playRewardChime();

    return () => {
      cancelled = true;
      clearTimeout(speechDelay);
      Speech.stop();
      unlockSoundRef.current?.unloadAsync().catch(() => undefined);
      unlockSoundRef.current = null;
    };
  }, [animalName, shouldPlayUnlockAudio, speechLocale, t, title, visible]);

  const handleDismiss = () => {
    if (!isSettled) {
      return;
    }

    onDismiss();
  };

  const cardTransform = reduceMotion
    ? undefined
    : [
        {
          translateY: cardEntry.interpolate({
            inputRange: [0, 1],
            outputRange: [asSheet ? 48 : 20, 0]
          })
        },
        {
          scale: cardEntry.interpolate({
            inputRange: [0, 1],
            outputRange: [asSheet ? 1 : 0.96, 1]
          })
        }
      ];

  const rewardTransform = reduceMotion
    ? undefined
    : [
        {
          scale: rewardSettle.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0.6, 1.06, 1]
          })
        }
      ];

  return (
    <Modal
      animationType="none"
      onRequestClose={handleDismiss}
      transparent
      visible={visible}
    >
      <View style={[styles.root, asSheet && styles.rootSheet]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdrop }]}
        />
        <Pressable
          accessibilityLabel={t("careEvent.tapContinue")}
          accessibilityRole="button"
          onPress={handleDismiss}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            asSheet ? styles.cardSheet : styles.cardCentered,
            { opacity: reduceMotion ? 1 : cardEntry, transform: cardTransform }
          ]}
        >
          <Animated.View style={[styles.rewardStage, { transform: rewardTransform }]}>
            <Image
              contentFit="contain"
              source={rewardImage}
              style={styles.rewardImage}
            />
          </Animated.View>

          <View style={styles.copy}>
            <StatusChip
              icon="checkmark-circle"
              label={t("careEvent.rewardUnlocked", { number: rewardIndex + 1 })}
              tone="safe"
            />
            <AppText align="center" role="sectionTitle">
              {title}
            </AppText>
            <AppText align="center" role="supportive" tone="secondary">
              {t("careEvent.earned", { animal: animalName, reward: label })}
            </AppText>
          </View>

          {nextTargetLabel && nextTargetSteps !== undefined ? (
            <View style={styles.nextRow}>
              <View style={styles.nextThumb}>
                {nextTargetImage ? (
                  <Image
                    contentFit="contain"
                    source={nextTargetImage}
                    style={styles.nextImage}
                  />
                ) : null}
              </View>
              <View style={styles.nextCopy}>
                <AppText role="label" tone="blue">
                  {t("careEvent.nextGoal")}
                </AppText>
                <AppText numberOfLines={1} role="cardTitle">
                  {nextTargetLabel}
                </AppText>
              </View>
              <AppText role="metric" style={styles.nextSteps} tone="blue">
                {formatLocalizedNumber(nextTargetSteps)}
              </AppText>
            </View>
          ) : null}

          <AppButton
            disabled={!isSettled}
            icon="arrow-forward"
            iconPosition="trailing"
            onPress={handleDismiss}
            style={styles.action}
            title={t("common.continue")}
            variant="primary"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    action: {
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
      borderWidth: isDark ? 1 : 0,
      gap: spacing.s16,
      maxWidth: 440,
      padding: spacing.s24,
      width: "100%",
      ...elevation("sheet", isDark, colors.shadowColor)
    },
    cardCentered: {
      borderRadius: radius.sheet
    },
    cardSheet: {
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingBottom: spacing.s32
    },
    copy: {
      alignItems: "center",
      gap: spacing.s8
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextImage: {
      height: 40,
      width: 40
    },
    nextRow: {
      alignItems: "center",
      backgroundColor: colors.surfaceBlue,
      borderCurve: "continuous",
      borderRadius: radius.control,
      flexDirection: "row",
      gap: spacing.s12,
      padding: spacing.s12,
      width: "100%"
    },
    nextSteps: {
      fontSize: 18,
      lineHeight: 23
    },
    nextThumb: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderRadius: radius.chip,
      height: 48,
      justifyContent: "center",
      overflow: "hidden",
      width: 48
    },
    rewardImage: {
      height: 104,
      width: 104
    },
    rewardStage: {
      alignItems: "center",
      backgroundColor: colors.surfaceAmber,
      borderRadius: radius.round,
      height: 136,
      justifyContent: "center",
      width: 136
    },
    root: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: spacing.s20
    },
    rootSheet: {
      justifyContent: "flex-end",
      padding: 0
    }
  });
}
