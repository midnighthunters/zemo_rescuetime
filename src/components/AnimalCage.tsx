import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";

import { jailSprites } from "../data/assets";
import type { AnimalCareState } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
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
  const { t } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const warmth = Math.max(0, Math.min(1, progress));
  const needsCare = careState === "hungry" || careState === "healing";
  const glowOpacity = (needsCare ? 0.28 : 0.34) + warmth * 0.16;

  return (
    <View
      accessibilityLabel={
        isRescued
          ? t("a11y.animalCage.rescued")
          : t("a11y.animalCage.waiting")
      }
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
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          { backgroundColor: isRescued ? theme.colors.primary : theme.colors.secondary },
          { opacity: glowOpacity }
        ]}
      />

      {!isRescued ? (
        <>
          {/* z=2: Back cage body � behind everything */}
          <View pointerEvents="none" style={styles.openJailLayer}>
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.layerImage}
            />
          </View>

          {/* z=3: Platform/base � behind the animal and gate */}
          <View pointerEvents="none" style={styles.platformLayer}>
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.layerImage}
            />
          </View>
        </>
      ) : null}

      {/* z=4: Animal � in front of back body + platform, behind gate bars */}
      <View style={styles.animal}>
        <Image contentFit="contain" source={animalImage} style={styles.animalImage} />
      </View>

      {!isRescued ? (
        <>
          {/* z=6: Front gate bars � in front of the animal */}
          <View pointerEvents="none" style={styles.gateLayer}>
            <Image contentFit="contain" source={jailSprites.gate} style={styles.layerImage} />
          </View>

          {/* z=8: Top handle/lid � topmost layer */}
          <View pointerEvents="none" style={styles.topLayer}>
            <Image contentFit="contain" source={jailSprites.top} style={styles.layerImage} />
          </View>

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
