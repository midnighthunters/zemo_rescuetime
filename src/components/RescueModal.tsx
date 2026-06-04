import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType
} from "react-native";

import { jailSprites } from "../data/assets";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AppButton } from "./AppButton";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type RescueModalProps = {
  visible: boolean;
  animalName: string;
  animalImage?: ImageSourcePropType;
  nextAnimalName?: string;
  nextAnimalImage?: ImageSourcePropType;
  nextTargetSteps?: number;
  onViewAnimals: () => void;
  onNextRescue: () => void;
};

/** Burst particle — floats up from the bottom */
function Particle({ delay, color, x }: { delay: number; color: string; x: number }) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const timeout = setTimeout(() => {
      RNAnimated.loop(
        RNAnimated.timing(anim, {
          toValue: 1,
          duration: 1400 + Math.random() * 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(SCREEN_H * 0.45)] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.6] });

  return (
    <RNAnimated.View
      style={{
        position: "absolute",
        bottom: "15%",
        left: x,
        transform: [{ translateY }, { scale }],
        opacity
      }}
    >
      <Text style={{ fontSize: 18 }}>{color}</Text>
    </RNAnimated.View>
  );
}

export function RescueModal({
  visible,
  animalName,
  animalImage,
  nextAnimalName,
  nextAnimalImage,
  nextTargetSteps,
  onViewAnimals,
  onNextRescue
}: RescueModalProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);

  // --- Animation shared values (plain RN Animated for Modal compat) ---
  const phase = useRef(new RNAnimated.Value(0)).current; // 0→1 over entrance
  const gateOpen = useRef(new RNAnimated.Value(0)).current;
  const cageElevate = useRef(new RNAnimated.Value(0)).current;
  const happyReveal = useRef(new RNAnimated.Value(0)).current;
  const titleBounce = useRef(new RNAnimated.Value(0)).current;
  const nextReveal = useRef(new RNAnimated.Value(0)).current;
  const backdropAnim = useRef(new RNAnimated.Value(0)).current;
  const cardScale = useRef(new RNAnimated.Value(0.85)).current;
  const cardOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      // reset
      [phase, gateOpen, cageElevate, happyReveal, titleBounce, nextReveal, backdropAnim].forEach(
        (v) => v.setValue(0)
      );
      cardScale.setValue(0.85);
      cardOpacity.setValue(0);
      return;
    }

    RNAnimated.sequence([
      // 1. Backdrop + card entrance
      RNAnimated.parallel([
        RNAnimated.timing(backdropAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true
        }),
        RNAnimated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true
        }),
        RNAnimated.timing(cardOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true
        })
      ]),
      // 2. Cage elevates up (bounce)
      RNAnimated.spring(cageElevate, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true
      }),
      // 3. Gate swings open
      RNAnimated.timing(gateOpen, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true
      }),
      // 4. Happy image pops in
      RNAnimated.spring(happyReveal, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true
      }),
      // 5. Title bounces in
      RNAnimated.spring(titleBounce, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true
      }),
      // 6. Next target slides in
      RNAnimated.delay(200),
      RNAnimated.spring(nextReveal, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true
      })
    ]).start();
  }, [visible, backdropAnim, cardOpacity, cardScale, cageElevate, gateOpen, happyReveal, nextReveal, phase, titleBounce]);

  // Derived animated styles
  const backdropStyle = {
    opacity: backdropAnim
  };

  const cardStyle = {
    transform: [{ scale: cardScale }],
    opacity: cardOpacity
  };

  const cageTranslateY = cageElevate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18]
  });

  const gateRotate = gateOpen.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-110deg"]
  });

  const happyScale = happyReveal.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.15, 1]
  });

  const happyOpacity = happyReveal.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1]
  });

  const titleTranslateY = titleBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0]
  });

  const titleOpacity = titleBounce.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 1, 1]
  });

  const nextSlide = nextReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0]
  });

  const nextOpacity = nextReveal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1]
  });

  const CONFETTI = ["🎉", "⭐", "✨", "🌟", "💫", "🎊", "🦁", "🐾"];
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    emoji: CONFETTI[i % CONFETTI.length],
    x: (SCREEN_W / 13) * (i + 1) - 12,
    delay: i * 90
  }));

  return (
    <Modal animationType="none" transparent visible={visible}>
      <RNAnimated.View style={[styles.overlay, backdropStyle]}>
        {/* Confetti particles */}
        {particles.map((p, i) => (
          <Particle key={i} delay={p.delay} color={p.emoji} x={p.x} />
        ))}

        <RNAnimated.View style={[styles.card, cardStyle]}>
          {/* ─── Cage unlock stage ─── */}
          <RNAnimated.View
            style={[
              styles.cageStage,
              { transform: [{ translateY: cageTranslateY }] }
            ]}
          >
            {/* Platform base */}
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.cagePlatform}
            />

            {/* Back cage body */}
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.cageOpenJail}
            />

            {/* Animal image — fades to happy */}
            {animalImage ? (
              <RNAnimated.View
                style={[
                  styles.animalWrap,
                  { transform: [{ scale: happyScale }], opacity: happyOpacity }
                ]}
              >
                <Image
                  contentFit="contain"
                  source={animalImage}
                  style={styles.animalImage}
                />
              </RNAnimated.View>
            ) : null}

            {/* Front gate — rotates open (pivot left edge) */}
            <RNAnimated.View
              pointerEvents="none"
              style={[
                styles.cageGateWrap,
                {
                  transform: [
                    { translateX: -styles.cageGateImage.width / 2 },
                    { rotateY: gateRotate },
                    { translateX: styles.cageGateImage.width / 2 }
                  ]
                }
              ]}
            >
              <Image
                contentFit="contain"
                source={jailSprites.gate}
                style={styles.cageGateImage}
              />
            </RNAnimated.View>

            {/* Top lid */}
            <Image
              contentFit="contain"
              source={jailSprites.top}
              style={styles.cageTop}
            />
          </RNAnimated.View>

          {/* ─── Title ─── */}
          <RNAnimated.View
            style={{
              transform: [{ translateY: titleTranslateY }],
              opacity: titleOpacity,
              alignItems: "center",
              gap: spacing.xs
            }}
          >
            <View style={styles.rescuedBadge}>
              <Ionicons color={theme.colors.primary} name="sparkles" size={18} />
              <Text style={styles.rescuedBadgeText}>Animal Rescued!</Text>
            </View>
            <Text style={styles.title}>{animalName} is Free! 🎉</Text>
            <Text style={styles.subtitle}>
              Your steps unlocked the gate and gave {animalName} a safe home.
            </Text>
          </RNAnimated.View>

          {/* ─── Next rescue target ─── */}
          {nextAnimalName ? (
            <RNAnimated.View
              style={[
                styles.nextPanel,
                {
                  transform: [{ translateY: nextSlide }],
                  opacity: nextOpacity
                }
              ]}
            >
              <View style={styles.nextPanelLabel}>
                <Ionicons color="#096DD9" name="flag" size={14} />
                <Text style={styles.nextPanelLabelText}>Up Next</Text>
              </View>
              <View style={styles.nextRow}>
                {nextAnimalImage ? (
                  <Image
                    contentFit="contain"
                    source={nextAnimalImage}
                    style={styles.nextAnimalThumb}
                  />
                ) : null}
                <View style={styles.nextCopy}>
                  <Text style={styles.nextName}>{nextAnimalName}</Text>
                  {nextTargetSteps !== undefined ? (
                    <Text style={styles.nextSteps}>
                      {nextTargetSteps.toLocaleString()} steps to rescue
                    </Text>
                  ) : null}
                </View>
                <Ionicons color={theme.colors.muted} name="chevron-forward" size={22} />
              </View>
            </RNAnimated.View>
          ) : null}

          {/* ─── Actions ─── */}
          <View style={styles.buttonRow}>
            <AppButton
              icon="paw"
              onPress={onViewAnimals}
              title="My Animals"
              variant="secondary"
            />
            <AppButton
              icon="arrow-forward"
              onPress={onNextRescue}
              title="Next Rescue"
            />
          </View>
        </RNAnimated.View>
      </RNAnimated.View>
    </Modal>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    animalImage: {
      height: "100%",
      width: "100%"
    },
    animalWrap: {
      bottom: "22%",
      height: "44%",
      position: "absolute",
      width: "44%",
      zIndex: 4
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.sm,
      width: "100%"
    },
    cageGateImage: {
      height: "100%",
      left: "50%",
      position: "absolute",
      width: "50%"
    },
    cageGateWrap: {
      height: "54%",
      left: "-55%",
      position: "absolute",
      top: "25%",
      width: "140%",
      zIndex: 6
    },
    cageOpenJail: {
      height: "72%",
      left: "5%",
      position: "absolute",
      top: "14%",
      width: "90%",
      zIndex: 2
    },
    cagePlatform: {
      bottom: "-1%",
      height: "30%",
      position: "absolute",
      width: "96%",
      zIndex: 1
    },
    cageStage: {
      alignItems: "center",
      aspectRatio: 1.05,
      borderRadius: 12,
      justifyContent: "center",
      overflow: "hidden",
      width: "90%",
      backgroundColor: isDark ? "#102821" : "#CDEFFF",
      borderWidth: 2,
      borderColor: isDark ? colors.border : "#A8DFF2"
    },
    cageTop: {
      height: "31%",
      left: "5%",
      position: "absolute",
      top: "2%",
      width: "90%",
      zIndex: 8
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 24,
      gap: spacing.lg,
      margin: spacing.lg,
      maxWidth: 440,
      padding: spacing.xl,
      width: "92%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.38,
      shadowRadius: 32,
      elevation: 24
    },
    nextAnimalThumb: {
      borderRadius: 10,
      height: 52,
      width: 52,
      backgroundColor: isDark ? colors.surfaceSoft : "#E8F4FF"
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    nextName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900"
    },
    nextPanel: {
      backgroundColor: isDark ? colors.surfaceElevated : "#EAF6FF",
      borderColor: isDark ? colors.border : "#48AEEF",
      borderRadius: 14,
      borderWidth: 1.5,
      gap: spacing.sm,
      padding: spacing.lg,
      width: "100%"
    },
    nextPanelLabel: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs
    },
    nextPanelLabelText: {
      color: "#096DD9",
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    nextRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md
    },
    nextSteps: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    overlay: {
      alignItems: "center",
      backgroundColor: "rgba(10,18,28,0.82)",
      flex: 1,
      justifyContent: "center"
    },
    rescuedBadge: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary,
      borderRadius: 20,
      borderWidth: 1.5,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    rescuedBadgeText: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    subtitle: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 22,
      textAlign: "center"
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "900",
      textAlign: "center"
    }
  });
}
