import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { jailSprites } from "../data/assets";
import type { Animal, AnimalCardStatus } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { getAnimalImageSource } from "../services/assets/getAppAssetSource";
import { type AppColors, useAppTheme } from "../theme/colors";
import { pressScale } from "../theme/motion";
import { elevation } from "../theme/shadows";
import { radius, spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AppText } from "./AppText";
import { ProgressBar } from "./ProgressBar";
import { StatusChip } from "./StatusChip";

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
  concealed = false,
  onPress,
  progress = 0,
  requiredSteps,
  rescuedDate,
  status
}: AnimalCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { formatNumber: formatLocalizedNumber, locale, t } = useLanguage();

  const isRescued = status === "unlocked";
  const isProLocked = status === "pro_locked";
  const isActive = status === "active";
  const isMystery = concealed && !isRescued;
  const image = getAnimalImageSource(animal, isRescued ? "happy" : "sad");

  const statusCopy = isMystery
    ? t("animalCard.keepRevealing")
    : isActive
      ? t("animalCard.currentRescue")
      : isRescued
        ? rescuedDate
          ? t("animalCard.rescuedDate", { date: rescuedDate })
          : t("animalCard.rescued")
        : isProLocked
          ? t("animalCard.requiresPro")
          : t("animalCard.locked");

  /* ── Concealed future animal: mystery crate, no leaked name ── */
  if (isMystery) {
    return (
      <View
        accessibilityLabel={t("a11y.animalCard.mystery")}
        accessibilityRole="image"
        style={styles.card}
      >
        <View style={[styles.stage, styles.mysteryStage]}>
          <Ionicons
            color={theme.isDark ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.92)"}
            name="help"
            size={40}
          />
        </View>
        <View style={styles.copy}>
          <AppText numberOfLines={1} role="cardTitle">
            {t("animalCard.mysteryRescue")}
          </AppText>
          <AppText numberOfLines={2} role="caption" tone="secondary">
            {t("animalCard.completeEarlier")}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={isProLocked ? t("animalCard.requiresPro") : undefined}
      accessibilityLabel={t("a11y.animalCard.default", {
        animal: animal.name,
        status: statusCopy,
        steps: formatLocalizedNumber(requiredSteps)
      })}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.stage,
          isRescued && styles.stageSafe,
          isProLocked && styles.stagePro
        ]}
      >
        {!isRescued ? (
          <>
            <Image
              contentFit="contain"
              source={jailSprites.platform}
              style={styles.platformImage}
            />
            <Image
              contentFit="contain"
              source={jailSprites.openJail}
              style={styles.shellImage}
            />
          </>
        ) : null}

        <Image contentFit="contain" source={image} style={styles.animalImage} />

        {!isRescued ? (
          <View pointerEvents="none" style={styles.jailStack}>
            <Image
              contentFit="contain"
              source={jailSprites.gate}
              style={styles.gateImage}
            />
            <Image
              contentFit="contain"
              source={jailSprites.top}
              style={styles.topImage}
            />
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.stageBadge}>
          <Ionicons
            color="#FFFFFF"
            name={
              isRescued
                ? "shield-checkmark"
                : isProLocked
                  ? "star"
                  : "lock-closed"
            }
            size={15}
          />
        </View>
      </View>

      <View style={styles.copy}>
        <AppText numberOfLines={1} role="cardTitle">
          {animal.name}
        </AppText>

        {isRescued ? (
          <StatusChip
            icon="shield-checkmark"
            label={statusCopy}
            tone="safe"
          />
        ) : (
          <>
            <StatusChip
              label={
                isActive
                  ? t("animalCard.currentRescue")
                  : isProLocked
                    ? t("common.pro")
                    : t("animalCard.locked")
              }
              tone={isActive ? "active" : isProLocked ? "pro" : "locked"}
            />
            <AppText numberOfLines={1} role="caption" tone="secondary">
              {t("animalCard.unlocksAt", {
                steps: formatLocalizedNumber(requiredSteps)
              })}
            </AppText>
            <View style={styles.progressRow}>
              <ProgressBar
                height={6}
                progress={progress}
                variant={isActive ? "rescue" : isProLocked ? "pro" : "standard"}
              />
              <AppText role="caption" style={styles.percent} tone="secondary">
                {formatPercent(progress, locale)}
              </AppText>
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

export const AnimalCard = memo(AnimalCardComponent);

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    animalImage: {
      bottom: "18%",
      height: "56%",
      position: "absolute",
      width: "56%",
      zIndex: 4
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderCurve: "continuous",
      borderRadius: radius.card,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      gap: spacing.s8,
      overflow: "hidden",
      padding: spacing.s8,
      ...elevation("soft", isDark, colors.shadowColor)
    },
    copy: {
      gap: spacing.s4,
      paddingBottom: spacing.s4,
      paddingHorizontal: spacing.s4
    },
    gateImage: {
      height: "52%",
      left: "15%",
      position: "absolute",
      top: "26%",
      width: "70%",
      zIndex: 6
    },
    jailStack: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 5
    },
    mysteryStage: {
      alignItems: "center",
      backgroundColor: isDark ? "#1D2A2F" : "#9FB2BD",
      justifyContent: "center"
    },
    percent: {
      fontVariant: ["tabular-nums"],
      minWidth: 34,
      textAlign: "right"
    },
    platformImage: {
      bottom: "-1%",
      height: "30%",
      position: "absolute",
      width: "96%",
      zIndex: 1
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: pressScale }]
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s8
    },
    shellImage: {
      height: "72%",
      left: "5%",
      position: "absolute",
      top: "14%",
      width: "90%",
      zIndex: 2
    },
    stage: {
      alignItems: "center",
      aspectRatio: 1.1,
      backgroundColor: colors.cageStage,
      borderCurve: "continuous",
      borderRadius: radius.control,
      justifyContent: "center",
      overflow: "hidden",
      width: "100%"
    },
    stageBadge: {
      alignItems: "center",
      backgroundColor: "rgba(18, 31, 45, 0.72)",
      borderRadius: radius.round,
      height: 26,
      justifyContent: "center",
      position: "absolute",
      right: spacing.s8,
      top: spacing.s8,
      width: 26,
      zIndex: 12
    },
    stagePro: {
      backgroundColor: colors.surfaceAmber
    },
    stageSafe: {
      backgroundColor: colors.sanctuaryStage
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
