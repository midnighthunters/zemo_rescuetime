import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { cageImage } from "../data/assets";
import type { Animal, AnimalCardStatus } from "../data/types";
import { colors } from "../theme/colors";
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
        <Image contentFit="contain" source={image} style={styles.animalImage} />
        {!isUnlocked ? (
          <Image contentFit="contain" source={cageImage} style={styles.cageImage} />
        ) : null}
        {isUnlocked ? (
          <View style={styles.rescuedBadge}>
            <Ionicons color={colors.white} name="heart" size={12} />
          </View>
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

const styles = StyleSheet.create({
  animalImage: {
    height: "92%",
    width: "92%"
  },
  cageImage: {
    height: "100%",
    left: 0,
    opacity: 0.64,
    position: "absolute",
    top: 0,
    width: "100%"
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
    ...shadows.card
  },
  copy: {
    gap: spacing.xs
  },
  imageWrap: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#EEF7FF",
    borderRadius: 8,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
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
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: "100%"
  },
  progressTrack: {
    backgroundColor: "#E8EDF4",
    borderRadius: 8,
    height: 8,
    overflow: "hidden"
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
  }
});
