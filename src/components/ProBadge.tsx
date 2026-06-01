import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function ProBadge() {
  return (
    <View accessibilityLabel="Requires Pro" style={styles.badge}>
      <Ionicons color={colors.text} name="star" size={12} />
      <Text style={styles.text}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: 11,
    fontWeight: "900"
  }
});
