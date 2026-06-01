import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { RescueMilestone } from "../data/types";
import { feedingMilestoneIcons, feedingMilestoneLabels } from "../data/milestones";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { formatNumber } from "../utils/format";

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
  const items = [
    ...milestone.miniMilestones.map((target, index) => ({
      key: `${target}`,
      label: feedingMilestoneLabels[index] ?? "Care",
      target,
      icon: feedingMilestoneIcons[index] ?? "heart",
      complete: claimedMiniMilestones.includes(target) || stepsToday >= target
    })),
    {
      key: "rescue",
      label: "Rescue",
      target: milestone.unlockSteps,
      icon: "key",
      complete: stepsToday >= milestone.unlockSteps
    }
  ];

  return (
    <View style={styles.root}>
      {items.map((item) => (
        <View
          key={item.key}
          accessibilityLabel={`${item.label} at ${item.target} steps`}
          style={[styles.item, item.complete && styles.itemComplete]}
        >
          <Ionicons
            color={
              proLocked
                ? colors.locked
                : item.complete
                  ? colors.primary
                  : colors.muted
            }
            name={item.complete ? "checkmark-circle" : (item.icon as keyof typeof Ionicons.glyphMap)}
            size={16}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.label, item.complete && styles.completeLabel]}
          >
            {item.label}
          </Text>
          <Text style={styles.target}>{formatNumber(item.target)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  completeLabel: {
    color: colors.primaryDark
  },
  item: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 70,
    padding: spacing.sm
  },
  itemComplete: {
    backgroundColor: "#E9F8EF",
    borderColor: "#BFE9CE"
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  root: {
    flexDirection: "row",
    gap: spacing.sm
  },
  target: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  }
});
