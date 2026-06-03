import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
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

type AnimalCageProps = {
  animalImage: ImageSourcePropType;
  progress: number;
  careState: AnimalCareState;
  isRescued?: boolean;
};

export function AnimalCage({
  animalImage,
  progress,
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
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
  animal: {
    bottom: "24%",
    height: "48%",
    position: "absolute",
    width: "48%",
    zIndex: 3
  },
  gateLayer: {
    height: "43%",
    left: "22%",
    position: "absolute",
    top: "31%",
    width: "56%",
    zIndex: 6
  },
  layerImage: {
    height: "100%",
    width: "100%"
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
    bottom: "0%",
    height: "26%",
    position: "absolute",
    width: "90%",
    zIndex: 7
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
