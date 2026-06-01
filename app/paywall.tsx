import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../src/components/AppButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useEntitlements } from "../src/features/purchases/useEntitlements";
import { colors } from "../src/theme/colors";
import { shadows } from "../src/theme/shadows";
import { spacing } from "../src/theme/spacing";

const benefits = [
  "Unlock all rescue milestones",
  "Save every locked animal",
  "See full happy animal collection",
  "Premium rescue animations",
  "Support new animal worlds"
];

export default function PaywallScreen() {
  const {
    purchasePro,
    restorePurchases,
    isLoading,
    error,
    isPro,
    devProEnabled,
    setDevProEnabled
  } = useEntitlements();

  const handlePurchase = async () => {
    const purchased = await purchasePro();
    if (purchased) {
      router.replace("/(tabs)/home");
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Pro Rescue Pass</Text>
        <Text style={styles.title}>Rescue Every Animal</Text>
        <Text style={styles.subtitle}>
          Your first rescue is free. Unlock Pro to continue saving every animal
          waiting for help.
        </Text>
      </View>

      <View style={styles.card}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.benefit}>{benefit}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isPro ? <Text style={styles.success}>Pro is active.</Text> : null}

      <AppButton
        icon="sparkles"
        loading={isLoading}
        onPress={handlePurchase}
        title="Unlock Pro"
        variant="pro"
      />
      <AppButton
        icon="refresh"
        loading={isLoading}
        onPress={handleRestore}
        title="Restore Purchase"
        variant="secondary"
      />
      {__DEV__ ? (
        <AppButton
          icon={devProEnabled ? "lock-open" : "lock-closed"}
          onPress={() => setDevProEnabled(!devProEnabled)}
          title={devProEnabled ? "Disable Mock Pro" : "Enable Mock Pro"}
          variant="ghost"
        />
      ) : null}
      <AppButton
        onPress={() => router.back()}
        title="Not Now"
        variant="ghost"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  benefit: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22
  },
  benefitRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card
  },
  check: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900"
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  eyebrow: {
    color: colors.pro,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xl
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23
  },
  success: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 41
  }
});
