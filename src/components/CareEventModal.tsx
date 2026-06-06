import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from "react-native";

import {
  playUnlockChime,
  type UnlockChimeSound
} from "../features/audio/playUnlockChime";
import { useUnlockAudioSettings } from "../features/audio/useUnlockAudioSettings";
import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PARTICLE_COUNT = 36;

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

type IconParticleProps = {
  delay: number;
  drift: number;
  icon: ImageSourcePropType;
  size: number;
  x: number;
};

function IconParticle({ delay, drift, icon, size, x }: IconParticleProps) {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const timeout = setTimeout(() => {
      RNAnimated.timing(anim, {
        toValue: 1,
        duration: 1250 + (delay % 5) * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(SCREEN_H * 0.62)]
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift]
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 1, 0.86, 0]
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.35, 1, 0.58]
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-14deg", "18deg"]
  });

  return (
    <RNAnimated.View
      pointerEvents="none"
      style={{
        bottom: 18,
        left: x,
        opacity,
        position: "absolute",
        transform: [{ translateX }, { translateY }, { scale }, { rotate }],
        zIndex: 3
      }}
    >
      <Image contentFit="contain" source={icon} style={{ height: size, width: size }} />
    </RNAnimated.View>
  );
}

export function CareEventModal({
  visible,
  animalName,
  label,
  title,
  rewardImage,
  rewardIndex,
  nextTargetLabel,
  nextTargetSteps,
  nextTargetImage,
  onDismiss
}: CareEventModalProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const {
    formatNumber: formatLocalizedNumber,
    speechLocale,
    t
  } = useLanguage();
  const {
    defaultUnlockAudioEnabled,
    isLoading: isUnlockAudioLoading,
    unlockAudioEnabled
  } = useUnlockAudioSettings();
  const shouldPlayUnlockAudio = isUnlockAudioLoading
    ? defaultUnlockAudioEnabled
    : unlockAudioEnabled;

  const backdrop = useRef(new RNAnimated.Value(0)).current;
  const rewardScale = useRef(new RNAnimated.Value(0)).current;
  const rewardRotate = useRef(new RNAnimated.Value(0)).current;
  const textSlide = useRef(new RNAnimated.Value(24)).current;
  const textOpacity = useRef(new RNAnimated.Value(0)).current;
  const nextSlide = useRef(new RNAnimated.Value(30)).current;
  const nextOpacity = useRef(new RNAnimated.Value(0)).current;
  const glowPulse = useRef(new RNAnimated.Value(0)).current;
  const unlockSoundRef = useRef<UnlockChimeSound | null>(null);
  const iconParticles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const column = index % 12;
        const row = Math.floor(index / 12);

        return {
          delay: 90 + index * 32,
          drift: ((index * 37) % 90) - 45,
          size: 14 + ((index + row) % 5) * 3,
          x: (SCREEN_W / 13) * (column + 1) - 10 + row * 8
        };
      }),
    []
  );

  useEffect(() => {
    if (!visible) {
      [
        backdrop,
        rewardScale,
        rewardRotate,
        textSlide,
        textOpacity,
        nextSlide,
        nextOpacity,
        glowPulse
      ].forEach((value, index) =>
        value.setValue([0, 0, 0, 24, 0, 30, 0, 0][index])
      );
      return;
    }

    RNAnimated.sequence([
      RNAnimated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
      RNAnimated.parallel([
        RNAnimated.spring(rewardScale, {
          toValue: 1,
          friction: 4,
          tension: 190,
          useNativeDriver: true
        }),
        RNAnimated.timing(rewardRotate, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true
        })
      ]),
      RNAnimated.parallel([
        RNAnimated.spring(textSlide, {
          toValue: 0,
          friction: 7,
          tension: 120,
          useNativeDriver: true
        }),
        RNAnimated.timing(textOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true
        })
      ]),
      RNAnimated.delay(90),
      RNAnimated.parallel([
        RNAnimated.spring(nextSlide, {
          toValue: 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true
        }),
        RNAnimated.timing(nextOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true
        })
      ]),
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(glowPulse, {
            toValue: 1,
            duration: 680,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          RNAnimated.timing(glowPulse, {
            toValue: 0,
            duration: 680,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ]),
        { iterations: 3 }
      )
    ]).start();
  }, [
    visible,
    backdrop,
    glowPulse,
    nextOpacity,
    nextSlide,
    rewardRotate,
    rewardScale,
    textOpacity,
    textSlide
  ]);

  useEffect(() => {
    if (!shouldPlayUnlockAudio || !visible) {
      Speech.stop();
      unlockSoundRef.current?.unloadAsync().catch(() => undefined);
      unlockSoundRef.current = null;
      return;
    }

    let cancelled = false;
    const speechDelay = setTimeout(() => {
      if (cancelled) {
        return;
      }

      Speech.speak(
        t("speech.careUnlocked", {
          animal: animalName,
          reward: title
        }),
        {
          language: speechLocale,
          pitch: 1.02,
          rate: 0.92,
          volume: 0.84
        }
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
        // Target cards should still appear if celebratory audio cannot play.
      }
    }

    playRewardChime();

    return () => {
      cancelled = true;
      clearTimeout(speechDelay);
      Speech.stop();
      unlockSoundRef.current?.unloadAsync().catch(() => undefined);
      unlockSoundRef.current = null;
    };
  }, [
    animalName,
    shouldPlayUnlockAudio,
    speechLocale,
    t,
    title,
    visible
  ]);

  const rotate = rewardRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-18deg", "0deg"]
  });
  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });

  return (
    <Modal animationType="none" transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <RNAnimated.View style={[styles.backdrop, { opacity: backdrop }]} />
        {iconParticles.map((particle, index) => (
          <IconParticle
            key={`${rewardIndex}-${index}`}
            delay={particle.delay}
            drift={particle.drift}
            icon={rewardImage}
            size={particle.size}
            x={particle.x}
          />
        ))}
        <Pressable style={styles.card} onPress={() => {}}>
          <RNAnimated.View
            style={[
              styles.rewardGlowRing,
              { opacity: backdrop, transform: [{ scale: glowScale }] }
            ]}
          />
          <RNAnimated.View
            style={{
              alignItems: "center",
              transform: [{ scale: rewardScale }, { rotate }],
              zIndex: 2
            }}
          >
            <Image
              contentFit="contain"
              source={rewardImage}
              style={styles.rewardImage}
            />
          </RNAnimated.View>

          <RNAnimated.View
            style={{
              alignItems: "center",
              gap: spacing.xs,
              opacity: textOpacity,
              transform: [{ translateY: textSlide }]
            }}
          >
            <View style={styles.badge}>
              <Ionicons
                color={theme.colors.primary}
                name="checkmark-circle"
                size={16}
              />
              <Text style={styles.badgeText}>
                {t("careEvent.rewardUnlocked", { number: rewardIndex + 1 })}
              </Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {t("careEvent.earned", { animal: animalName, reward: label })}
            </Text>
          </RNAnimated.View>

          {nextTargetLabel && nextTargetSteps !== undefined ? (
            <RNAnimated.View
              style={[
                styles.nextPanel,
                {
                  opacity: nextOpacity,
                  transform: [{ translateY: nextSlide }]
                }
              ]}
            >
              <View style={styles.nextRow}>
                {nextTargetImage ? (
                  <Image
                    contentFit="contain"
                    source={nextTargetImage}
                    style={styles.nextImage}
                  />
                ) : (
                  <View style={styles.nextImageFallback}>
                    <Ionicons color="#096DD9" name="key" size={22} />
                  </View>
                )}
                <View style={styles.nextCopy}>
                  <Text style={styles.nextLabel}>{t("careEvent.nextGoal")}</Text>
                  <Text style={styles.nextTitle}>{nextTargetLabel}</Text>
                </View>
                <View style={styles.nextBadge}>
                  <Text style={styles.nextSteps}>
                    {formatLocalizedNumber(nextTargetSteps)}
                  </Text>
                  <Text style={styles.nextStepsUnit}>{t("common.steps")}</Text>
                </View>
              </View>
            </RNAnimated.View>
          ) : null}

          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>{t("careEvent.tapContinue")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(10,18,28,0.78)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0
    },
    badge: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary,
      borderRadius: 8,
      borderWidth: 1.5,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    badgeText: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      elevation: 20,
      gap: spacing.lg,
      margin: spacing.lg,
      maxWidth: 440,
      padding: spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
      width: "92%",
      zIndex: 10
    },
    dismissButton: {
      paddingVertical: spacing.sm
    },
    dismissText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    nextBadge: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "#EAF6FF",
      borderColor: isDark ? colors.border : "#48AEEF",
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextImage: {
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : "#B8E3FF",
      borderRadius: 8,
      borderWidth: 1,
      height: 52,
      width: 52
    },
    nextImageFallback: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: isDark ? colors.border : "#B8E3FF",
      borderRadius: 8,
      borderWidth: 1,
      height: 52,
      justifyContent: "center",
      width: 52
    },
    nextLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    nextPanel: {
      backgroundColor: isDark ? colors.surfaceElevated : "#EAF6FF",
      borderColor: isDark ? colors.border : "#48AEEF",
      borderRadius: 8,
      borderWidth: 1.5,
      padding: spacing.lg,
      width: "100%"
    },
    nextRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md
    },
    nextSteps: {
      color: "#096DD9",
      fontSize: 16,
      fontWeight: "900"
    },
    nextStepsUnit: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "700"
    },
    nextTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900"
    },
    overlay: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0
    },
    rewardGlowRing: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary,
      borderRadius: 78,
      borderWidth: 3,
      height: 144,
      position: "absolute",
      top: spacing.xl - 8,
      width: 144,
      zIndex: 1
    },
    rewardImage: {
      height: 132,
      width: 132
    },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 21,
      textAlign: "center"
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center"
    }
  });
}
