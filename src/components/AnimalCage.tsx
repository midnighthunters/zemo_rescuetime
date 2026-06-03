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
          styles.stageFloor,
          {
            backgroundColor: theme.isDark
              ? "rgba(69,209,143,0.10)"
              : "rgba(255,191,63,0.20)"
          }
        ]}
      />
      {!isRescued ? (
        <Animated.View pointerEvents="none" style={[styles.openJailLayer, cageStyle]}>
          <Image
            contentFit="contain"
            source={jailSprites.openJail}
            style={styles.layerImage}
          />
        </Animated.View>
      ) : null}
      <Image contentFit="contain" source={animalImage} style={styles.animal} />
      {!isRescued ? (
        <>
          <Animated.View pointerEvents="none" style={[styles.gateLayer, cageStyle]}>
            <Image contentFit="contain" source={jailSprites.gate} style={styles.layerImage} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.platformLayer, cageStyle]}>
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.layerImage}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.topLayer, cageStyle]}>
            <Image contentFit="contain" source={jailSprites.top} style={styles.layerImage} />
          </Animated.View>
        </>
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
    bottom: "21%",
    height: "48%",
    position: "absolute",
    width: "58%",
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
  gateLayer: {
    height: "57%",
    left: "18%",
    position: "absolute",
    top: "27%",
    width: "64%",
    zIndex: 6
  },
  layerImage: {
    height: "100%",
    width: "100%"
  },
  openJailLayer: {
    bottom: "8%",
    height: "84%",
    left: "3%",
    position: "absolute",
    width: "94%",
    zIndex: 2
  },
  platformLayer: {
    bottom: "3%",
    height: "35%",
    position: "absolute",
    width: "94%",
    zIndex: 7
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
  stageFloor: {
    bottom: 0,
    height: "36%",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 1
  },
  topLayer: {
    height: "35%",
    left: "3%",
    position: "absolute",
    top: "1%",
    width: "94%",
    zIndex: 8
  }
  });
}
