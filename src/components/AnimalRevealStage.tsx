import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType
} from "react-native";

import { jailSprites } from "../data/assets";
import { type AppColors, useAppTheme } from "../theme/colors";
import { useReduceMotion } from "../theme/motion";
import { radius, spacing } from "../theme/spacing";

export type AnimalRevealStageProps = {
  happyAnimalImage?: ImageSourcePropType;
  sadAnimalImage?: ImageSourcePropType;
  animalName: string;
  compact?: boolean;
  onSettled?: () => void;
};

type SparkleConfig = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  color: string;
  icon: "sparkles" | "star";
  delay: number;
};

const SPARKLE_CONFIGS: SparkleConfig[] = [
  { left: "18%", top: "34%", size: 16, color: "#F59E0B", icon: "sparkles", delay: 0 },
  { left: "74%", top: "30%", size: 18, color: "#10B981", icon: "sparkles", delay: 0.08 },
  { left: "12%", top: "52%", size: 13, color: "#34D399", icon: "star", delay: 0.16 },
  { left: "80%", top: "48%", size: 15, color: "#FBBF24", icon: "sparkles", delay: 0.22 },
  { left: "26%", top: "22%", size: 13, color: "#F59E0B", icon: "star", delay: 0.3 },
  { left: "68%", top: "20%", size: 14, color: "#10B981", icon: "star", delay: 0.36 },
  { left: "50%", top: "16%", size: 17, color: "#FCD34D", icon: "sparkles", delay: 0.24 }
];

/**
 * AnimalRevealStage
 *
 * A celebratory animal unlock animation that transforms the trapped animal
 * into its cute, joyful 3D happy form.
 *
 * Choreography:
 * 1. Locked Suspense (0-350ms): Sad animal sits trapped behind cage bars; lock pulses gently.
 * 2. The Breakout (350-700ms): Lock pops open with golden flash & haptic tap;
 *    gates swing open outward, lid ascends, and cage dissolves.
 * 3. Hero Leap & Reveal (650-1350ms): Soft sanctuary halo expands; sad animal crossfades
 *    into happy 3D animal mid-air with Disney-style squash & stretch; soft sparkles float upward;
 *    lands with gentle spring bounce and success haptic.
 * 4. Settle & Idle Alive (>1350ms): Subtle breathing float loop; interactive tap-to-cheer
 *    with responsive spring bounce and tactile feedback.
 *
 * Avoids visual clutter: all effects are contained within the stage boundaries.
 * Fully honors system Reduce Motion.
 */
export function AnimalRevealStage({
  animalName,
  compact = false,
  happyAnimalImage,
  onSettled,
  sadAnimalImage
}: AnimalRevealStageProps) {
  const theme = useAppTheme();
  const reduceMotion = useReduceMotion();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, compact),
    [compact, theme.colors, theme.isDark]
  );

  // Animation values
  const lockPulse = useRef(new Animated.Value(1)).current;
  const breakoutAnim = useRef(new Animated.Value(0)).current;
  const leapAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const safeBadgeAnim = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef(new Animated.Value(0)).current;
  const tapAnim = useRef(new Animated.Value(0)).current;

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Primary image fallback
  const resolvedHappyImage = happyAnimalImage ?? sadAnimalImage;
  const resolvedSadImage = sadAnimalImage ?? happyAnimalImage;

  // Main reveal sequence
  useEffect(() => {
    if (reduceMotion) {
      breakoutAnim.setValue(1);
      leapAnim.setValue(1);
      sparkleAnim.setValue(1);
      safeBadgeAnim.setValue(1);
      setIsUnlocked(true);
      setIsSettled(true);
      onSettled?.();
      return undefined;
    }

    let isCancelled = false;

    // Phase 1: Lock pulse building suspense
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lockPulse, {
          toValue: 1.09,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(lockPulse, {
          toValue: 1,
          duration: 170,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ]),
      { iterations: 1 }
    );
    pulseLoop.start();

    // Trigger lock spring & breakout after suspense window (350ms)
    const unlockTimer = setTimeout(() => {
      if (isCancelled) return;
      setIsUnlocked(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

      // Phase 2 & 3: Breakout + Hero Leap + Sparkles
      Animated.parallel([
        // Breakout: cage gates swing open & dissolve
        Animated.timing(breakoutAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.bezier(0.2, 0.8, 0.25, 1),
          useNativeDriver: true
        }),
        // Hero leap: starts slightly offset for physical continuity
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(leapAnim, {
            toValue: 1,
            duration: 720,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true
          })
        ]),
        // Sparkle float & twinkle
        Animated.sequence([
          Animated.delay(260),
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          })
        ]),
        // Safe badge pop in
        Animated.sequence([
          Animated.delay(500),
          Animated.spring(safeBadgeAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true
          })
        ])
      ]).start(({ finished }) => {
        if (finished && !isCancelled) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => undefined);
          setIsSettled(true);
          onSettled?.();
        }
      });
    }, 360);

    return () => {
      isCancelled = true;
      clearTimeout(unlockTimer);
      pulseLoop.stop();
      breakoutAnim.stopAnimation();
      leapAnim.stopAnimation();
      sparkleAnim.stopAnimation();
      safeBadgeAnim.stopAnimation();
    };
  }, [
    breakoutAnim,
    leapAnim,
    lockPulse,
    onSettled,
    reduceMotion,
    safeBadgeAnim,
    sparkleAnim
  ]);

  // Phase 4: Gentle breathing float idle loop once settled
  useEffect(() => {
    if (!isSettled || reduceMotion) {
      return undefined;
    }

    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(idleAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    idleLoop.start();

    return () => idleLoop.stop();
  }, [idleAnim, isSettled, reduceMotion]);

  // Interactive tap-to-cheer
  const handleTapAnimal = useCallback(() => {
    if (!isSettled || reduceMotion) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    tapAnim.setValue(0);
    Animated.sequence([
      Animated.timing(tapAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true
      }),
      Animated.timing(tapAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [isSettled, reduceMotion, tapAnim]);

  // Interpolations for Breakout
  const gateLeftTranslateX = breakoutAnim.interpolate({
    inputRange: [0, 0.8],
    outputRange: [0, compact ? -50 : -68],
    extrapolate: "clamp"
  });
  const gateLeftRotate = breakoutAnim.interpolate({
    inputRange: [0, 0.8],
    outputRange: ["0deg", "-15deg"],
    extrapolate: "clamp"
  });
  const gateRightTranslateX = breakoutAnim.interpolate({
    inputRange: [0, 0.8],
    outputRange: [0, compact ? 50 : 68],
    extrapolate: "clamp"
  });
  const gateRightRotate = breakoutAnim.interpolate({
    inputRange: [0, 0.8],
    outputRange: ["0deg", "15deg"],
    extrapolate: "clamp"
  });
  const cageBarsOpacity = breakoutAnim.interpolate({
    inputRange: [0, 0.6, 0.85],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp"
  });
  const cageLidTranslateY = breakoutAnim.interpolate({
    inputRange: [0, 0.7],
    outputRange: [0, compact ? -28 : -38],
    extrapolate: "clamp"
  });
  const cageLidOpacity = breakoutAnim.interpolate({
    inputRange: [0, 0.5, 0.8],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp"
  });
  const lockOpacity = breakoutAnim.interpolate({
    inputRange: [0, 0.15, 0.45],
    outputRange: [1, 1, 0],
    extrapolate: "clamp"
  });
  const lockTranslateY = breakoutAnim.interpolate({
    inputRange: [0, 0.45],
    outputRange: [0, -18],
    extrapolate: "clamp"
  });
  const lockScale = breakoutAnim.interpolate({
    inputRange: [0, 0.15, 0.45],
    outputRange: [1, 1.35, 1.1],
    extrapolate: "clamp"
  });

  // Sanctuary Halo expansion
  const haloScale = breakoutAnim.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0.35, 0.5, 1.08, 1],
    extrapolate: "clamp"
  });
  const haloOpacity = breakoutAnim.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0, 0.4, 0.85, 0.65],
    extrapolate: "clamp"
  });

  // Hero Leap Squash & Stretch
  // 0 -> 0.15: squash down (scaleX 1.14, scaleY 0.86, translateY +6)
  // 0.15 -> 0.50: rocket leap (scaleX 0.90, scaleY 1.18, translateY -36)
  // 0.50 -> 0.80: apex pop & wiggle (scaleX 1.06, scaleY 0.96, translateY -6)
  // 0.80 -> 1.00: landing settle (scaleX 1.0, scaleY 1.0, translateY 0)
  const leapTranslateY = leapAnim.interpolate({
    inputRange: [0, 0.15, 0.5, 0.78, 1],
    outputRange: [0, compact ? 5 : 7, compact ? -26 : -36, -3, 0],
    extrapolate: "clamp"
  });
  const leapScaleX = leapAnim.interpolate({
    inputRange: [0, 0.15, 0.5, 0.78, 1],
    outputRange: [1, 1.14, 0.9, 1.06, 1],
    extrapolate: "clamp"
  });
  const leapScaleY = leapAnim.interpolate({
    inputRange: [0, 0.15, 0.5, 0.78, 1],
    outputRange: [1, 0.86, 1.18, 0.95, 1],
    extrapolate: "clamp"
  });
  const leapRotate = leapAnim.interpolate({
    inputRange: [0, 0.3, 0.55, 0.8, 1],
    outputRange: ["0deg", "-2.5deg", "2deg", "-0.8deg", "0deg"],
    extrapolate: "clamp"
  });

  // Sad to Happy crossfade at peak of leap (around 0.45 - 0.55)
  const sadOpacity = leapAnim.interpolate({
    inputRange: [0, 0.4, 0.55],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp"
  });
  const happyOpacity = leapAnim.interpolate({
    inputRange: [0, 0.42, 0.58, 1],
    outputRange: [0, 0.2, 1, 1],
    extrapolate: "clamp"
  });

  // Idle float & tap hop
  const idleTranslateY = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4.5]
  });
  const tapTranslateY = tapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -11]
  });
  const tapScale = tapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12]
  });

  // Background gradient: transitions from cage stage to sanctuary stage
  const cageBgOpacity = breakoutAnim.interpolate({
    inputRange: [0, 0.7],
    outputRange: [1, 0],
    extrapolate: "clamp"
  });

  return (
    <View
      accessibilityLabel={`${animalName} reveal`}
      style={styles.root}
    >
      {/* ── Trapped Cage Background ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: cageBgOpacity }]}
      >
        <LinearGradient
          colors={[
            theme.colors.cageStage,
            theme.isDark ? theme.colors.surfaceSecondary : "#EFF8FE"
          ]}
          end={{ x: 0.8, y: 1 }}
          start={{ x: 0.2, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── Sanctuary Stage Background ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: breakoutAnim }]}
      >
        <LinearGradient
          colors={[theme.colors.sanctuaryStage, theme.colors.brandGreenTint]}
          end={{ x: 0.8, y: 1 }}
          start={{ x: 0.2, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── Expanding Sanctuary Radial Halo ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sanctuaryHalo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }]
          }
        ]}
      />

      {/* ── Cage Back Shell ── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.shellLayer, { opacity: cageBarsOpacity }]}
      >
        <Image
          contentFit="contain"
          source={jailSprites.openJail}
          style={styles.fillImage}
        />
      </Animated.View>

      {/* ── Base Pedestal Platform ── */}
      <View pointerEvents="none" style={styles.platformLayer}>
        <Image
          contentFit="contain"
          source={jailSprites.platform}
          style={styles.fillImage}
        />
      </View>

      {/* ── Animal Hero (Sad -> Happy with Leap & Tap Bounce) ── */}
      <Animated.View
        style={[
          styles.animalContainer,
          {
            transform: [
              { translateY: leapTranslateY },
              { translateY: idleTranslateY },
              { translateY: tapTranslateY },
              { scaleX: leapScaleX },
              { scaleY: leapScaleY },
              { scale: tapScale },
              { rotate: leapRotate }
            ]
          }
        ]}
      >
        <Pressable
          accessibilityHint="Tap to cheer"
          accessibilityRole="button"
          onPress={handleTapAnimal}
          style={styles.fillImage}
        >
          {/* Sad Trapped Animal (fades out during leap) */}
          {resolvedSadImage ? (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { opacity: reduceMotion ? 0 : sadOpacity }
              ]}
            >
              <Image
                contentFit="contain"
                source={resolvedSadImage}
                style={styles.fillImage}
              />
            </Animated.View>
          ) : null}

          {/* Happy Rescued Animal (revealed & bounces with joy) */}
          {resolvedHappyImage ? (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { opacity: reduceMotion ? 1 : happyOpacity }
              ]}
            >
              <Image
                contentFit="contain"
                source={resolvedHappyImage}
                style={styles.fillImage}
              />
            </Animated.View>
          ) : null}
        </Pressable>
      </Animated.View>

      {/* ── Front Cage Doors (Swing Wide Open & Dissolve) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.gateHalf,
          styles.gateLeft,
          {
            opacity: cageBarsOpacity,
            transform: [
              { translateX: gateLeftTranslateX },
              { rotate: gateLeftRotate }
            ]
          }
        ]}
      >
        <Image
          contentFit="contain"
          source={jailSprites.gate}
          style={styles.gateImageLeft}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.gateHalf,
          styles.gateRight,
          {
            opacity: cageBarsOpacity,
            transform: [
              { translateX: gateRightTranslateX },
              { rotate: gateRightRotate }
            ]
          }
        ]}
      >
        <Image
          contentFit="contain"
          source={jailSprites.gate}
          style={styles.gateImageRight}
        />
      </Animated.View>

      {/* ── Cage Roof Lid (Ascends Up & Fades) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.topLayer,
          {
            opacity: cageLidOpacity,
            transform: [{ translateY: cageLidTranslateY }]
          }
        ]}
      >
        <Image
          contentFit="contain"
          source={jailSprites.top}
          style={styles.fillImage}
        />
      </Animated.View>

      {/* ── Contained Delicate Floating Sparkles ── */}
      {!reduceMotion
        ? SPARKLE_CONFIGS.map((sparkle, index) => {
            const sparkleDelay = sparkle.delay;
            const sparkleOpacity = sparkleAnim.interpolate({
              inputRange: [
                0,
                sparkleDelay,
                Math.min(1, sparkleDelay + 0.25),
                Math.min(1, sparkleDelay + 0.55),
                1
              ],
              outputRange: [0, 0, 1, 0.8, 0],
              extrapolate: "clamp"
            });
            const sparkleTranslateY = sparkleAnim.interpolate({
              inputRange: [0, sparkleDelay, 1],
              outputRange: [0, 0, -32 - (index % 3) * 6],
              extrapolate: "clamp"
            });
            const sparkleScale = sparkleAnim.interpolate({
              inputRange: [
                0,
                sparkleDelay,
                Math.min(1, sparkleDelay + 0.22),
                Math.min(1, sparkleDelay + 0.55),
                1
              ],
              outputRange: [0.3, 0.3, 1.25, 0.9, 0.4],
              extrapolate: "clamp"
            });

            return (
              <Animated.View
                key={`sparkle-${index}`}
                pointerEvents="none"
                style={[
                  styles.sparkleItem,
                  {
                    left: sparkle.left,
                    opacity: sparkleOpacity,
                    top: sparkle.top,
                    transform: [
                      { translateY: sparkleTranslateY },
                      { scale: sparkleScale }
                    ]
                  }
                ]}
              >
                <Ionicons
                  color={sparkle.color}
                  name={sparkle.icon}
                  size={sparkle.size}
                />
              </Animated.View>
            );
          })
        : null}

      {/* ── Top-Right Lock Badge (Pops open and dissolves) ── */}
      {!reduceMotion && !isSettled ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lockBadge,
            isUnlocked && styles.lockBadgeUnlocked,
            {
              opacity: lockOpacity,
              transform: [
                { scale: isUnlocked ? lockScale : lockPulse },
                { translateY: lockTranslateY }
              ]
            }
          ]}
        >
          <Ionicons
            color="#FFFFFF"
            name={isUnlocked ? "lock-open" : "lock-closed"}
            size={compact ? 16 : 20}
          />
        </Animated.View>
      ) : null}

      {/* ── Top-Right Safe Badge (Sanctuary Shield after rescue) ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.safeBadge,
          {
            opacity: reduceMotion ? 1 : safeBadgeAnim,
            transform: [
              {
                scale: reduceMotion
                  ? 1
                  : safeBadgeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1]
                    })
              }
            ]
          }
        ]}
      >
        <Ionicons
          color={theme.colors.brandGreenInk}
          name="shield-checkmark"
          size={compact ? 16 : 20}
        />
      </Animated.View>
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean, compact: boolean) {
  return StyleSheet.create({
    animalContainer: {
      bottom: compact ? "17%" : "18%",
      height: compact ? "58%" : "56%",
      position: "absolute",
      width: compact ? "58%" : "56%",
      zIndex: 5
    },
    fillImage: {
      height: "100%",
      width: "100%"
    },
    gateHalf: {
      height: "52%",
      overflow: "hidden",
      position: "absolute",
      top: "26%",
      width: "35%",
      zIndex: 6
    },
    gateImageLeft: {
      height: "100%",
      width: "200%"
    },
    gateImageRight: {
      height: "100%",
      left: "-100%",
      position: "absolute",
      width: "200%"
    },
    gateLeft: {
      left: "15%"
    },
    gateRight: {
      right: "15%"
    },
    lockBadge: {
      alignItems: "center",
      backgroundColor: "rgba(18, 31, 45, 0.82)",
      borderColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: radius.round,
      borderWidth: 1.5,
      height: compact ? 30 : 38,
      justifyContent: "center",
      position: "absolute",
      right: spacing.s12,
      top: spacing.s12,
      width: compact ? 30 : 38,
      zIndex: 12
    },
    lockBadgeUnlocked: {
      backgroundColor: colors.rewardAmber,
      borderColor: "#FFFFFF"
    },
    platformLayer: {
      bottom: "-1%",
      height: "30%",
      position: "absolute",
      width: "96%",
      zIndex: 1
    },
    root: {
      alignItems: "center",
      aspectRatio: 1,
      borderCurve: "continuous",
      borderRadius: radius.card,
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      width: "100%"
    },
    safeBadge: {
      alignItems: "center",
      backgroundColor: colors.brandGreen,
      borderRadius: radius.round,
      height: compact ? 30 : 38,
      justifyContent: "center",
      position: "absolute",
      right: spacing.s12,
      top: spacing.s12,
      width: compact ? 30 : 38,
      zIndex: 12
    },
    sanctuaryHalo: {
      backgroundColor: isDark
        ? "rgba(69, 209, 143, 0.2)"
        : "rgba(45, 190, 114, 0.24)",
      borderColor: isDark
        ? "rgba(255, 215, 0, 0.18)"
        : "rgba(255, 193, 7, 0.28)",
      borderRadius: radius.round,
      borderWidth: 1.5,
      height: "72%",
      position: "absolute",
      width: "72%",
      zIndex: 2
    },
    shellLayer: {
      height: "64%",
      position: "absolute",
      top: "16%",
      width: "68%",
      zIndex: 2
    },
    sparkleItem: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      zIndex: 8
    },
    topLayer: {
      height: "22%",
      position: "absolute",
      top: "12%",
      width: "70%",
      zIndex: 7
    }
  });
}
