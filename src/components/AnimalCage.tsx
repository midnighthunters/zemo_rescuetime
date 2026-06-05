import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { jailSprites } from "../data/assets";
import type { AnimalCareState } from "../data/types";
import { type AppColors, useAppTheme } from "../theme/colors";

type AnimalCageProps = {
  animalImage: ImageSourcePropType;
  progress: number;
  careState: AnimalCareState;
  isRescued?: boolean;
};

export function AnimalCage({
  animalImage,
  careState,
  progress,
  isRescued
}: AnimalCageProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const breathe = useSharedValue(0);
  const glow = useSharedValue(0);
  const shake = useSharedValue(0);
  const warmth = Math.max(0, Math.min(1, progress));
  const needsCare = careState === "hungry" || careState === "healing";

  useEffect(() => {
    if (!isRescued && progress >= 0.9) {
      shake.value = withRepeat(withTiming(1, { duration: 140 }), -1, true);
      return;
    }
    shake.value = withTiming(0, { duration: 180 });
  }, [isRescued, progress, shake]);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: needsCare ? 1300 : 1800,
          easing: Easing.inOut(Easing.sin)
        }),
        withTiming(0, {
          duration: needsCare ? 1300 : 1800,
          easing: Easing.inOut(Easing.sin)
        })
      ),
      -1,
      false
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [breathe, glow, needsCare]);

  const cageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shake.value, [0, 1], [0, 4]) },
      { rotate: `${interpolate(shake.value, [0, 1], [0, -2])}deg` }
    ]
  }));

  const animalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], needsCare ? [0.9, 1] : [0.96, 1]),
    transform: [
      { translateY: interpolate(breathe.value, [0, 1], isRescued ? [0, -8] : [0, -3]) },
      { scale: interpolate(breathe.value, [0, 1], [1, isRescued ? 1.045 : 1.025]) }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.22 + warmth * 0.18, 0.44 + warmth * 0.22]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.92, 1.08]) }]
  }));

  return (
    <View
      accessibilityLabel={isRescued ? "Rescued animal" : "Animal waiting in cage"}
      style={[
        styles.root,
        {
          backgroundColor:
            isRescued
              ? theme.colors.surfaceSoft
              : warmth > 0.7
                ? theme.colors.surfaceWarm
                : theme.isDark
                  ? "#102821"
                  : "#BFEFFF"
        }
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          { backgroundColor: isRescued ? theme.colors.primary : theme.colors.secondary },
          glowStyle
        ]}
      />

      {!isRescued ? (
        <>
          {/* z=2: Back cage body � behind everything */}
          <Animated.View pointerEvents="none" style={[styles.openJailLayer, cageStyle]}>
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.layerImage}
            />
          </Animated.View>

          {/* z=3: Platform/base � behind the animal and gate */}
          <Animated.View pointerEvents="none" style={[styles.platformLayer, cageStyle]}>
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.layerImage}
            />
          </Animated.View>
        </>
      ) : null}

      {/* z=4: Animal � in front of back body + platform, behind gate bars */}
      <Animated.View style={[styles.animal, animalStyle]}>
        <Image contentFit="contain" source={animalImage} style={styles.animalImage} />
      </Animated.View>

      {!isRescued ? (
        <>
          {/* z=6: Front gate bars � in front of the animal */}
          <Animated.View pointerEvents="none" style={[styles.gateLayer, cageStyle]}>
            <Image contentFit="contain" source={jailSprites.gate} style={styles.layerImage} />
          </Animated.View>

          {/* z=8: Top handle/lid � topmost layer */}
          <Animated.View pointerEvents="none" style={[styles.topLayer, cageStyle]}>
            <Image contentFit="contain" source={jailSprites.top} style={styles.layerImage} />
          </Animated.View>

          <View pointerEvents="none" style={styles.lockBadge}>
            <Ionicons color="#FFFFFF" name="lock-closed" size={24} />
          </View>
        </>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    animal: {
      bottom: "20%",
      height: "52%",
      position: "absolute",
      width: "52%",
      zIndex: 4
    },
    ambientGlow: {
      borderRadius: 999,
      height: "64%",
      position: "absolute",
      width: "64%",
      zIndex: 0
    },
    animalImage: {
      height: "100%",
      width: "100%"
    },
    gateLayer: {
      height: "54%",
      left: "15%",
      position: "absolute",
      top: "25%",
      width: "70%",
      zIndex: 6
    },
    layerImage: {
      height: "100%",
      width: "100%"
    },
    lockBadge: {
      alignItems: "center",
      backgroundColor: "rgba(18, 31, 45, 0.82)",
      borderColor: "rgba(255, 255, 255, 0.92)",
      borderRadius: 22,
      borderWidth: 2,
      height: 44,
      justifyContent: "center",
      position: "absolute",
      right: "13%",
      top: "18%",
      width: 44,
      zIndex: 12
    },
    openJailLayer: {
      height: "72%",
      left: "5%",
      position: "absolute",
      top: "14%",
      width: "90%",
      zIndex: 2
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
      borderColor: isDark ? colors.border : "#FFFFFF",
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      overflow: "hidden",
      width: "100%"
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
