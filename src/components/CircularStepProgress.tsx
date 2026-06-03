import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { formatPercent } from "../utils/format";

type CircularStepProgressProps = {
  progress: number;
};

export function CircularStepProgress({ progress }: CircularStepProgressProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          { borderColor: clamped > 0.7 ? theme.colors.primary : theme.colors.secondary }
        ]}
      >
        <Text style={styles.percent}>{formatPercent(clamped)}</Text>
        <Text style={styles.label}>Rescue</Text>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  inner: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
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
}
