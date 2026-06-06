import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../src/components/AppButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { UiSprite } from "../src/components/UiSprite";
import { useEntitlements } from "../src/features/purchases/useEntitlements";
import type {
  RevenueCatPlan,
  RevenueCatPlanId
} from "../src/features/purchases/purchaseService";
import { useLanguage } from "../src/i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../src/theme/colors";
import { shadows } from "../src/theme/shadows";
import { spacing } from "../src/theme/spacing";

export default function PaywallScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const { t } = useLanguage();
  const [selectedPlanId, setSelectedPlanId] =
    useState<RevenueCatPlanId>("yearly");
  const {
    purchasePro,
    restorePurchases,
    isLoading,
    error,
    isPro,
    isRevenueCatConfigured,
    plans,
    devProEnabled,
    setDevProEnabled
  } = useEntitlements();
  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ??
      plans.find((plan) => plan.id === "yearly") ??
      plans[0],
    [plans, selectedPlanId]
  );

  const handlePurchase = async () => {
    const purchased = await purchasePro(selectedPlan?.id ?? "yearly");
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
  const benefits = [
    t("paywall.benefit.milestones"),
    t("paywall.benefit.animals"),
    t("paywall.benefit.collection"),
    t("paywall.benefit.premiumAnimations"),
    t("paywall.benefit.newWorlds")
  ];

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <UiSprite spriteKey="proSanctuaryGate" size={136} style={styles.heroSprite} />
        <Text style={styles.eyebrow}>{t("paywall.eyebrow")}</Text>
        <Text style={styles.title}>{t("paywall.title")}</Text>
        <Text style={styles.subtitle}>
          {t("paywall.subtitle")}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.proFamilyRow}>
          <UiSprite spriteKey="proAnimalFamily" size={92} />
          <UiSprite spriteKey="proGoldenKey" size={72} />
          <UiSprite spriteKey="proTreasureChest" size={82} />
        </View>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons
              color={theme.colors.primary}
              name="checkmark-circle"
              size={21}
            />
            <Text style={styles.benefit}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.planGrid}>
        {plans.map((plan) => (
          <PlanOption
            isLoading={isLoading}
            isSelected={plan.id === selectedPlan?.id}
            key={plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
            plan={plan}
          />
        ))}
      </View>

      {!isRevenueCatConfigured ? (
        <Text style={styles.note}>
          {t("paywall.revenueCatMissing")}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isPro ? <Text style={styles.success}>{t("paywall.success")}</Text> : null}

      <AppButton
        icon="sparkles"
        disabled={!selectedPlan?.isAvailable || isPro}
        loading={isLoading}
        onPress={handlePurchase}
        title={
          isPro
            ? t("common.proActive")
            : selectedPlan
              ? t("paywall.startPlan", {
                  title: selectedPlan.title,
                  price: selectedPlan.price
                })
              : t("settings.unlockPro")
        }
        variant="pro"
      />
      <AppButton
        icon="refresh"
        loading={isLoading}
        onPress={handleRestore}
        title={t("paywall.restore")}
        variant="secondary"
      />
      {__DEV__ ? (
        <AppButton
          icon={devProEnabled ? "lock-open" : "lock-closed"}
          onPress={() => setDevProEnabled(!devProEnabled)}
          title={
            devProEnabled
              ? t("settings.disableMockPro")
              : t("settings.enableMockPro")
          }
          variant="ghost"
        />
      ) : null}
      <AppButton
        onPress={() => router.back()}
        title={t("common.notNow")}
        variant="ghost"
      />
    </ScreenContainer>
  );
}

function PlanOption({
  isLoading,
  isSelected,
  onSelect,
  plan
}: {
  isLoading: boolean;
  isSelected: boolean;
  onSelect: () => void;
  plan: RevenueCatPlan;
}) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading, selected: isSelected }}
      disabled={isLoading}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planCard,
        isSelected && styles.planCardSelected,
        !plan.isAvailable && styles.planCardUnavailable,
        pressed && !isLoading && styles.planCardPressed
      ]}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Ionicons
            color={isSelected ? theme.colors.primaryDark : theme.colors.muted}
            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
            size={21}
          />
          <Text style={styles.planTitle}>{plan.title}</Text>
        </View>
        {plan.badge ? <Text style={styles.planBadge}>{plan.badge}</Text> : null}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.period}>{plan.periodLabel}</Text>
      </View>
      <Text style={styles.planDetail}>{plan.detail}</Text>
      {__DEV__ ? <Text style={styles.planId}>{plan.productId}</Text> : null}
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
      ...shadows.soft
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
      alignItems: "flex-start",
      gap: spacing.md,
      paddingTop: spacing.xl
    },
    heroSprite: {
      alignSelf: "center"
    },
    note: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
      textAlign: "center"
    },
    period: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800",
      paddingBottom: 4
    },
    planBadge: {
      backgroundColor: colors.surfaceWarm,
      borderColor: colors.border,
      borderRadius: 7,
      borderWidth: 1,
      color: colors.pro,
      fontSize: 11,
      fontWeight: "900",
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      textTransform: "uppercase"
    },
    planCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: spacing.sm,
      minHeight: 132,
      padding: spacing.md
    },
    planCardPressed: {
      transform: [{ scale: 0.99 }]
    },
    planCardSelected: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.primary,
      borderWidth: 2
    },
    planCardUnavailable: {
      opacity: 0.72
    },
    planDetail: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18
    },
    planGrid: {
      gap: spacing.md
    },
    planHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between"
    },
    planId: {
      color: colors.locked,
      fontSize: 11,
      fontWeight: "700"
    },
    planTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900"
    },
    planTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm
    },
    price: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "900",
      lineHeight: 35
    },
    priceRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs
    },
    proFamilyRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
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
}
