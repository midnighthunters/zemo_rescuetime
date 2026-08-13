import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { RescueMilestone } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { getRewardTargetImageSource } from "../services/assets/getAppAssetSource";
import { type AppColors, useAppTheme } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { StatusChip } from "./StatusChip";

type CareMilestoneRowProps = {
  milestone: RescueMilestone;
  stepsToday: number;
  claimedMiniMilestones: number[];
  proLocked?: boolean;
};

type JourneyRow = {
  key: string;
  label: string;
  stepTarget: number;
  image?: ReturnType<typeof getRewardTargetImageSource>;
  complete: boolean;
  isRescue: boolean;
};

/**
 * The six care rewards plus the final rescue gate, rendered as a vertical
 * journey. The next unearned step is the strongest node; earned steps reveal
 * their reward art.
 */
export function CareMilestoneRow({
  claimedMiniMilestones,
  milestone,
  proLocked,
  stepsToday
}: CareMilestoneRowProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();

  const rows = useMemo<JourneyRow[]>(
    () => [
      ...milestone.rewardTargets.map((target) => ({
        complete:
          claimedMiniMilestones.includes(target.stepTarget) ||
          stepsToday >= target.stepTarget,
        image: getRewardTargetImageSource(target),
        isRescue: false,
        key: target.id,
        label: target.title,
        stepTarget: target.stepTarget
      })),
      {
        complete: stepsToday >= milestone.unlockSteps,
        image: undefined,
        isRescue: true,
        key: "rescue",
        label: t("common.rescue"),
        stepTarget: milestone.unlockSteps
      }
    ],
    [claimedMiniMilestones, milestone, stepsToday, t]
  );

  const nextIndex = rows.findIndex((row) => !row.complete);

  return (
    <View style={styles.root}>
      {rows.map((row, index) => {
        const isNext = !proLocked && index === nextIndex;
        const isLast = index === rows.length - 1;

        return (
          <View key={row.key} style={styles.item}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  row.complete && styles.nodeComplete,
                  isNext && styles.nodeNext,
                  proLocked && !row.complete && styles.nodeLocked
                ]}
              >
                <Ionicons
                  color={
                    row.complete
                      ? theme.colors.brandGreenInk
                      : isNext
                        ? theme.colors.textInverse
                        : theme.colors.lockedText
                  }
                  name={
                    row.complete
                      ? "checkmark"
                      : proLocked
                        ? "lock-closed"
                        : row.isRescue
                          ? "flag"
                          : "gift"
                  }
                  size={14}
                />
              </View>
              {!isLast ? (
                <View
                  style={[styles.line, row.complete && styles.lineComplete]}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.card,
                row.complete && styles.cardComplete,
                isNext && styles.cardNext
              ]}
            >
              <View style={styles.thumb}>
                {row.complete && row.image && !row.isRescue ? (
                  <Image
                    contentFit="contain"
                    source={row.image}
                    style={styles.thumbImage}
                  />
                ) : (
                  <Ionicons
                    color={
                      isNext ? theme.colors.activeCoralText : theme.colors.lockedText
                    }
                    name={row.isRescue ? "flag-outline" : "gift-outline"}
                    size={22}
                  />
                )}
              </View>
              <View style={styles.copy}>
                <AppText numberOfLines={2} role="cardTitle">
                  {row.complete || isNext || row.isRescue
                    ? row.label
                    : t("progress.lockedReward")}
                </AppText>
                <AppText role="caption" tone="secondary">
                  {t("common.stepsToTarget", {
                    steps: formatLocalizedNumber(row.stepTarget)
                  })}
                </AppText>
              </View>
              <StatusChip
                label={
                  proLocked && !row.complete
                    ? t("common.pro")
                    : row.complete
                      ? t("state.earned")
                      : isNext
                        ? t("state.next")
                        : t("state.locked")
                }
                tone={
                  proLocked && !row.complete
                    ? "pro"
                    : row.complete
                      ? "safe"
                      : isNext
                        ? "active"
                        : "locked"
                }
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.separator,
      borderCurve: "continuous",
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      flexDirection: "row",
      gap: spacing.s12,
      minWidth: 0,
      padding: spacing.s12
    },
    cardComplete: {
      backgroundColor: colors.brandGreenTint,
      borderColor: isDark ? colors.separatorStrong : "rgba(23,128,76,0.20)"
    },
    cardNext: {
      backgroundColor: colors.activeCoralTint,
      borderColor: colors.activeCoral,
      borderWidth: 1.5
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    item: {
      flexDirection: "row",
      gap: spacing.s12
    },
    line: {
      backgroundColor: colors.separator,
      flex: 1,
      marginVertical: 2,
      width: 2
    },
    lineComplete: {
      backgroundColor: colors.brandGreen
    },
    node: {
      alignItems: "center",
      backgroundColor: colors.lockedSurface,
      borderRadius: radius.round,
      height: 26,
      justifyContent: "center",
      width: 26
    },
    nodeComplete: {
      backgroundColor: colors.brandGreen
    },
    nodeLocked: {
      backgroundColor: colors.lockedSurface
    },
    nodeNext: {
      backgroundColor: colors.activeCoral
    },
    rail: {
      alignItems: "center",
      alignSelf: "stretch",
      paddingTop: spacing.s12,
      width: 26
    },
    root: {
      gap: spacing.s4
    },
    thumb: {
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separator,
      borderRadius: radius.chip,
      borderWidth: StyleSheet.hairlineWidth,
      height: 48,
      justifyContent: "center",
      overflow: "hidden",
      width: 48
    },
    thumbImage: {
      height: 42,
      width: 42
    }
  });
}
