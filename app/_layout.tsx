import "react-native-gesture-handler";
import "react-native-reanimated";

import * as SystemUI from "expo-system-ui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { EntitlementProvider } from "../src/state/EntitlementProvider";
import { RescueProvider } from "../src/state/RescueProvider";
import { useAppTheme } from "../src/theme/colors";

export default function RootLayout() {
  const theme = useAppTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.backgroundBottom).catch(() => {
      // Native system UI coloring can be unavailable on some web targets.
    });
  }, [theme.colors.backgroundBottom]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <EntitlementProvider>
          <RescueProvider>
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
