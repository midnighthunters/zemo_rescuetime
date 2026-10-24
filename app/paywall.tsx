import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";

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

const GOOGLE_PLAY_SUBSCRIPTION_URL =
  "https://play.google.com/store/account/subscriptions?package=com.zemolabs.rescuetime";

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
    error,
    isLoading,
    isPro,
    managementURL,
    plans,
    purchasePro,
    restorePurchases
  } = useEntitlements();

  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ??
      plans.find((plan) => plan.id === "yearly") ??
      plans[0],
    [plans, selectedPlanId]
  );

  const benefits = [
    { icon: "trophy-outline" as const, text: t("paywall.benefit.milestones") },
    { icon: "paw-outline" as const, text: t("paywall.benefit.animals") },
    { icon: "images-outline" as const, text: t("paywall.benefit.collection") },
    { icon: "sparkles-outline" as const, text: t("paywall.benefit.premiumAnimations") },
    { icon: "heart-outline" as const, text: t("paywall.benefit.newWorlds") }
  ];

  const handlePurchase = async () => {
    if (!selectedPlan?.isAvailable) {
      Alert.alert(
        "Subscription Connecting",
        "Google Play Store is currently connecting or verifying subscription details. Please check your internet connection, confirm you are signed into Google Play, and try again."
      );
      return;
    }

    try {
      const purchased = await purchasePro(selectedPlan.id);
      if (purchased) {
        Alert.alert(
          "Welcome to Pro!",
          "Thank you for supporting animal rescue! All Pro animals and features are now unlocked.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]
        );
      }
    } catch (caught: any) {
      Alert.alert(
        "Purchase Incomplete",
        caught?.message ?? "Unable to complete Google Play purchase."
      );
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          "Purchases Restored",
          "Your previous Pro subscription has been restored successfully!",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]
        );
      } else {
        Alert.alert(
          "No Active Subscription",
          "No active subscription was found for this Google Play account. If you purchased using another Google account, please check that account in the Google Play Store.",
          [{ text: "OK" }]
        );
      }
    } catch (caught: any) {
      Alert.alert(
        "Restore Error",
        caught?.message ?? "Could not connect to Google Play to restore purchases."
      );
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

      {/* ── Plans (Always Show Both Monthly & Yearly) ── */}
      {isPro ? (
        <PremiumCard gap={spacing.s8} variant="sanctuary">
          <StatusChip icon="shield-checkmark" label={t("common.proActive")} tone="safe" />
          <AppText role="cardTitle">{t("paywall.success")}</AppText>
        </PremiumCard>
      ) : (
        <>
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
          {!isLoading && plans.every((plan) => !plan.isAvailable) ? (
            <PremiumCard gap={spacing.s8} variant="warning">
              <StatusChip
                icon="alert-circle"
                label={t("paywall.plansUnavailableTitle") || "Store Connecting"}
                tone="warning"
              />
              <AppText role="supportive" tone="secondary">
                {error ||
                  t("paywall.plansUnavailableBody") ||
                  "Plans can't be loaded right now. Please try again later."}
              </AppText>
            </PremiumCard>
          ) : null}
        </>
      )}

      {error && plans.some((p) => p.isAvailable) ? (
        <AppText align="center" role="caption" selectable tone="danger">
          {error}
        </AppText>
      ) : null}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <AppButton
          disabled={isPro || (selectedPlan ? !selectedPlan.isAvailable : false)}
          icon="sparkles"
          loading={isLoading}
          onPress={handlePurchase}
          title={
            isPro
              ? t("common.proActive")
              : !selectedPlan?.isAvailable
                ? t("paywall.planUnavailable") || "Currently unavailable"
                : selectedPlan?.id === "monthly"
                  ? `Start Monthly — ${selectedPlan.price} / mo`
                  : `Start Yearly — ${selectedPlan?.price ?? "$20"} / yr (Save 44%)`
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
      </View>

      {/* ── Subscription Terms & Cancellation ── */}
      <View style={styles.termsContainer}>
        <AppText align="center" role="caption" tone="tertiary">
          {t("paywall.terms") ||
            "Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current billing cycle. Payment is charged to your Google Play account."}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Linking.openURL(managementURL || GOOGLE_PLAY_SUBSCRIPTION_URL)
          }
          style={styles.cancelLinkButton}
        >
          <Ionicons
            color={theme.colors.brandGreenText}
            name="open-outline"
            size={14}
          />
          <AppText role="caption" style={styles.cancelLinkText}>
            Manage or Cancel Subscription (Google Play)
          </AppText>
        </Pressable>
      </View>
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
        disabled: isLoading
      }}
      disabled={isLoading}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planCard,
        isSelected && styles.planCardSelected,
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
        {plan.detail || (plan.id === "monthly" ? "Billed monthly" : "$1.67 per month")}
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
    cancelLinkButton: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s4,
      marginTop: spacing.s4,
      paddingVertical: spacing.s4
    },
    cancelLinkText: {
      color: colors.brandGreenText,
      fontWeight: "600",
      textDecorationLine: "underline"
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
    termsContainer: {
      alignItems: "center",
      gap: spacing.s4,
      marginTop: spacing.s8,
      paddingHorizontal: spacing.s12
    },
    topBar: {
      alignItems: "flex-start",
      flexDirection: "row"
    }
  });
}
