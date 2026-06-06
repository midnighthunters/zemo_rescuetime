import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { RescueMilestone } from "../data/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { MotionView, PulseView } from "./Motion";

type CareMilestoneRowProps = {
  milestone: RescueMilestone;
  stepsToday: number;
  claimedMiniMilestones: number[];
  proLocked?: boolean;
};

export function CareMilestoneRow({
  milestone,
  stepsToday,
  claimedMiniMilestones,
  proLocked
}: CareMilestoneRowProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();
  const items = [
    ...milestone.rewardTargets.map((target) => ({
      key: target.id,
      label: target.title,
      stepTarget: target.stepTarget,
      image: target.image,
      complete:
        claimedMiniMilestones.includes(target.stepTarget) ||
        stepsToday >= target.stepTarget,
      isRescue: false
    })),
    {
      key: "rescue",
      label: t("common.rescue"),
      stepTarget: milestone.unlockSteps,
      image: undefined,
      complete: stepsToday >= milestone.unlockSteps,
      isRescue: true
    }
  ];

  return (
    <View style={styles.root}>
      {items.map((item, index) => (
        <MotionView
          key={item.key}
          delay={index * 70}
          direction="fade"
          accessibilityLabel={t("rescueModal.nextSteps", {
            target: item.label,
            steps: formatLocalizedNumber(item.stepTarget)
          })}
          style={[
            styles.item,
            item.complete && styles.itemComplete,
            proLocked && styles.itemLocked
          ]}
        >
          <View style={styles.imageWrap}>
            {item.image ? (
              <PulseView
                active={item.complete}
                floatDistance={2}
                pulseScale={1.05}
                style={styles.rewardPulse}
              >
                <Image
                  contentFit="contain"
                  source={item.image}
                  style={styles.rewardImage}
                />
              </PulseView>
            ) : (
              <PulseView active={item.complete} pulseScale={1.1}>
                <Ionicons
                  color={
                    proLocked
                      ? theme.colors.locked
                      : item.complete
                        ? theme.colors.primary
                        : theme.colors.muted
                  }
                  name={item.complete ? "checkmark-circle" : "key"}
                  size={32}
                />
              </PulseView>
            )}
          </View>
          <Text
            adjustsFontSizeToFit
            numberOfLines={2}
            style={[styles.label, item.complete && styles.completeLabel]}
          >
            {item.label}
          </Text>
          <Text style={styles.target}>
            {t("common.stepsToTarget", {
              steps: formatLocalizedNumber(item.stepTarget)
            })}
          </Text>
        </MotionView>
      ))}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    completeLabel: {
      color: colors.primaryDark
    },
    imageWrap: {
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceElevated : "#FFFFFF",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 58,
      justifyContent: "center",
      width: "100%"
    },
    item: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(31,42,39,0.72)" : "rgba(255,255,255,0.76)",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: "31%",
      flexGrow: 1,
      gap: spacing.xs,
      minHeight: 138,
      minWidth: 96,
      padding: spacing.sm
    },
    itemComplete: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary
    },
    itemLocked: {
      opacity: 0.58
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "900",
      lineHeight: 15,
      minHeight: 30,
      textAlign: "center"
    },
    rewardImage: {
      height: 54,
      width: "100%"
    },
    rewardPulse: {
      width: "100%"
    },
    root: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    target: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center"
    }
  });
}
