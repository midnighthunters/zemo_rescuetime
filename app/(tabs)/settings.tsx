import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Alert, Linking, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useOnboarding } from "../../src/features/onboarding/useOnboarding";
import { useEntitlements } from "../../src/features/purchases/useEntitlements";
import { useRescue } from "../../src/state/RescueProvider";
import { colors } from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";
import { formatNumber } from "../../src/utils/format";

function SettingsPanel({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const {
    isPro,
    isLoading,
    isRevenueCatConfigured,
    error,
    restorePurchases,
    devProEnabled,
    setDevProEnabled
  } = useEntitlements();
  const { resetOnboarding } = useOnboarding();
  const {
    resetProgress,
    unlockFirstAnimal,
    steps,
    stepsToday
  } = useRescue();

  const confirmReset = () => {
    Alert.alert(
      "Reset local progress?",
      "This clears rescued animals and local care milestones on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetProgress
        }
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Your step data stays on your device. We only use it to calculate
          rescue progress.
        </Text>
      </View>

      <SettingsPanel title="Pro">
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, isPro && styles.success]}>
            {isPro ? "Pro active" : "Free"}
          </Text>
        </View>
        <Text style={styles.note}>
          RevenueCat entitlement: pro. Configured:{" "}
          {isRevenueCatConfigured ? "yes" : "not yet"}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          icon="refresh"
          loading={isLoading}
          onPress={restorePurchases}
          title="Restore Purchases"
          variant="secondary"
        />
        {!isPro ? (
          <AppButton
            icon="sparkles"
            onPress={() => router.push("/paywall")}
            title="Unlock Pro"
            variant="pro"
          />
        ) : null}
      </SettingsPanel>

      <SettingsPanel title="Steps">
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Today</Text>
          <Text style={styles.rowValue}>{formatNumber(stepsToday)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Permission</Text>
          <Text style={styles.rowValue}>{steps.permissionStatus}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pedometer</Text>
          <Text style={styles.rowValue}>
            {steps.isAvailable ? "available" : "unavailable"}
          </Text>
        </View>
        <AppButton
          icon="settings"
          onPress={() => Linking.openSettings()}
          title="Open Settings"
          variant="ghost"
        />
      </SettingsPanel>

      <SettingsPanel title="Local Data">
        <AppButton
          icon="refresh"
          onPress={async () => {
            await resetOnboarding();
            router.replace("/onboarding");
          }}
          title="Reset Onboarding"
          variant="ghost"
        />
        <AppButton
          icon="trash"
          onPress={confirmReset}
          title="Reset Local Progress"
          variant="danger"
        />
      </SettingsPanel>

      {__DEV__ ? (
        <SettingsPanel title="Development">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mock Pro</Text>
            <Switch
              onValueChange={setDevProEnabled}
              thumbColor={devProEnabled ? colors.primary : colors.white}
              trackColor={{ false: colors.border, true: "#BFE9CE" }}
              value={devProEnabled}
            />
          </View>
          <View style={styles.devGrid}>
            <AppButton
              onPress={() => steps.addMockSteps(100)}
              title="+100 steps"
              variant="secondary"
            />
            <AppButton
              onPress={() => steps.addMockSteps(500)}
              title="+500 steps"
              variant="secondary"
            />
            <AppButton
              onPress={() => steps.addMockSteps(1000)}
              title="+1000 steps"
              variant="secondary"
            />
            <AppButton
              onPress={steps.resetMockSteps}
              title="Reset Steps"
              variant="ghost"
            />
          </View>
          <AppButton
            icon="paw"
            onPress={unlockFirstAnimal}
            title="Unlock First Animal"
          />
        </SettingsPanel>
      ) : null}

      <Text style={styles.version}>
        Version {Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  devGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    gap: spacing.xs
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  success: {
    color: colors.primaryDark
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  version: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  }
});
