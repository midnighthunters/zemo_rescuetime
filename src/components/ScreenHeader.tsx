import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";
import { MotionView } from "./Motion";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Renders a native-feeling circular back control. */
  onBack?: () => void;
  backAccessibilityLabel?: string;
  /** Compact trailing action or small piece of artwork. */
  trailing?: ReactNode;
  compact?: boolean;
};

/**
 * Consistent screen title block. Titles stay in the `screenTitle` role so no
 * screen invents its own oversized display type.
 */
export function ScreenHeader({
  backAccessibilityLabel,
  compact = false,
  eyebrow,
  onBack,
  subtitle,
  title,
  trailing
}: ScreenHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <MotionView style={styles.root}>
      {onBack ? (
        <IconButton
          accessibilityLabel={backAccessibilityLabel ?? title}
          icon="chevron-back"
          onPress={onBack}
        />
      ) : null}
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText role="label" tone="secondary">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText
          accessibilityRole="header"
          numberOfLines={2}
          role={compact ? "sectionTitle" : "screenTitle"}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText role="supportive" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </MotionView>
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
    trailing: {
      alignItems: "center",
      justifyContent: "center"
    }
  });
}
