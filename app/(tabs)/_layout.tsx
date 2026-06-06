import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useAppTheme } from "../../src/theme/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.backgroundBottom
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "900"
        },
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderColor: theme.colors.border,
          borderRadius: 8,
          borderTopWidth: 1,
          borderWidth: 1,
          bottom: Math.max(insets.bottom, 12),
          boxShadow: theme.isDark
            ? "0 10px 30px rgba(0, 0, 0, 0.32)"
            : "0 10px 30px rgba(19, 37, 31, 0.12)",
          height: 66,
          left: 16,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          right: 16
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="home" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="animals"
        options={{
          title: t("tabs.animals"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="paw" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t("tabs.progress"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="trail-sign" size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings" size={size} />
          )
        }}
      />
    </Tabs>
  );
}
