import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AppText } from "../src/components/AppText";
import { useOnboarding } from "../src/features/onboarding/useOnboarding";
import { useLanguage } from "../src/i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../src/theme/colors";
import { duration, easing, useReduceMotion } from "../src/theme/motion";
import { radius, spacing } from "../src/theme/spacing";

export default function IndexScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const { hasOnboarded, isLoading } = useOnboarding();

  if (isLoading) {
    return <LaunchState styles={styles} />;
  }

  return <Redirect href={hasOnboarded ? "/(tabs)/home" : "/onboarding"} />;
}

/**
 * Intentional launch state: the app mark breathes gently on the exact same
 * background as the splash screen, so there is never a blank frame or a flash.
 */
function LaunchState({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const theme = useAppTheme();
  const { t } = useLanguage();
  const reduceMotion = useReduceMotion();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      breath.setValue(0.5);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          duration: duration.progress * 2,
          easing: easing.standard,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(breath, {
          duration: duration.progress * 2,
          easing: easing.standard,
          toValue: 0,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [breath, reduceMotion]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.mark,
          reduceMotion
            ? null
            : {
                transform: [
                  {
                    scale: breath.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06]
                    })
                  }
                ]
              }
        ]}
      >
        <Ionicons color={theme.colors.brandGreenText} name="paw" size={38} />
      </Animated.View>
      <AppText align="center" role="cardTitle" tone="secondary">
        {t("home.title")}
      </AppText>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    mark: {
      alignItems: "center",
      backgroundColor: colors.brandGreenTint,
      borderRadius: radius.round,
      height: 88,
      justifyContent: "center",
      width: 88
    },
    root: {
      alignItems: "center",
      backgroundColor: colors.appBackground,
      flex: 1,
      gap: spacing.s16,
      justifyContent: "center"
    }
  });
}
