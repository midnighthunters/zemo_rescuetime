import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppColors, useAppTheme } from "../theme/colors";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN, useResponsiveLayout } from "../theme/layout";
import { duration, easing, useReduceMotion } from "../theme/motion";
import { elevation } from "../theme/shadows";
import { HIT_SLOP_SIZE, radius, spacing } from "../theme/spacing";
import { AppText } from "./AppText";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  animals: { active: "paw", inactive: "paw-outline" },
  home: { active: "home", inactive: "home-outline" },
  progress: { active: "stats-chart", inactive: "stats-chart-outline" },
  settings: { active: "settings", inactive: "settings-outline" }
};

/**
 * Floating iOS-style tab bar: softly elevated rounded container, tonal capsule
 * behind the active destination, readable labels, and safe-area aware insets.
 */
export function FloatingTabBar({
  descriptors,
  navigation,
  state
}: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom - 4, TAB_BAR_MARGIN),
          paddingHorizontal: layout.gutter
        }
      ]}
    >
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          { maxWidth: layout.isLarge ? 520 : undefined }
        ]}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof descriptor.options.title === "string"
              ? descriptor.options.title
              : route.name;

          return (
            <TabItem
              focused={focused}
              key={route.key}
              label={label}
              name={route.name}
              onPress={() => {
                const event = navigation.emit({
                  canPreventDefault: true,
                  target: route.key,
                  type: "tabPress"
                });

                if (focused || event.defaultPrevented) {
                  return;
                }

                if (Platform.OS !== "web") {
                  void Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  ).catch(() => {
                    // Optional feedback only.
                  });
                }

                navigation.navigate(route.name, route.params);
              }}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  focused,
  label,
  name,
  onPress,
  styles
}: {
  focused: boolean;
  label: string;
  name: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const icons = ICONS[name] ?? { active: "ellipse", inactive: "ellipse-outline" };

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(focused ? 1 : 0);
      return undefined;
    }

    const animation = Animated.timing(value, {
      duration: duration.state,
      easing: easing.settle,
      toValue: focused ? 1 : 0,
      useNativeDriver: true
    });

    animation.start();

    return () => animation.stop();
  }, [focused, reduceMotion, value]);

  const scale = value.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.item}
    >
      <View style={[styles.capsule, focused && styles.capsuleActive]}>
        <Animated.View style={reduceMotion ? undefined : { transform: [{ scale }] }}>
          <Ionicons
            color={focused ? styles.activeColor.color : styles.inactiveColor.color}
            name={focused ? icons.active : icons.inactive}
            size={22}
          />
        </Animated.View>
      </View>
      <AppText
        numberOfLines={1}
        role="caption"
        style={styles.label}
        tone={focused ? "green" : "secondary"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    activeColor: {
      color: colors.brandGreenText
    },
    bar: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.tabBar,
      borderColor: colors.tabBarBorder,
      borderCurve: "continuous",
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: TAB_BAR_HEIGHT,
      paddingHorizontal: spacing.s8,
      paddingVertical: spacing.s8,
      width: "100%",
      ...elevation("hero", isDark, colors.shadowColor)
    },
    capsule: {
      alignItems: "center",
      borderRadius: radius.round,
      height: 30,
      justifyContent: "center",
      minWidth: 52
    },
    capsuleActive: {
      backgroundColor: colors.brandGreenTint
    },
    inactiveColor: {
      color: colors.textSecondary
    },
    item: {
      alignItems: "center",
      flex: 1,
      gap: 2,
      justifyContent: "center",
      minHeight: HIT_SLOP_SIZE,
      paddingHorizontal: 2
    },
    label: {
      fontSize: 11,
      lineHeight: 14
    },
    wrapper: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0
    }
  });
}
