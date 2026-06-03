import { Ionicons } from "@expo/vector-icons";
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
import { UiSprite } from "./UiSprite";

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
        <UiSprite
          spriteKey={isUnlocked ? "collectionUnlockedFrame" : "collectionLockedBubble"}
          size={96}
          style={styles.collectionFrame}
        />
        {!isUnlocked ? (
          <Image
            contentFit="contain"
            source={jailSprites.openJail}
            style={styles.openJailImage}
          />
        ) : null}
        <Image contentFit="contain" source={image} style={styles.animalImage} />
        {!isUnlocked ? (
          <View pointerEvents="none" style={styles.jailStack}>
            <Image
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImage}
            />
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.platformImage}
            />
            <Image
              contentFit="contain"
              source={jailSprites.top}
              style={styles.topImage}
            />
          </View>
        ) : null}
        {isUnlocked ? (
          <View style={styles.rescuedBadge}>
            <Ionicons color={theme.colors.white} name="heart" size={12} />
          </View>
        ) : null}
        {isProLocked ? (
          <UiSprite spriteKey="collectionPremiumBadge" size={42} style={styles.proSprite} />
        ) : null}
      </View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {animal.name}
          </Text>
          {isProLocked ? <ProBadge /> : null}
        </View>
        <Text numberOfLines={1} style={styles.status}>
          {statusCopy}
        </Text>
        {!isUnlocked ? (
          <>
            <Text style={styles.steps}>
              Unlocks at {formatNumber(requiredSteps)} steps
            </Text>
            {status === "active" ? (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` as `${number}%` }
                  ]}
                />
              </View>
            ) : null}
            {status === "active" ? (
              <Text style={styles.percent}>{formatPercent(progress)}</Text>
            ) : null}
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
    bottom: "21%",
    height: "48%",
    position: "absolute",
    width: "58%",
    zIndex: 3
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minWidth: 150,
    padding: spacing.md,
    ...shadows.soft
  },
  copy: {
    gap: spacing.xs
  },
  collectionFrame: {
    opacity: 0.85,
    position: "absolute",
    right: -16,
    top: -14,
    zIndex: 1
  },
  gateImage: {
    height: "57%",
    left: "18%",
    position: "absolute",
    top: "27%",
    width: "64%",
    zIndex: 6
  },
  imageWrap: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: isDark ? "#102821" : "#EEF8F2",
    borderRadius: 8,
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
    flex: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  percent: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900"
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  proSprite: {
    bottom: spacing.sm,
    position: "absolute",
    right: spacing.sm,
    zIndex: 8
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
  openJailImage: {
    bottom: "8%",
    height: "84%",
    left: "3%",
    position: "absolute",
    width: "94%",
    zIndex: 2
  },
  platformImage: {
    bottom: "3%",
    height: "35%",
    position: "absolute",
    width: "94%",
    zIndex: 7
  },
  rescuedBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 24
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
    height: "35%",
    left: "3%",
    position: "absolute",
    top: "1%",
    width: "94%",
    zIndex: 8
  }
  });
}
