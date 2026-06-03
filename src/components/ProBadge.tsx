import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function ProBadge() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);

  return (
    <View accessibilityLabel="Requires Pro" style={styles.badge}>
      <Ionicons color="#172033" name="star" size={12} />
      <Text style={styles.text}>PRO</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  text: {
    color: "#172033",
    fontSize: 11,
    fontWeight: "900"
  }
  });
}
