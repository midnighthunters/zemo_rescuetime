import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { type AppColors, useAppTheme } from "../theme/colors";
import { elevation } from "../theme/shadows";
import { radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";

export type SegmentedOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** iOS-style segmented control used for filters and theme selection. */
export function SegmentedControl<T extends string>({
  onChange,
  options,
  style,
  value
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );

  return (
    <View accessibilityRole="tablist" style={[styles.container, style]}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              selected && elevation("soft", theme.isDark, theme.colors.shadowColor),
              pressed && !selected && styles.segmentPressed
            ]}
          >
            <AppText
              numberOfLines={1}
              role="supportiveMedium"
              tone={selected ? "primary" : "secondary"}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surfaceNeutral : colors.surfaceNeutral,
      borderCurve: "continuous",
      borderRadius: radius.segment,
      flexDirection: "row",
      gap: 2,
      padding: 3
    },
    segment: {
      alignItems: "center",
      borderCurve: "continuous",
      borderRadius: radius.control,
      flex: 1,
      justifyContent: "center",
      minHeight: 38,
      paddingHorizontal: spacing.s8
    },
    segmentPressed: {
      opacity: 0.7
    },
    segmentSelected: {
      backgroundColor: colors.surfacePrimary
    }
  });
}
