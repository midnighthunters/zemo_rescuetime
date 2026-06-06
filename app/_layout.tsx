import "react-native-gesture-handler";
import "react-native-reanimated";

import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { UnlockNotificationBridge } from "../src/features/notifications/UnlockNotificationBridge";
import { requestStartupNotificationPermission } from "../src/features/notifications/unlockNotifications";
import { EntitlementProvider } from "../src/state/EntitlementProvider";
import { RescueProvider } from "../src/state/RescueProvider";
import { ThemeProvider, useAppTheme } from "../src/theme/colors";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutShell />
    </ThemeProvider>
  );
}

function RootLayoutShell() {
  const theme = useAppTheme();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.backgroundBottom).catch(() => {
      // Native system UI coloring can be unavailable on some web targets.
    });
  }, [theme.colors.backgroundBottom]);

  useEffect(() => {
    void requestStartupNotificationPermission().catch(() => {
      // Notification permission is optional; unlock cards still work in-app.
    });
  }, []);

  // Track when theme is loaded
  useEffect(() => {
    if (!theme.isThemeLoading) {
      setAppReady(true);
    }
  }, [theme.isThemeLoading]);

  // Failsafe: Force hide splash screen after maximum wait time
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {
        // Splash screen might already be hidden
      });
    }, 5000); // 5 second maximum wait

    return () => clearTimeout(failsafeTimeout);
  }, []);

  // Hide splash screen when app is ready
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <EntitlementProvider>
          <RescueProvider>
            <UnlockNotificationBridge />
            <StatusBar
              backgroundColor={theme.colors.backgroundBottom}
              style={theme.statusBarStyle}
            />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.backgroundBottom },
                headerShown: false
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="paywall" />
              <Stack.Screen name="animal/[id]" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </RescueProvider>
        </EntitlementProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
