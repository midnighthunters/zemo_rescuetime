import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "../theme/colors";
import { duration, easing, useReduceMotion } from "../theme/motion";
import { radius, spacing } from "../theme/spacing";

type SkeletonBlockProps = {
  height?: number;
  width?: number | `${number}%`;
  round?: number;
  style?: StyleProp<ViewStyle>;
};

/** Stable placeholder block; fades gently unless Reduce Motion is enabled. */
export function SkeletonBlock({
  height = 16,
  round = radius.chip,
  style,
  width = "100%"
}: SkeletonBlockProps) {
  const theme = useAppTheme();
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(reduceMotion ? 1 : 0.55)).current;

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          duration: duration.progress,
          easing: easing.standard,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(value, {
          duration: duration.progress,
          easing: easing.standard,
          toValue: 0.55,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [reduceMotion, value]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surfaceNeutral,
          borderRadius: round,
          height,
          opacity: value,
          width
        },
        style
      ]}
    />
  );
}

/** Card-shaped loading placeholder that matches the real card geometry. */
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: theme.colors.surfacePrimary,
          borderColor: theme.colors.separator,
          borderCurve: "continuous",
          borderRadius: radius.card,
          borderWidth: StyleSheet.hairlineWidth,
          gap: spacing.s12,
          padding: spacing.s16
        }
      }),
    [theme.colors.separator, theme.colors.surfacePrimary]
  );

  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={styles.root}>
      <SkeletonBlock height={24} width="55%" />
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock
          height={14}
          key={`skeleton-line-${index}`}
          width={index === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </View>
  );
}
