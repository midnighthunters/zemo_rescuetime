import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";

import { jailSprites } from "../data/assets";
import type { AnimalCareState } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";

type AnimalCageProps = {
  animalImage: ImageSourcePropType;
  progress: number;
  careState: AnimalCareState;
  isRescued?: boolean;
  /** Slightly tighter framing for grid and modal contexts. */
  compact?: boolean;
};

/**
 * The rescue stage. Cage layers weaken as progress rises: bars fade and drift
 * apart, the lid lifts, and the lock badge switches to an "opening" state near
 * the target. Once rescued the cage disappears entirely and the animal sits on a
 * warm sanctuary surface.
 */
export function AnimalCage({
  animalImage,
  careState: _careState,
  compact = false,
  isRescued,
  progress
}: AnimalCageProps) {
  const theme = useAppTheme();
  const { t } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark, compact),
    [compact, theme.colors, theme.isDark]
  );

  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  /* Bars stay clearly readable until the halfway point, then visibly weaken. */
  const barOpacity = isRescued ? 0 : 1 - clamped * 0.55;
  const barSpread = clamped * (compact ? 6 : 12);
  const lidLift = clamped * (compact ? 5 : 10);
  const isOpening = clamped >= 0.85;

  const stageGradient = isRescued
    ? ([theme.colors.sanctuaryStage, theme.colors.brandGreenTint] as const)
    : ([theme.colors.cageStage, theme.isDark ? theme.colors.surfaceSecondary : "#EFF8FE"] as const);

  return (
    <View
      accessibilityLabel={
        isRescued ? t("a11y.animalCage.rescued") : t("a11y.animalCage.waiting")
      }
      style={styles.root}
    >
      <LinearGradient
        colors={stageGradient}
        end={{ x: 0.8, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {!isRescued ? (
        <>
          {/* Cage shell, behind the animal. */}
          <View pointerEvents="none" style={[styles.shellLayer, { opacity: barOpacity }]}>
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.layerImage}
            />
          </View>
          <View pointerEvents="none" style={styles.platformLayer}>
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.layerImage}
            />
          </View>
        </>
      ) : (
        <View pointerEvents="none" style={styles.sanctuaryHalo} />
      )}

      {/* The animal is always the visual focus. */}
      <View style={styles.animal}>
        <Image contentFit="contain" source={animalImage} style={styles.layerImage} />
      </View>

      {!isRescued ? (
        <>
          {/* Front bars split apart and fade as care accumulates. */}
          <View
            pointerEvents="none"
            style={[
              styles.gateHalf,
              styles.gateLeft,
              { opacity: barOpacity, transform: [{ translateX: -barSpread }] }
            ]}
          >
            <Image
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImageLeft}
            />
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.gateHalf,
              styles.gateRight,
              { opacity: barOpacity, transform: [{ translateX: barSpread }] }
            ]}
          >
            <Image
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImageRight}
            />
          </View>

          <View
            pointerEvents="none"
            style={[
              styles.topLayer,
              { opacity: barOpacity, transform: [{ translateY: -lidLift }] }
            ]}
          >
            <Image
              contentFit="contain"
              source={jailSprites.top}
              style={styles.layerImage}
            />
          </View>

          <View
            pointerEvents="none"
            style={[
              styles.lockBadge,
              isOpening && { backgroundColor: theme.colors.brandGreenFill }
            ]}
          >
            <Ionicons
              color="#FFFFFF"
              name={isOpening ? "lock-open" : "lock-closed"}
              size={compact ? 16 : 20}
            />
          </View>
        </>
      ) : (
        <View pointerEvents="none" style={styles.safeBadge}>
          <Ionicons
            color={theme.colors.brandGreenInk}
            name="shield-checkmark"
            size={compact ? 16 : 20}
          />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean, compact: boolean) {
  return StyleSheet.create({
    animal: {
      bottom: compact ? "18%" : "19%",
      height: compact ? "56%" : "54%",
      position: "absolute",
      width: compact ? "56%" : "54%",
      zIndex: 4
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
    layerImage: {
      height: "100%",
      width: "100%"
    },
    lockBadge: {
      alignItems: "center",
      backgroundColor: "rgba(18, 31, 45, 0.78)",
      borderColor: "rgba(255,255,255,0.9)",
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
        ? "rgba(69,209,143,0.14)"
        : "rgba(45,190,114,0.16)",
      borderRadius: radius.round,
      height: "62%",
      position: "absolute",
      width: "62%",
      zIndex: 0
    },
    shellLayer: {
      height: "72%",
      left: "5%",
      position: "absolute",
      top: "14%",
      width: "90%",
      zIndex: 2
    },
    topLayer: {
      height: "31%",
      left: "5%",
      position: "absolute",
      top: "2%",
      width: "90%",
      zIndex: 8
    }
  });
}
