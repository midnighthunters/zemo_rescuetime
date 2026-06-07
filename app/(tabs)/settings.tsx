import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { MotionView, PulseView } from "../../src/components/Motion";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import { useUnlockAudioSettings } from "../../src/features/audio/useUnlockAudioSettings";
import { useOnboarding } from "../../src/features/onboarding/useOnboarding";
import { useEntitlements } from "../../src/features/purchases/useEntitlements";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { useRemoteAssetDownloadStore } from "../../src/services/assets/remoteAssetDownloadStore";
import { ProAssetDownloadModal } from "../../src/features/assets/components/ProAssetDownloadModal";
import {
  type AppColors,
  type ThemePreference,
  useAppTheme
} from "../../src/theme/colors";
import { shadows } from "../../src/theme/shadows";
import { spacing } from "../../src/theme/spacing";

function SettingsPanel({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  return (
    <MotionView direction="fade" style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </MotionView>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const {
    formatNumber: formatLocalizedNumber,
    language,
    languageLabel,
    setLanguage,
    speechLocale,
    supportedLanguages,
    t
  } = useLanguage();
  const styles = useMemo(
    () => createStyles(theme.colors, theme.isDark),
    [theme.colors, theme.isDark]
  );
  const router = useRouter();
  const {
    activePlanId,
    isPro,
    isLoading,
    isRevenueCatConfigured,
    managementURL,
    plans,
    revenueCatDebugInfo,
    error,
    restorePurchases,
    devProEnabled,
    setDevProEnabled
  } = useEntitlements();
  const { resetOnboarding } = useOnboarding();
  const {
    isLoading: isUnlockAudioLoading,
    unlockAudioEnabled,
    setUnlockAudioEnabled
  } = useUnlockAudioSettings();
  const {
    resetProgress,
    steps,
    stepsToday
  } = useRescue();
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const { proPackStatus, clearDownloadedProAssets, getFormattedProgress } = useRemoteAssetDownloadStore();
  const { downloaded, total, label } = getFormattedProgress();
  const themeOptions = useMemo<Array<{
    label: string;
    value: ThemePreference;
  }>>(
    () => [
      { label: t("settings.themeSystem"), value: "system" },
      { label: t("settings.themeLight"), value: "light" },
      { label: t("settings.themeDark"), value: "dark" }
    ],
    [t]
  );
  const resolvedThemeLabel =
    theme.resolvedColorScheme === "dark"
      ? t("settings.themeDark")
      : t("settings.themeLight");

  const confirmReset = () => {
    Alert.alert(
      t("settings.resetProgressTitle"),
      t("settings.resetProgressMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.reset"),
          style: "destructive",
          onPress: resetProgress
        }
      ]
    );
  };

  return (
    <ScreenContainer>
      <MotionView style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t("settings.device")}</Text>
          <Text style={styles.title}>{t("settings.title")}</Text>
          <Text style={styles.subtitle}>
            {t("settings.subtitle")}
          </Text>
        </View>
        <PulseView floatDistance={4} pulseScale={1.03}>
          <UiSprite spriteKey="emptySettingsAnimal" size={92} />
        </PulseView>
      </MotionView>

      <SettingsPanel title={t("settings.pro")}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.status")}</Text>
          <Text style={[styles.rowValue, isPro && styles.success]}>
            {isPro ? t("common.proActive") : t("common.free")}
          </Text>
        </View>
        {activePlanId ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <Text style={styles.rowValue}>{activePlanId}</Text>
          </View>
        ) : null}
        <View style={styles.planSummaryGrid}>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planSummary}>
              <Text style={styles.planSummaryTitle}>{plan.title}</Text>
              <Text style={styles.planSummaryPrice}>{plan.price}</Text>
              <Text style={styles.planSummaryNote}>{plan.periodLabel}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          {t("settings.revenueCatEntitlement")}{" "}
          {t("settings.configured", {
            configured: isRevenueCatConfigured ? t("common.yes") : t("common.notYet")
          })}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          icon="refresh"
          loading={isLoading}
          onPress={restorePurchases}
          title={t("settings.restorePurchases")}
          variant="secondary"
        />
        {managementURL ? (
          <AppButton
            icon="open"
            onPress={() => Linking.openURL(managementURL)}
            title="Manage Subscription"
            variant="ghost"
          />
        ) : null}
        {!isPro ? (
          <AppButton
            icon="sparkles"
            onPress={() => router.push("/paywall")}
            title={t("settings.unlockPro")}
            variant="pro"
          />
        ) : null}
      </SettingsPanel>

      {isPro ? (
        <SettingsPanel title="Pro Rescue Pack">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.rowValue, proPackStatus === "downloaded" && styles.success]}>
              {proPackStatus.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Size</Text>
            <Text style={styles.rowValue}>
              {downloaded} / {total}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Files</Text>
            <Text style={styles.rowValue}>{label}</Text>
          </View>

          {proPackStatus !== "downloaded" ? (
            <AppButton
              icon="cloud-download-outline"
              onPress={() => setDownloadModalVisible(true)}
              title={proPackStatus === "needs_download" ? "Resume Download" : proPackStatus === "failed" ? "Retry Download" : "Download Pack"}
              variant="pro"
            />
          ) : (
            <AppButton
              icon="trash-outline"
              onPress={clearDownloadedProAssets}
              title="Clear Downloaded Pack"
              variant="danger"
            />
          )}
          
          <ProAssetDownloadModal
            visible={downloadModalVisible}
            onClose={() => setDownloadModalVisible(false)}
          />
        </SettingsPanel>
      ) : null}

      <SettingsPanel title={t("settings.steps")}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.today")}</Text>
          <Text style={styles.rowValue}>{formatLocalizedNumber(stepsToday)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.source")}</Text>
          <Text style={styles.rowValue}>{steps.sourceLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.permission")}</Text>
          <Text style={styles.rowValue}>{steps.permissionStatus}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.pedometer")}</Text>
          <Text style={styles.rowValue}>
            {steps.isAvailable ? t("settings.available") : t("settings.unavailable")}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.mode")}</Text>
          <Text style={styles.rowValue}>{steps.countingMode.replace("-", " ")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.storedToday")}</Text>
          <Text style={styles.rowValue}>
            {formatLocalizedNumber(steps.historicalStepsToday)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings.liveSession")}</Text>
          <Text style={styles.rowValue}>{formatLocalizedNumber(steps.liveSteps)}</Text>
        </View>
        {steps.countingMode === "live-session" ? (
          <Text style={styles.note}>
            {t("settings.liveSessionNote")}
          </Text>
        ) : null}
        {steps.error ? <Text style={styles.error}>{steps.error}</Text> : null}
        <AppButton
          icon="refresh"
          loading={steps.isLoading}
          onPress={steps.refreshSteps}
          title={t("settings.refreshPedometer")}
          variant="secondary"
        />
        <AppButton
          icon="settings"
          onPress={() => Linking.openSettings()}
          title={t("settings.openSettings")}
          variant="ghost"
        />
      </SettingsPanel>

      <SettingsPanel title={t("settings.sound")}>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>{t("settings.unlockAudio")}</Text>
            <Text style={styles.note}>
              {t("settings.unlockAudioNote")}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t("settings.unlockAudioA11y")}
            disabled={isUnlockAudioLoading}
            onValueChange={setUnlockAudioEnabled}
            thumbColor={unlockAudioEnabled ? theme.colors.primary : theme.colors.white}
            trackColor={{
              false: theme.colors.border,
              true: theme.isDark ? "#245A43" : "#BFE9CE"
            }}
            value={unlockAudioEnabled}
          />
        </View>
      </SettingsPanel>

      <SettingsPanel title={t("language.panelTitle")}>
        <Text style={styles.note}>{t("language.selectorLabel")}</Text>
        <View style={styles.languageGrid}>
          {supportedLanguages.map((option) => {
            const selected = language === option.code;

            return (
              <Pressable
                accessibilityLabel={`${t("language.selectorLabel")}: ${option.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.code}
                onPress={() => {
                  void setLanguage(option.code);
                }}
                style={[
                  styles.languageOption,
                  selected && styles.languageOptionSelected
                ]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.languageLabel,
                    selected && styles.languageLabelSelected
                  ]}
                >
                  {option.nativeLabel}
                </Text>
                <Text style={styles.languageMeta}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>
          {t("language.currentSpeech", {
            language: languageLabel,
            locale: speechLocale
          })}
        </Text>
      </SettingsPanel>

      <SettingsPanel title={t("settings.appearance")}>
        <View style={styles.segmentedControl}>
          {themeOptions.map((option) => {
            const selected = theme.themePreference === option.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => {
                  void theme.setThemePreference(option.value);
                }}
                style={[
                  styles.segment,
                  selected && styles.segmentSelected
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    selected && styles.segmentLabelSelected
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>
          {t("settings.currentAppearance", { scheme: resolvedThemeLabel })}
        </Text>
      </SettingsPanel>

      <SettingsPanel title={t("settings.localData")}>
        <AppButton
          icon="refresh"
          onPress={async () => {
            await resetOnboarding();
            router.replace("/onboarding");
          }}
          title={t("settings.resetOnboarding")}
          variant="ghost"
        />
        <AppButton
          icon="trash"
          onPress={confirmReset}
          title={t("settings.resetLocalProgress")}
          variant="danger"
        />
      </SettingsPanel>

      <SettingsPanel title={t("settings.testing")}>
        <Text style={styles.note}>
          RevenueCat source: {revenueCatDebugInfo.apiKeySource}. Test store:{" "}
          {revenueCatDebugInfo.usesTestStore ? t("common.yes") : t("common.notYet")}.
        </Text>
        <Text style={styles.note}>
          Test user ID: {revenueCatDebugInfo.testAppUserId}
        </Text>
        <Text style={styles.note}>
          iOS IDs: {revenueCatDebugInfo.productIds.ios.monthly} /{" "}
          {revenueCatDebugInfo.productIds.ios.yearly}
        </Text>
        <Text style={styles.note}>
          Android IDs: {revenueCatDebugInfo.productIds.android.monthly} /{" "}
          {revenueCatDebugInfo.productIds.android.yearly}
        </Text>
        <Text style={styles.note}>
          Packages: {revenueCatDebugInfo.packageIds.monthly} /{" "}
          {revenueCatDebugInfo.packageIds.yearly}
        </Text>
        <AppButton
          icon={devProEnabled ? "lock-open" : "lock-closed"}
          onPress={() => setDevProEnabled(!devProEnabled)}
          title={
            devProEnabled
              ? t("settings.disableMockPro")
              : t("settings.enableMockPro")
          }
          variant="pro"
        />
      </SettingsPanel>

      <Text style={styles.version}>
        {t("settings.version", {
          version: Constants.expoConfig?.version ?? "1.0.0"
        })}
      </Text>
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors, isDark = false) {
  return StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  languageLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  languageLabelSelected: {
    color: colors.primaryDark
  },
  languageMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  languageOption: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: 2,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  languageOptionSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary
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
    ...shadows.soft
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  planSummary: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minHeight: 76,
    padding: spacing.md
  },
  planSummaryGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  planSummaryNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  planSummaryPrice: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  planSummaryTitle: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs
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
  segment: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.sm
  },
  segmentedControl: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    padding: 3
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  segmentLabelSelected: {
    color: colors.primaryDark
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
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
    fontSize: 32,
    fontWeight: "900"
  },
  version: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  }
  });
}
