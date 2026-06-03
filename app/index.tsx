import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useOnboarding } from "../src/features/onboarding/useOnboarding";
import { type AppColors, useAppTheme } from "../src/theme/colors";

export default function IndexScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const { hasOnboarded, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={hasOnboarded ? "/(tabs)/home" : "/onboarding"} />;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.backgroundBottom,
    flex: 1,
    justifyContent: "center"
  }
  });
}
