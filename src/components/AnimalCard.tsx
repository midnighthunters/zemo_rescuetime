import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { jailSprites } from "../data/assets";
import type { Animal, AnimalCardStatus } from "../data/types";
import { type AppColors, useAppTheme } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { formatNumber, formatPercent } from "../utils/format";
import { AnimatedProgressFill, PulseView } from "./Motion";
import { ProBadge } from "./ProBadge";

type AnimalCardProps = {
  animal: Animal;
  status: AnimalCardStatus;
  requiredSteps: number;
  progress?: number;
  rescuedDate?: string;
  concealed?: boolean;
  onPress: () => void;
};

function AnimalCardComponent({
  animal,
  status,
  requiredSteps,
  progress = 0,
  rescuedDate,
  concealed = false,
  onPress
}: AnimalCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const isUnlocked = status === "unlocked";
  const isProLocked = status === "pro_locked";
  const image = isUnlocked ? animal.happyImage : animal.sadImage;
  const isMysteryLocked = concealed && !isUnlocked;
  const statusCopy =
    isMysteryLocked
      ? "Keep rescuing to reveal"
      : status === "active"
      ? "Current rescue"
      : isUnlocked
        ? rescuedDate
          ? `Rescued ${rescuedDate}`
          : "Rescued"
        : isProLocked
          ? "Requires Pro"
          : "Locked";

  if (isMysteryLocked) {
    return (
      <Pressable
        accessibilityLabel="Mystery animal. Keep rescuing to reveal."
        accessibilityRole="image"
        disabled
        style={[styles.card, styles.mysteryCard]}
      >
        <View style={[styles.imageWrap, styles.mysteryImageWrap]}>
          <View pointerEvents="none" style={styles.mysteryOverlay}>
            <PulseView floatDistance={3} pulseScale={1.04}>
              <Text style={styles.mysteryMark}>?</Text>
            </PulseView>
          </View>
        </View>

        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.name}>
            Mystery rescue
          </Text>
          <Text numberOfLines={2} style={styles.steps}>
            Complete earlier rescues to reveal
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={
        isMysteryLocked
          ? "Mystery animal. Keep rescuing to reveal."
          : `${animal.name} ${statusCopy}. Rescue at ${requiredSteps} steps.`
      }
      accessibilityRole={isMysteryLocked ? "image" : "button"}
      disabled={isMysteryLocked}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {!isUnlocked ? (
          <>
            {/* z=1: Platform base — BEHIND everything */}
            <Image
              blurRadius={isMysteryLocked ? 30 : isProLocked ? 10 : 0}
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.platformImage}
            />
            {/* z=2: Back cage body */}
            <Image
              blurRadius={isMysteryLocked ? 30 : isProLocked ? 10 : 0}
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.openJailImage}
            />
          </>
        ) : null}
        {/* z=4: Animal — in front of base, behind gate */}
        <Image
          blurRadius={isMysteryLocked ? 40 : isProLocked ? 12 : 0}
          contentFit="contain"
          source={image}
          style={styles.animalImage}
        />
        {!isUnlocked ? (
          <View pointerEvents="none" style={styles.jailStack}>
            {/* z=6: Front gate bars */}
            <Image
              blurRadius={isMysteryLocked ? 30 : isProLocked ? 8 : 0}
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImage}
            />
            {/* z=8: Top lid */}
            <Image
              blurRadius={isMysteryLocked ? 30 : isProLocked ? 8 : 0}
              contentFit="contain"
              source={jailSprites.top}
              style={styles.topImage}
            />
          </View>
        ) : null}
        {!isUnlocked ? (
          <PulseView
            active={status === "active"}
            pointerEvents="none"
            pulseScale={1.08}
            style={styles.lockBadge}
          >
            <Ionicons color="#FFFFFF" name="lock-closed" size={20} />
          </PulseView>
        ) : null}
        {isMysteryLocked ? (
          <View pointerEvents="none" style={styles.mysteryOverlay}>
            <PulseView floatDistance={3} pulseScale={1.04}>
              <Text style={styles.mysteryMark}>?</Text>
            </PulseView>
          </View>
        ) : isProLocked ? (
          <View pointerEvents="none" style={styles.proBlurOverlay} />
        ) : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Image
            blurRadius={isMysteryLocked ? 30 : isProLocked ? 8 : 0}
            contentFit="contain"
            source={image}
            style={styles.avatar}
          />
          <View style={styles.nameCopy}>
            {isMysteryLocked ? null : (
              <>
                <Text numberOfLines={1} style={styles.name}>
                  {animal.name}
                </Text>
                <Text numberOfLines={1} style={styles.status}>
                  {statusCopy}
                </Text>
              </>
            )}
          </View>
          {isProLocked && !isMysteryLocked ? <ProBadge /> : null}
        </View>

        {!isUnlocked ? (
          <>
            <Text style={styles.steps}>
              {isMysteryLocked
                ? "Complete earlier rescues to reveal"
                : `Unlocks at ${formatNumber(requiredSteps)} steps`}
            </Text>
            {!isMysteryLocked ? (
              <>
                <View style={styles.progressTrack}>
                  <AnimatedProgressFill
                    progress={progress}
                    style={styles.progressFill}
                  />
                </View>
                <Text style={styles.percent}>{formatPercent(progress)}</Text>
              </>
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
    lockBadge: {
      alignItems: "center",
      backgroundColor: "rgba(18, 31, 45, 0.82)",
      borderColor: "rgba(255, 255, 255, 0.92)",
      borderRadius: 18,
      borderWidth: 2,
      height: 36,
      justifyContent: "center",
      position: "absolute",
      right: "12%",
      top: "16%",
      width: 36,
      zIndex: 12
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
    mysteryMark: {
      color: "#FFFFFF",
      fontSize: 54,
      fontWeight: "900"
    },
    mysteryCard: {
      opacity: 0.96
    },
    mysteryImageWrap: {
      backgroundColor: isDark ? "#16202A" : "#DFE8EF"
    },
    mysteryOverlay: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(8, 13, 18, 0.88)" : "rgba(26, 38, 52, 0.86)",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 11
    },
    proBlurOverlay: {
      backgroundColor: isDark ? "rgba(8, 13, 18, 0.42)" : "rgba(255, 255, 255, 0.42)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 10
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
