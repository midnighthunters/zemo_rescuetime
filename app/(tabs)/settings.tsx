import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { IconButton } from "../../src/components/IconButton";
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
import { useEntitlements } from "../../src/features/purchases/useEntitlements";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRemoteAssetDownloadStore } from "../../src/services/assets/remoteAssetDownloadStore";
import { useRescue } from "../../src/state/RescueProvider";
import {
  type AppColors,
  type ThemePreference,
  useAppTheme
} from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/spacing";

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const {
    language,
    languageLabel,
    setLanguage,
    supportedLanguages,
    t
  } = useLanguage();
  const {
    error,
    isLoading,
    isPro,
    managementURL,
    restorePurchases
  } = useEntitlements();
  const {
    isLoading: isUnlockAudioLoading,
    setUnlockAudioEnabled,
    unlockAudioEnabled
  } = useUnlockAudioSettings();
  const { steps } = useRescue();
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
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

  const currentLanguage = useMemo(
    () => supportedLanguages.find((option) => option.code === language),
    [language, supportedLanguages]
  );

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

  const handleRestoreWithFeedback = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          "Purchases Restored",
          "Your Pro subscription has been restored successfully!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "No Subscription Found",
          "No active Pro subscription was found for this Google Play account.",
          [{ text: "OK" }]
        );
      }
    } catch (caught: any) {
      Alert.alert(
        "Restore Error",
        caught?.message ?? "Unable to restore purchases."
      );
    }
  };

  return (
    <ScreenScaffold>
      {/* ── Settings Title only (no extra text) ── */}
      <ScreenHeader title={t("settings.title")} />

      {/* ── 1. Appearance / Theme at top ── */}
      <SectionHeader title={t("settings.appearance")} />
      <MotionView delay={30}>
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

      {/* ── 2. Language below Theme ── */}
      <SectionHeader title={t("language.panelTitle")} />
      <MotionView delay={60}>
        <SettingGroup>
          <SettingRow
            icon="globe-outline"
            iconTone="blue"
            isLast={!isLanguageDropdownOpen}
            onPress={() => setIsLanguageDropdownOpen((prev) => !prev)}
            subtitle={currentLanguage?.label ?? languageLabel}
            title={currentLanguage?.nativeLabel ?? languageLabel}
            trailing={
              <Ionicons
                color={theme.colors.textSecondary}
                name={isLanguageDropdownOpen ? "chevron-up" : "chevron-down"}
                size={20}
              />
            }
          />
          {isLanguageDropdownOpen
            ? supportedLanguages.map((option, index) => {
                const selected = language === option.code;

                return (
                  <SettingRow
                    icon={selected ? "checkmark-circle" : undefined}
                    iconTone="green"
                    isLast={index === supportedLanguages.length - 1}
                    key={option.code}
                    onPress={() => {
                      void setLanguage(option.code);
                      setIsLanguageDropdownOpen(false);
                    }}
                    selected={selected}
                    subtitle={option.label}
                    title={option.nativeLabel}
                  />
                );
              })
            : null}
        </SettingGroup>
      </MotionView>

      {/* ── 3. Steps with Audio inside ── */}
      <SectionHeader title={t("settings.steps")} />
      <MotionView delay={90}>
        <SettingGroup>
          <SettingRow
            icon="footsteps"
            iconTone="blue"
            title={t("settings.pedometer")}
            trailing={
              <View style={styles.statusWithSettings}>
                <StatusChip label={stepStatusLabel} tone={stepStatusTone} />
                <IconButton
                  accessibilityLabel={t("settings.openSettings")}
                  icon="settings-outline"
                  onPress={() => Linking.openSettings()}
                  size={20}
                  variant="plain"
                />
              </View>
            }
          />
          <SettingRow
            icon="volume-medium-outline"
            isLast
            title={t("settings.unlockAudio")}
            trailing={
              <Switch
                accessibilityLabel={t("settings.unlockAudioA11y")}
                disabled={isUnlockAudioLoading}
                onValueChange={setUnlockAudioEnabled}
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

      {/* ── 4. Redesigned Unlock Pro Panel: simple & premium ── */}
      <SectionHeader title={t("settings.pro")} />
      <MotionView delay={120}>
        {isPro ? (
          <PremiumCard gap={spacing.s12} variant="standard">
            <View style={styles.proCardHeader}>
              <View style={styles.proIconBadgeActive}>
                <Ionicons
                  color={theme.colors.brandGreenText}
                  name="shield-checkmark"
                  size={24}
                />
              </View>
              <View style={styles.proCopy}>
                <View style={styles.proTitleRow}>
                  <AppText role="cardTitle">Rescue Time Pro</AppText>
                  <StatusChip
                    icon="shield-checkmark"
                    label={t("common.proActive")}
                    tone="safe"
                  />
                </View>
                <AppText role="caption" tone="secondary">
                  {downloaded} / {total} · {label}
                </AppText>
              </View>
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
                size="compact"
                title={t("settings.proPackClear")}
                variant="ghost"
              />
            )}
            <AppButton
              icon="open-outline"
              onPress={() =>
                Linking.openURL(
                  managementURL ||
                    "https://play.google.com/store/account/subscriptions?package=com.zemolabs.rescuetime"
                )
              }
              size="compact"
              title="Manage or cancel subscription"
              variant="ghost"
            />
          </PremiumCard>
        ) : (
          <PremiumCard gap={spacing.s16} variant="hero">
            <View style={styles.proCardHeader}>
              <View style={styles.proIconBadge}>
                <Ionicons
                  color={theme.colors.rewardAmberText}
                  name="sparkles"
                  size={24}
                />
              </View>
              <View style={styles.proCopy}>
                <AppText role="sectionTitle">Rescue Time Pro</AppText>
                <AppText role="supportive" tone="secondary">
                  {t("paywall.title")}
                </AppText>
              </View>
            </View>
            <AppButton
              icon="sparkles"
              onPress={() => router.push("/paywall")}
              title={t("settings.unlockPro")}
              variant="pro"
            />
            <AppButton
              loading={isLoading}
              onPress={handleRestoreWithFeedback}
              size="compact"
              title={t("settings.restorePurchases")}
              variant="ghost"
            />
          </PremiumCard>
        )}
      </MotionView>
      {error ? (
        <AppText role="caption" selectable tone="danger">
          {error}
        </AppText>
      ) : null}

      <ProAssetDownloadModal
        onClose={() => setDownloadModalVisible(false)}
        visible={downloadModalVisible}
      />

      <AppText align="center" role="caption" tone="tertiary">
        {t("settings.version", {
          version: Constants.expoConfig?.version ?? "1.0.4"
        })}
      </AppText>
    </ScreenScaffold>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    proCardHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s12
    },
    proCopy: {
      flex: 1,
      gap: spacing.s4
    },
    proIconBadge: {
      alignItems: "center",
      backgroundColor: colors.surfaceAmber,
      borderRadius: radius.control,
      height: 48,
      justifyContent: "center",
      width: 48
    },
    proIconBadgeActive: {
      alignItems: "center",
      backgroundColor: colors.brandGreenFill,
      borderRadius: radius.control,
      height: 48,
      justifyContent: "center",
      width: 48
    },
    proTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    statusWithSettings: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.s4
    }
  });
}
