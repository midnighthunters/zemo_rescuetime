import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { formatPercent } from "../utils/format";

type CircularStepProgressProps = {
  progress: number;
};

export function CircularStepProgress({ progress }: CircularStepProgressProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { borderColor: clamped > 0.7 ? colors.primary : colors.secondary }]}>
        <Text style={styles.percent}>{formatPercent(clamped)}</Text>
        <Text style={styles.label}>Rescue</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 52,
    borderWidth: 8,
    height: 104,
    justifyContent: "center",
    width: 104
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  outer: {
    alignItems: "center",
    justifyContent: "center"
  },
  percent: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  }
});
