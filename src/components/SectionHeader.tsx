import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";

type SectionHeaderProps = {
  title: string;
  count?: string;
  subtitle?: string;
  trailing?: ReactNode;
};

/** Quiet grouping header used above lists, grids, and settings groups. */
export function SectionHeader({
  count,
  subtitle,
  title,
  trailing
}: SectionHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText accessibilityRole="header" role="sectionTitle">
            {title}
          </AppText>
          {count ? (
            <AppText role="supportiveMedium" tone="tertiary">
              {count}
            </AppText>
          ) : null}
        </View>
        {subtitle ? (
          <AppText role="supportive" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    root: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    titleRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: spacing.s8
    }
  });
}
