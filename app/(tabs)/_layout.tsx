import { Tabs } from "expo-router";

import { FloatingTabBar } from "../../src/components/FloatingTabBar";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useAppTheme } from "../../src/theme/colors";

export default function TabsLayout() {
  const theme = useAppTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.appBackground
        },
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="animals" options={{ title: t("tabs.animals") }} />
      <Tabs.Screen name="progress" options={{ title: t("tabs.progress") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
