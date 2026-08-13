import type { PropsWithChildren, ReactNode } from "react";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "../theme/colors";
import { getTabBarClearance, useResponsiveLayout } from "../theme/layout";
import { spacing } from "../theme/spacing";

type ScreenScaffoldProps = PropsWithChildren<{
  /** Scrollable by default; pass false for fixed, full-height layouts. */
  scroll?: boolean;
  /** Adds clearance for the floating tab bar. */
  withTabBar?: boolean;
  /** Vertical gap between direct children. */
  gap?: number;
  background?: "app" | "grouped" | "surface";
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  scrollRef?: React.Ref<ScrollView>;
}>;

/**
 * The single screen shell: safe areas, theme background, readable max width on
 * iPad, responsive gutters, and scroll clearance for the floating tab bar.
 */
export function ScreenScaffold({
  background = "app",
  children,
  contentStyle,
  footer,
  gap = spacing.s16,
  scroll = true,
  scrollRef,
  withTabBar = true
}: ScreenScaffoldProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();

  const backgroundColor =
    background === "surface"
      ? theme.colors.surfacePrimary
      : background === "grouped"
        ? theme.colors.groupedBackground
        : theme.colors.appBackground;

  const bottomPadding = withTabBar
    ? getTabBarClearance(insets.bottom) + spacing.s16
    : Math.max(insets.bottom, spacing.s16) + spacing.s8;

  const contentContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      styles.content,
      {
        gap,
        maxWidth: layout.contentMaxWidth,
        paddingHorizontal: layout.gutter,
        paddingTop: insets.top + spacing.s8,
        width: "100%"
      },
      contentStyle
    ],
    [contentStyle, gap, insets.top, layout.contentMaxWidth, layout.gutter]
  );

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor }]}>
        <View style={[styles.centering, { paddingBottom: bottomPadding }]}>
          <View style={contentContainerStyle}>{children}</View>
        </View>
        {footer}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={contentContainerStyle}>{children}</View>
      </ScrollView>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  centering: {
    alignItems: "center",
    flex: 1
  },
  content: {
    alignSelf: "center",
    flexGrow: 1
  },
  root: {
    flex: 1
  },
  scrollContent: {
    alignItems: "center",
    flexGrow: 1
  }
});
