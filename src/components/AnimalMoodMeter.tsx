import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { AnimalMood } from "../data/types";
import { getMoodMeta } from "../data/milestones";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";

type AnimalMoodMeterProps = {
  mood: AnimalMood;
  progress: number;
  proLocked?: boolean;
};

export function AnimalMoodMeter({
  mood,
  progress,
  proLocked
}: AnimalMoodMeterProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const meta = getMoodMeta(mood);
  const fillWidth = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;

  if (proLocked) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Ionicons color={theme.colors.pro} name="lock-closed" size={18} />
          <Text style={styles.title}>Mood locked in Pro</Text>
        </View>
        <Text style={styles.helper}>
          Upgrade to rescue and care for more animals.
        </Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: "18%", backgroundColor: theme.colors.pro }
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons
          color={meta.tint}
          name={meta.icon as keyof typeof Ionicons.glyphMap}
          size={19}
        />
        <Text style={styles.title}>Mood: {meta.label}</Text>
        <Text style={styles.percent}>{formatPercent(progress)}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: fillWidth as `${number}%`, backgroundColor: meta.tint }
          ]}
        />
      </View>
      <Text style={styles.helper}>{meta.helper}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  fill: {
    borderRadius: 8,
    height: "100%"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  percent: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: "auto"
  },
  root: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 12,
    overflow: "hidden"
  }
  });
}
