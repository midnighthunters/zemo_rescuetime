import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated as RNAnimated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import type { UiSpriteKey } from "../data/ui.generated";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { UiSprite } from "./UiSprite";

type CareEventModalProps = {
  visible: boolean;
  animalName: string;
  label: string;
  spriteKey: UiSpriteKey;
  nextTargetLabel?: string;
  nextTargetSteps?: number;
  nextTargetIcon?: string;
  onDismiss: () => void;
};

export function CareEventModal({
  visible,
  animalName,
  label,
  spriteKey,
  nextTargetLabel,
  nextTargetSteps,
  nextTargetIcon,
  onDismiss
}: CareEventModalProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);

  const backdrop = useRef(new RNAnimated.Value(0)).current;
  const iconScale = useRef(new RNAnimated.Value(0)).current;
  const iconRotate = useRef(new RNAnimated.Value(0)).current;
  const textSlide = useRef(new RNAnimated.Value(24)).current;
  const textOpacity = useRef(new RNAnimated.Value(0)).current;
  const nextSlide = useRef(new RNAnimated.Value(30)).current;
  const nextOpacity = useRef(new RNAnimated.Value(0)).current;
  const glowPulse = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      [backdrop, iconScale, iconRotate, textSlide, textOpacity, nextSlide, nextOpacity, glowPulse].forEach(
        (v, i) => v.setValue([0, 0, 0, 24, 0, 30, 0, 0][i])
      );
      return;
    }

    RNAnimated.sequence([
      // Backdrop fades in
      RNAnimated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
      // Icon pops in with a spin
      RNAnimated.parallel([
        RNAnimated.spring(iconScale, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true
        }),
        RNAnimated.timing(iconRotate, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true
        })
      ]),
      // Text slides up
      RNAnimated.parallel([
        RNAnimated.spring(textSlide, {
          toValue: 0,
          friction: 7,
          tension: 120,
          useNativeDriver: true
        }),
        RNAnimated.timing(textOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true
        })
      ]),
      RNAnimated.delay(100),
      // Next target slides in
      RNAnimated.parallel([
        RNAnimated.spring(nextSlide, {
          toValue: 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true
        }),
        RNAnimated.timing(nextOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]),
      RNAnimated.delay(200),
      // Glow pulses
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(glowPulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          RNAnimated.timing(glowPulse, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ]),
        { iterations: 3 }
      )
    ]).start();
  }, [visible, backdrop, glowPulse, iconRotate, iconScale, nextOpacity, nextSlide, textOpacity, textSlide]);

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-30deg", "0deg"]
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });

  return (
    <Modal animationType="none" transparent visible={visible}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <RNAnimated.View style={[styles.overlay, { opacity: backdrop }]} />
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Glowing icon */}
          <RNAnimated.View
            style={[
              styles.iconGlowRing,
              { transform: [{ scale: glowScale }], opacity: backdrop }
            ]}
          />
          <RNAnimated.View
            style={{
              transform: [{ scale: iconScale }, { rotate }],
              alignItems: "center",
              zIndex: 2
            }}
          >
            <UiSprite spriteKey={spriteKey} size={110} />
          </RNAnimated.View>

          {/* Text */}
          <RNAnimated.View
            style={{
              transform: [{ translateY: textSlide }],
              opacity: textOpacity,
              alignItems: "center",
              gap: spacing.xs
            }}
          >
            <View style={styles.badge}>
              <Ionicons
                color={theme.colors.primary}
                name="checkmark-circle"
                size={16}
              />
              <Text style={styles.badgeText}>Care Unlocked!</Text>
            </View>
            <Text style={styles.title}>{animalName} got {label}!</Text>
            <Text style={styles.subtitle}>
              Keep walking to give more care and open the gate.
            </Text>
          </RNAnimated.View>

          {/* Next target */}
          {nextTargetLabel && nextTargetSteps !== undefined ? (
            <RNAnimated.View
              style={[
                styles.nextPanel,
                {
                  transform: [{ translateY: nextSlide }],
                  opacity: nextOpacity
                }
              ]}
            >
              <View style={styles.nextRow}>
                <Ionicons
                  color="#096DD9"
                  name={(nextTargetIcon ?? "flag") as keyof typeof Ionicons.glyphMap}
                  size={20}
                />
                <View style={styles.nextCopy}>
                  <Text style={styles.nextLabel}>Next Goal</Text>
                  <Text style={styles.nextTitle}>{nextTargetLabel}</Text>
                </View>
                <View style={styles.nextBadge}>
                  <Text style={styles.nextSteps}>
                    {nextTargetSteps.toLocaleString()}
                  </Text>
                  <Text style={styles.nextStepsUnit}>steps</Text>
                </View>
              </View>
            </RNAnimated.View>
          ) : null}

          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Tap anywhere to continue</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    badge: {
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
    badgeText: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
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
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
      elevation: 20,
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
    iconGlowRing: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary,
      borderRadius: 80,
      borderWidth: 3,
      height: 140,
      position: "absolute",
      top: spacing.xl - 10,
      width: 140,
      zIndex: 1
    },
    nextBadge: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "#EAF6FF",
      borderColor: isDark ? colors.border : "#48AEEF",
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs
    },
    nextCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
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
      borderRadius: 14,
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
      backgroundColor: "rgba(10,18,28,0.78)",
      flex: 1,
      justifyContent: "center",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
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
