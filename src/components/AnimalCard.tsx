import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { jailSprites } from "../data/assets";
import type { Animal, AnimalCardStatus } from "../data/types";
import { type AppColors, useAppTheme } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { formatNumber, formatPercent } from "../utils/format";
import { ProBadge } from "./ProBadge";

type AnimalCardProps = {
  animal: Animal;
  status: AnimalCardStatus;
  requiredSteps: number;
  progress?: number;
  rescuedDate?: string;
  onPress: () => void;
};

function AnimalCardComponent({
  animal,
  status,
  requiredSteps,
  progress = 0,
  rescuedDate,
  onPress
}: AnimalCardProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const isUnlocked = status === "unlocked";
  const isProLocked = status === "pro_locked";
  const image = isUnlocked ? animal.happyImage : animal.sadImage;
  const statusCopy =
    status === "active"
      ? "Current rescue"
      : isUnlocked
        ? rescuedDate
          ? `Rescued ${rescuedDate}`
          : "Rescued"
        : isProLocked
          ? "Requires Pro"
          : "Locked";

  return (
    <Pressable
      accessibilityLabel={`${animal.name} ${statusCopy}. Rescue at ${requiredSteps} steps.`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {!isUnlocked ? (
          <>
            {/* z=1: Platform base — BEHIND everything */}
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.platformImage}
            />
            {/* z=2: Back cage body */}
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.openJailImage}
            />
          </>
        ) : null}
        {/* z=4: Animal — in front of base, behind gate */}
        <Image contentFit="contain" source={image} style={styles.animalImage} />
        {!isUnlocked ? (
          <View pointerEvents="none" style={styles.jailStack}>
            {/* z=6: Front gate bars */}
            <Image
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImage}
            />
            {/* z=8: Top lid */}
            <Image
              contentFit="contain"
              source={jailSprites.top}
              style={styles.topImage}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Image contentFit="contain" source={image} style={styles.avatar} />
          <View style={styles.nameCopy}>
            <Text numberOfLines={1} style={styles.name}>
              {animal.name}
            </Text>
            <Text numberOfLines={1} style={styles.status}>
              {statusCopy}
            </Text>
          </View>
          {isProLocked ? <ProBadge /> : null}
        </View>

        {!isUnlocked ? (
          <>
            <Text style={styles.steps}>
              Unlocks at {formatNumber(requiredSteps)} steps
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` as `${number}%` }
                ]}
              />
            </View>
            <Text style={styles.percent}>{formatPercent(progress)}</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

export const AnimalCard = memo(AnimalCardComponent);

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    animalImage: {
      bottom: "20%",
      height: "52%",
      position: "absolute",
      width: "52%",
      zIndex: 4
    },
    avatar: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 34,
      width: 34
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      gap: spacing.sm,
      minWidth: 150,
      overflow: "hidden",
      padding: spacing.sm,
      ...shadows.soft
    },
    copy: {
      gap: spacing.xs,
      paddingBottom: spacing.xs,
      paddingHorizontal: spacing.xs
    },
    gateImage: {
      height: "54%",
      left: "15%",
      position: "absolute",
      top: "25%",
      width: "70%",
      zIndex: 6
    },
    imageWrap: {
      alignItems: "center",
      aspectRatio: 1.18,
      backgroundColor: isDark ? "#102821" : "#CDEFFF",
      borderColor: isDark ? colors.border : "#FFFFFF",
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      overflow: "hidden",
      width: "100%"
    },
    jailStack: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 5
    },
    name: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900"
    },
    nameCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0
    },
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    openJailImage: {
      height: "72%",
      left: "5%",
      position: "absolute",
      top: "14%",
      width: "90%",
      zIndex: 2
    },
    percent: {
      color: colors.primaryDark,
      fontSize: 12,
      fontWeight: "900"
    },
    platformImage: {
      bottom: "-1%",
      height: "30%",
      position: "absolute",
      width: "96%",
      zIndex: 1
    },
    pressed: {
      transform: [{ scale: 0.99 }]
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: "100%"
    },
    progressTrack: {
      backgroundColor: colors.border,
      borderRadius: 8,
      height: 8,
      overflow: "hidden"
    },
    status: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800"
    },
    steps: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700"
    },
    topImage: {
      height: "31%",
      left: "5%",
      position: "absolute",
      top: "2%",
      width: "90%",
      zIndex: 8
    }
  });
}
