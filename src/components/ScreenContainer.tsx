import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  type ViewStyle
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { MotionView } from "./Motion";

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
    <MotionView direction="fade" style={[styles.content, contentStyle]}>
      {children}
    </MotionView>
  );

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.root}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        {scroll ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
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
