import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";

import type { AnimalCareState } from "../data/types";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type AnimalCageProps = {
  animalImage: ImageSourcePropType;
  cageImage: ImageSourcePropType;
  progress: number;
  careState: AnimalCareState;
  isRescued?: boolean;
};

const careBadges: Record<AnimalCareState, string[]> = {
  hungry: ["Water"],
  fed: ["Water", "Food"],
  healing: ["Water", "Food", "Care"],
  hopeful: ["Water", "Food", "Care"],
  ready_to_rescue: ["Safe"]
};

export function AnimalCage({
  animalImage,
  cageImage,
  progress,
  careState,
  isRescued
}: AnimalCageProps) {
  const shake = useSharedValue(0);
  const warmth = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (!isRescued && progress >= 0.9) {
      shake.value = withRepeat(withTiming(1, { duration: 140 }), -1, true);
      return;
    }

    shake.value = withTiming(0, { duration: 180 });
  }, [isRescued, progress, shake]);

  const cageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shake.value, [0, 1], [0, 4])
      },
      {
        rotate: `${interpolate(shake.value, [0, 1], [0, -2])}deg`
      }
    ]
  }));

  return (
    <View
      accessibilityLabel={isRescued ? "Rescued animal" : "Animal waiting in cage"}
      style={[
        styles.root,
        { backgroundColor: warmth > 0.7 ? "#FFF2D8" : "#EEF6FF" }
      ]}
    >
      <View style={styles.glow} />
      <Image contentFit="contain" source={animalImage} style={styles.animal} />
      {!isRescued ? (
        <Animated.View pointerEvents="none" style={[styles.cageOverlay, cageStyle]}>
          <Image contentFit="contain" source={cageImage} style={styles.cage} />
        </Animated.View>
      ) : null}
      <View style={styles.badgeRow}>
        {careBadges[careState].map((badge) => (
          <Text key={badge} style={styles.badge}>
            {badge}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  animal: {
    height: "80%",
    width: "80%"
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeRow: {
    bottom: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    left: spacing.sm,
    position: "absolute",
    right: spacing.sm
  },
  cage: {
    height: "100%",
    opacity: 0.78,
    width: "100%"
  },
  cageOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  glow: {
    backgroundColor: "rgba(255,201,74,0.2)",
    borderRadius: 80,
    height: 160,
    position: "absolute",
    width: 160
  },
  root: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  }
});
