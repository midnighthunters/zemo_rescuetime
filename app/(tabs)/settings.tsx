import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { MotionView } from "../../src/components/Motion";
import { PremiumCard } from "../../src/components/PremiumCard";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { SectionHeader } from "../../src/components/SectionHeader";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { SettingGroup, SettingRow } from "../../src/components/SettingRow";
import { StatusChip } from "../../src/components/StatusChip";
import { ProAssetDownloadModal } from "../../src/features/assets/components/ProAssetDownloadModal";
import { useUnlockAudioSettings } from "../../src/features/audio/useUnlockAudioSettings";
import { useOnboarding } from "../../src/features/onboarding/useOnboarding";
import { useEntitlements } from "../../src/features/purchases/useEntitlements";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRemoteAssetDownloadStore } from "../../src/services/assets/remoteAssetDownloadStore";
import { useRescue } from "../../src/state/RescueProvider";
import {
  type ThemePreference,
  useAppTheme
} from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(), []);
  const {
    formatNumber: formatLocalizedNumber,
    language,
    languageLabel,
    setLanguage,
    speechLocale,
    supportedLanguages,
    t
  } = useLanguage();
  const {
    devProEnabled,
    error,
    isLoading,
    isPro,
    isRevenueCatConfigured,
    managementURL,
    restorePurchases,
    revenueCatDebugInfo,
    setDevProEnabled
  } = useEntitlements();
  const { resetOnboarding } = useOnboarding();
  const {
    isLoading: isUnlockAudioLoading,
    setUnlockAudioEnabled,
    unlockAudioEnabled
  } = useUnlockAudioSettings();
  const { resetProgress, steps, stepsToday } = useRescue();
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [showStepDiagnostics, setShowStepDiagnostics] = useState(false);
  const {
    clearDownloadedProAssets,
    getFormattedProgress,
    proPackStatus
  } = useRemoteAssetDownloadStore();
  const { downloaded, label, total } = getFormattedProgress();

  const themeOptions = useMemo(
    () => [
      { label: t("settings.themeSystem"), value: "system" as ThemePreference },
      { label: t("settings.themeLight"), value: "light" as ThemePreference },
      { label: t("settings.themeDark"), value: "dark" as ThemePreference }
    ],
    [t]
  );

  const resolvedThemeLabel =
    theme.resolvedColorScheme === "dark"
      ? t("settings.themeDark")
      : t("settings.themeLight");

  const stepStatusTone = steps.error
    ? "warning"
    : steps.permissionStatus === "granted" && steps.isAvailable
      ? "safe"
      : "waiting";
  const stepStatusLabel = steps.error
    ? t("settings.stepsProblem")
    : steps.permissionStatus === "granted" && steps.isAvailable
      ? t("settings.stepsHealthy")
      : t("home.permissionNeeded");

  const proPackActionTitle =
    proPackStatus === "needs_download"
      ? t("settings.proPackResume")
      : proPackStatus === "failed"
        ? t("settings.proPackRetry")
        : t("settings.proPackDownload");

  const confirmReset = () => {
    Alert.alert(
      t("settings.resetProgressTitle"),
      t("settings.resetProgressMessage"),
      [
        { style: "cancel", text: t("common.cancel") },
        { onPress: resetProgress, style: "destructive", text: t("common.reset") }
      ]
    );
  };

  return (
    <ScreenScaffold>
      <ScreenHeader
        eyebrow={t("settings.device")}
        subtitle={t("settings.subtitle")}
        title={t("settings.title")}
      />

      {/* ── Pro ── */}
      <SectionHeader title={t("settings.pro")} />
      <MotionView delay={40}>
        <SettingGroup>
          <SettingRow
            icon="star"
            iconTone="amber"
            title={t("settings.status")}
            trailing={
              <StatusChip
                icon={isPro ? "shield-checkmark" : "lock-closed"}
                label={isPro ? t("common.proActive") : t("common.free")}
                tone={isPro ? "safe" : "locked"}
              />
            }
          />
          <SettingRow
            icon="refresh"
            onPress={restorePurchases}
            subtitle={
              isLoading ? t("settings.working") : t("settings.restoreSubtitle")
            }
            title={t("settings.restorePurchases")}
          />
          {managementURL ? (
            <SettingRow
              icon="open-outline"
              onPress={() => Linking.openURL(managementURL)}
              title={t("settings.manageSubscription")}
            />
          ) : null}
          <SettingRow
            icon="sparkles"
            iconTone="amber"
            isLast
            onPress={isPro ? undefined : () => router.push("/paywall")}
            subtitle={
              isRevenueCatConfigured
                ? undefined
                : t("paywall.revenueCatMissing")
            }
            title={isPro ? t("common.proActive") : t("settings.unlockPro")}
          />
        </SettingGroup>
      </MotionView>
      {error ? (
        <AppText role="caption" selectable tone="danger">
          {error}
        </AppText>
      ) : null}

      {/* ── Pro rescue pack ── */}
      {isPro ? (
        <>
          <SectionHeader title={t("settings.proPack")} />
          <MotionView delay={70}>
            <PremiumCard gap={spacing.s12} variant="standard">
              <View style={styles.packHeader}>
                <StatusChip
                  icon={
                    proPackStatus === "downloaded"
                      ? "shield-checkmark"
                      : proPackStatus === "failed"
                        ? "alert-circle"
                        : "cloud-download-outline"
                  }
                  label={
                    proPackStatus === "downloaded"
                      ? t("settings.proPackReady")
                      : proPackStatus === "failed"
                        ? t("settings.proPackFailed")
                        : t("settings.proPackPending")
                  }
                  tone={
                    proPackStatus === "downloaded"
                      ? "safe"
                      : proPackStatus === "failed"
                        ? "warning"
                        : "waiting"
                  }
                />
                <AppText role="caption" tone="secondary">
                  {downloaded} / {total} · {label}
                </AppText>
              </View>
              {proPackStatus !== "downloaded" ? (
                <AppButton
                  icon="cloud-download-outline"
                  onPress={() => setDownloadModalVisible(true)}
                  title={proPackActionTitle}
                  variant="pro"
                />
              ) : (
                <AppButton
                  icon="trash-outline"
                  onPress={clearDownloadedProAssets}
                  title={t("settings.proPackClear")}
                  variant="destructive"
                />
              )}
              <ProAssetDownloadModal
                onClose={() => setDownloadModalVisible(false)}
                visible={downloadModalVisible}
              />
            </PremiumCard>
          </MotionView>
        </>
      ) : null}

      {/* ── Step tracking ── */}
      <SectionHeader title={t("settings.steps")} />
      <MotionView delay={100}>
        <SettingGroup>
          <SettingRow
            icon="footsteps"
            iconTone="blue"
            title={t("settings.today")}
            value={formatLocalizedNumber(stepsToday)}
          />
          <SettingRow
            icon="pulse"
            iconTone="blue"
            title={t("settings.source")}
            value={steps.sourceLabel}
          />
          <SettingRow
            icon="shield-checkmark"
            iconTone={stepStatusTone === "safe" ? "green" : "coral"}
            title={t("settings.permission")}
            trailing={
              <StatusChip label={stepStatusLabel} tone={stepStatusTone} />
            }
          />
          <SettingRow
            icon="information-circle-outline"
            isLast={!showStepDiagnostics}
            onPress={() => setShowStepDiagnostics((value) => !value)}
            selected={showStepDiagnostics}
            title={t("home.showDetails")}
          />
          {showStepDiagnostics ? (
            <>
              <SettingRow
                title={t("settings.pedometer")}
                value={
                  steps.isAvailable
                    ? t("settings.available")
                    : t("settings.unavailable")
                }
              />
              <SettingRow
                title={t("settings.mode")}
                value={
                  steps.countingMode === "full-day"
                    ? t("settings.modeFullDay")
                    : t("settings.modeLiveSession")
                }
              />
              {steps.countingMode === "full-day" ? (
                <SettingRow
                  title={t("settings.storedToday")}
                  value={formatLocalizedNumber(steps.historicalStepsToday)}
                />
              ) : (
                <SettingRow
                  subtitle={t("settings.liveSessionNote")}
                  title={t("settings.liveSession")}
                  value={formatLocalizedNumber(steps.liveSteps)}
                />
              )}
              <SettingRow
                isLast
                subtitle={steps.error ?? undefined}
                title={t("settings.diagnosticDetail")}
              />
            </>
          ) : null}
        </SettingGroup>
      </MotionView>
      <View style={styles.stepActions}>
        <AppButton
          icon={steps.permissionStatus === "undetermined" ? "heart" : "refresh"}
          loading={steps.isLoading}
          onPress={
            steps.permissionStatus === "undetermined"
              ? steps.requestPermission
              : steps.refreshSteps
          }
          style={styles.stepAction}
          title={
            steps.permissionStatus === "undetermined"
              ? t("onboarding.enableSteps")
              : t("settings.refreshPedometer")
          }
          variant="secondary"
        />
        <AppButton
          onPress={() => Linking.openSettings()}
          style={styles.stepAction}
          title={t("settings.openSettings")}
          variant="ghost"
        />
      </View>

      {/* ── Sound ── */}
      <SectionHeader title={t("settings.sound")} />
      <MotionView delay={130}>
        <SettingGroup>
          <SettingRow
            icon="volume-medium-outline"
            isLast
            subtitle={t("settings.unlockAudioNote")}
            title={t("settings.unlockAudio")}
            trailing={
              <Switch
                accessibilityLabel={t("settings.unlockAudioA11y")}
                disabled={isUnlockAudioLoading}
                onValueChange={setUnlockAudioEnabled}
                thumbColor={undefined}
                trackColor={{
                  false: theme.colors.trackNeutral,
                  true: theme.colors.brandGreen
                }}
                value={unlockAudioEnabled}
              />
            }
          />
        </SettingGroup>
      </MotionView>

      {/* ── Language ── */}
      <SectionHeader title={t("language.panelTitle")} />
      <MotionView delay={160}>
        <SettingGroup>
          {supportedLanguages.map((option, index) => {
            const selected = language === option.code;

            return (
              <SettingRow
                icon={selected ? "checkmark-circle" : undefined}
                iconTone="green"
                isLast={index === supportedLanguages.length - 1}
                key={option.code}
                onPress={() => {
                  void setLanguage(option.code);
                }}
                selected={selected}
                subtitle={option.label}
                title={option.nativeLabel}
              />
            );
          })}
        </SettingGroup>
      </MotionView>
      <AppText role="caption" tone="tertiary">
        {t("language.currentSpeech", {
          language: languageLabel,
          locale: speechLocale
        })}
      </AppText>

      {/* ── Appearance ── */}
      <SectionHeader title={t("settings.appearance")} />
      <MotionView delay={190}>
        <PremiumCard gap={spacing.s8} variant="standard">
          <SegmentedControl
            onChange={(value) => {
              void theme.setThemePreference(value);
            }}
            options={themeOptions}
            value={theme.themePreference}
          />
          <AppText role="caption" tone="tertiary">
            {t("settings.currentAppearance", { scheme: resolvedThemeLabel })}
          </AppText>
        </PremiumCard>
      </MotionView>

      {/* ── Data ── */}
      <SectionHeader title={t("settings.localData")} />
      <MotionView delay={220}>
        <SettingGroup>
          <SettingRow
            icon="refresh-circle-outline"
            onPress={async () => {
              await resetOnboarding();
              router.replace("/onboarding");
            }}
            title={t("settings.resetOnboarding")}
          />
          <SettingRow
            destructive
            icon="trash-outline"
            isLast
            onPress={confirmReset}
            subtitle={t("settings.resetProgressMessage")}
            title={t("settings.resetLocalProgress")}
          />
        </SettingGroup>
      </MotionView>

      {/* ── Development only ── */}
      {__DEV__ ? (
        <>
          <SectionHeader title={t("settings.testing")} />
          <MotionView delay={250}>
            <PremiumCard gap={spacing.s8} variant="inset">
              <AppText role="caption" tone="secondary">
                {t("settings.revenueCatEntitlement")}{" "}
                {t("settings.configured", {
                  configured: isRevenueCatConfigured
                    ? t("common.yes")
                    : t("common.notYet")
                })}
              </AppText>
              <AppText role="caption" selectable tone="tertiary">
                {revenueCatDebugInfo.apiKeySource} ·{" "}
                {revenueCatDebugInfo.packageIds.monthly} /{" "}
                {revenueCatDebugInfo.packageIds.yearly}
              </AppText>
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
            </PremiumCard>
          </MotionView>
        </>
      ) : null}

      <AppText align="center" role="caption" tone="tertiary">
        {t("settings.version", {
          version: Constants.expoConfig?.version ?? "1.0.0"
        })}
      </AppText>
    </ScreenScaffold>
  );
}

function createStyles() {
  return StyleSheet.create({
    packHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s8,
      justifyContent: "space-between"
    },
    stepAction: {
      flex: 1
    },
    stepActions: {
      flexDirection: "row",
      gap: spacing.s8
    }
  });
}
