import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useOnboarding } from "../src/features/onboarding/useOnboarding";
import { colors } from "../src/theme/colors";

export default function IndexScreen() {
  const { hasOnboarded, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={hasOnboarded ? "/(tabs)/home" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.backgroundBottom,
    flex: 1,
    justifyContent: "center"
  }
});
