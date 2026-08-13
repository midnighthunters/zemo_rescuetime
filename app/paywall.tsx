import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "../src/components/AppButton";
import { AppText } from "../src/components/AppText";
import { IconButton } from "../src/components/IconButton";
import { MotionView } from "../src/components/Motion";
import { PremiumCard } from "../src/components/PremiumCard";
import { ScreenScaffold } from "../src/components/ScreenScaffold";
import { StatusChip } from "../src/components/StatusChip";
import { UiSprite } from "../src/components/UiSprite";
import type {
  RevenueCatPlan,
  RevenueCatPlanId
} from "../src/features/purchases/purchaseService";
import { useEntitlements } from "../src/features/purchases/useEntitlements";
import { useLanguage } from "../src/i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../src/theme/colors";
import { useResponsiveLayout } from "../src/theme/layout";
import { pressScale } from "../src/theme/motion";
import { radius, spacing } from "../src/theme/spacing";

export default function PaywallScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { t } = useLanguage();
  const [selectedPlanId, setSelectedPlanId] = useState<RevenueCatPlanId>("yearly");
  const {
    devProEnabled,
    error,
    isLoading,
    isPro,
    isRevenueCatConfigured,
    plans,
    purchasePro,
    restorePurchases,
    setDevProEnabled
  } = useEntitlements();

  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ??
      plans.find((plan) => plan.id === "yearly") ??
      plans[0],
    [plans, selectedPlanId]
  );

  const availablePlans = plans.filter((plan) => plan.isAvailable);
  const hasNoPlans = availablePlans.length === 0;

  const benefits = [
    { icon: "trophy-outline" as const, text: t("paywall.benefit.milestones") },
    { icon: "paw-outline" as const, text: t("paywall.benefit.animals") },
    { icon: "images-outline" as const, text: t("paywall.benefit.collection") },
    { icon: "sparkles-outline" as const, text: t("paywall.benefit.premiumAnimations") },
    { icon: "heart-outline" as const, text: t("paywall.benefit.newWorlds") }
  ];

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

  return (
    <ScreenScaffold withTabBar={false}>
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel={t("common.notNow")}
          icon="close"
          onPress={() => router.back()}
          variant="surface"
        />
      </View>

      {/* ── Sanctuary hero ── */}
      <MotionView style={styles.hero}>
        <UiSprite
          size={layout.isCompact ? 108 : 132}
          spriteKey="proAnimalFamily"
        />
        <StatusChip icon="star" label={t("paywall.eyebrow")} tone="pro" />
        <AppText align="center" role="largeTitle">
          {t("paywall.title")}
        </AppText>
        <AppText align="center" role="supportive" tone="secondary">
          {t("paywall.subtitle")}
        </AppText>
      </MotionView>

      {/* ── Benefits ── */}
      <MotionView delay={60}>
        <PremiumCard gap={spacing.s12} variant="standard">
          {benefits.map((benefit) => (
            <View key={benefit.text} style={styles.benefitRow}>
              <Ionicons
                color={theme.colors.brandGreenText}
                name={benefit.icon}
                size={20}
              />
              <AppText role="bodyMedium" style={styles.benefitText}>
                {benefit.text}
              </AppText>
            </View>
          ))}
        </PremiumCard>
      </MotionView>

      {/* ── Plans ── */}
      {isPro ? (
        <PremiumCard gap={spacing.s8} variant="sanctuary">
          <StatusChip icon="shield-checkmark" label={t("common.proActive")} tone="safe" />
          <AppText role="cardTitle">{t("paywall.success")}</AppText>
        </PremiumCard>
      ) : hasNoPlans ? (
        <PremiumCard gap={spacing.s8} variant="warning">
          <StatusChip icon="alert-circle" label={t("paywall.plansUnavailableTitle")} tone="warning" />
          <AppText role="supportive" tone="secondary">
            {t("paywall.plansUnavailableBody")}
          </AppText>
        </PremiumCard>
      ) : (
        <MotionView delay={110} style={styles.planGrid}>
          {plans.map((plan) => (
            <PlanOption
              isLoading={isLoading}
              isSelected={plan.id === selectedPlan?.id}
              key={plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
              plan={plan}
            />
          ))}
        </MotionView>
      )}

      {!isRevenueCatConfigured ? (
        <AppText align="center" role="caption" tone="tertiary">
          {t("paywall.revenueCatMissing")}
        </AppText>
      ) : null}
      {error ? (
        <AppText align="center" role="caption" selectable tone="danger">
          {error}
        </AppText>
      ) : null}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <AppButton
          disabled={!selectedPlan?.isAvailable || isPro}
          icon="sparkles"
          loading={isLoading}
          onPress={handlePurchase}
          title={
            isPro
              ? t("common.proActive")
              : selectedPlan
                ? t("paywall.startPlan", {
                    price: selectedPlan.price,
                    title: selectedPlan.title
                  })
                : t("settings.unlockPro")
          }
          variant="pro"
        />
        <AppButton
          loading={isLoading}
          onPress={handleRestore}
          title={t("paywall.restore")}
          variant="secondary"
        />
        <AppButton
          onPress={() => router.back()}
          title={t("common.notNow")}
          variant="ghost"
        />
        {__DEV__ ? (
          <AppButton
            icon={devProEnabled ? "lock-open" : "lock-closed"}
            onPress={() => setDevProEnabled(!devProEnabled)}
            size="compact"
            title={
              devProEnabled
                ? t("settings.disableMockPro")
                : t("settings.enableMockPro")
            }
            variant="ghost"
          />
        ) : null}
      </View>

      <AppText align="center" role="caption" tone="tertiary">
        {t("paywall.terms")}
      </AppText>
    </ScreenScaffold>
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
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const { t } = useLanguage();

  return (
    <Pressable
      accessibilityLabel={`${plan.title} ${plan.price} ${plan.periodLabel}`}
      accessibilityRole="radio"
      accessibilityState={{
        checked: isSelected,
        disabled: isLoading || !plan.isAvailable
      }}
      disabled={isLoading || !plan.isAvailable}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planCard,
        isSelected && styles.planCardSelected,
        !plan.isAvailable && styles.planCardUnavailable,
        pressed && !isLoading && styles.planCardPressed
      ]}
    >
      <View style={styles.planHeader}>
        <Ionicons
          color={
            isSelected ? theme.colors.brandGreenText : theme.colors.textTertiary
          }
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={22}
        />
        <View style={styles.planCopy}>
          <AppText role="cardTitle">{plan.title}</AppText>
          <AppText role="caption" tone="secondary">
            {plan.periodLabel}
          </AppText>
        </View>
        {plan.badge ? <StatusChip label={plan.badge} tone="pro" /> : null}
      </View>
      <AppText role="metric">{plan.price}</AppText>
      <AppText role="caption" tone="secondary">
        {plan.isAvailable ? plan.detail : t("paywall.planUnavailable")}
      </AppText>
    </Pressable>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    actions: {
      gap: spacing.s8
    },
    benefitRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    benefitText: {
      flex: 1
    },
    hero: {
      alignItems: "center",
      gap: spacing.s8
    },
    planCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.separatorStrong,
      borderCurve: "continuous",
      borderRadius: radius.card,
      borderWidth: 1,
      gap: spacing.s4,
      padding: spacing.s16
    },
    planCardPressed: {
      transform: [{ scale: pressScale }]
    },
    planCardSelected: {
      backgroundColor: colors.brandGreenTint,
      borderColor: colors.brandGreen,
      borderWidth: 2
    },
    planCardUnavailable: {
      opacity: 0.6
    },
    planCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0
    },
    planGrid: {
      gap: spacing.s12
    },
    planHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s8
    },
    topBar: {
      alignItems: "flex-start",
      flexDirection: "row"
    }
  });
}
