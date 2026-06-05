import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { AnimalMood } from "../data/types";
import { getMoodMeta } from "../data/milestones";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { formatPercent } from "../utils/format";
import { AnimatedProgressFill, MotionView, PulseView } from "./Motion";

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
  const clampedProgress = Math.max(0, Math.min(1, progress));

  if (proLocked) {
    return (
      <MotionView direction="fade" style={styles.root}>
        <View style={styles.header}>
          <PulseView pulseScale={1.08}>
            <Ionicons color={theme.colors.pro} name="lock-closed" size={18} />
          </PulseView>
          <Text style={styles.title}>Mood locked in Pro</Text>
        </View>
        <Text style={styles.helper}>
          Upgrade to rescue and care for more animals.
        </Text>
        <View style={styles.track}>
          <AnimatedProgressFill
            progress={0.18}
            style={[styles.fill, { backgroundColor: theme.colors.pro }]}
          />
        </View>
      </MotionView>
    );
  }

  return (
    <MotionView direction="fade" style={styles.root}>
      <View style={styles.header}>
        <PulseView active={clampedProgress > 0} pulseScale={1.08}>
          <Ionicons
            color={meta.tint}
            name={meta.icon as keyof typeof Ionicons.glyphMap}
            size={19}
          />
        </PulseView>
        <Text style={styles.title}>Mood: {meta.label}</Text>
        <Text style={styles.percent}>{formatPercent(progress)}</Text>
      </View>
      <View style={styles.track}>
        <AnimatedProgressFill
          progress={clampedProgress}
          style={[styles.fill, { backgroundColor: meta.tint }]}
        />
      </View>
      <Text style={styles.helper}>{meta.helper}</Text>
    </MotionView>
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
