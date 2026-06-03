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

import { jailSprites } from "../data/assets";
import type { AnimalCareState } from "../data/types";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";

type AnimalCageProps = {
  animalImage: ImageSourcePropType;
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
  progress,
  careState,
  isRescued
}: AnimalCageProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
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
        {
          backgroundColor:
            warmth > 0.7 ? theme.colors.surfaceWarm : theme.colors.surfaceSoft
        }
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            backgroundColor: theme.isDark
              ? "rgba(69,209,143,0.18)"
              : "rgba(243,179,61,0.18)"
          }
        ]}
      />
      {!isRescued ? (
        <Image
          contentFit="contain"
          source={jailSprites.platform}
          style={styles.platform}
        />
      ) : null}
      <Image contentFit="contain" source={animalImage} style={styles.animal} />
      {!isRescued ? (
        <Animated.View pointerEvents="none" style={[styles.jailOverlay, cageStyle]}>
          <Image
            contentFit="contain"
            source={jailSprites.openJail}
            style={styles.openJail}
          />
          <Image contentFit="contain" source={jailSprites.gate} style={styles.gate} />
          <Image contentFit="contain" source={jailSprites.top} style={styles.top} />
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

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
  animal: {
    bottom: "12%",
    height: "62%",
    position: "absolute",
    width: "68%",
    zIndex: 3
  },
  badge: {
    backgroundColor: isDark ? "rgba(31,42,39,0.88)" : "rgba(255,255,255,0.9)",
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
  gate: {
    bottom: "22%",
    height: "48%",
    position: "absolute",
    right: "13%",
    width: "52%",
    zIndex: 6
  },
  jailOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  glow: {
    borderRadius: 96,
    height: 192,
    position: "absolute",
    width: 192,
    zIndex: 1
  },
  openJail: {
    bottom: "6%",
    height: "72%",
    left: "7%",
    position: "absolute",
    width: "86%",
    zIndex: 5
  },
  platform: {
    bottom: "5%",
    height: "25%",
    position: "absolute",
    width: "86%",
    zIndex: 2
  },
  root: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  top: {
    height: "30%",
    left: "7%",
    position: "absolute",
    top: "1%",
    width: "86%",
    zIndex: 7
  }
  });
}
