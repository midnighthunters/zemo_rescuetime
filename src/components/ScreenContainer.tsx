import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
}>;

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const content = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.root}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 112 + insets.bottom }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: spacing.xl
  },
  root: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing.xxl
  }
});
