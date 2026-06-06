import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { PulseView } from "./Motion";

export function ProBadge() {
  const theme = useAppTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme.colors);

  return (
    <View accessibilityLabel={t("a11y.requiresPro")} style={styles.badge}>
      <PulseView pulseScale={1.16}>
        <Ionicons color="#172033" name="star" size={12} />
      </PulseView>
      <Text style={styles.text}>{t("common.pro")}</Text>
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
