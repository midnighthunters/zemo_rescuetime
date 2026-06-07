import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useRemoteAssetDownloadStore } from "../../../services/assets/remoteAssetDownloadStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import { useAppTheme } from "../../../theme/colors";
import { AppButton } from "../../../components/AppButton";
import { spacing } from "../../../theme/spacing";
import { shadows } from "../../../theme/shadows";

type ProAssetDownloadModalProps = {
  visible?: boolean;
  onClose?: () => void;
};

export const ProAssetDownloadModal: React.FC<ProAssetDownloadModalProps> = ({
  visible,
  onClose,
}) => {
  const theme = useAppTheme();
  const isPro = useSubscriptionStore((state) => state.isPro);
  const {
    proPackStatus,
    hasPromptedForDownload,
    isDownloading,
    isChecking,
    currentAssetPath,
    lastError,
    downloadProAssets,
    resumeProAssetsDownload,
    retryFailedAssets,
    dismissDownloadPrompt,
    getFormattedProgress,
  } = useRemoteAssetDownloadStore();

  const isModalVisible =
    visible !== undefined
      ? visible
      : isPro &&
        proPackStatus !== "downloaded" &&
        proPackStatus !== "not_available" &&
        (!hasPromptedForDownload || isDownloading);

  const handleDismiss = () => {
    dismissDownloadPrompt();
    if (onClose) onClose();
  };

  const { percent, downloaded, total, label } = getFormattedProgress();

  const renderContent = () => {
    if (isChecking) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Verifying Files...</Text>
          <Text style={[styles.description, { color: theme.colors.muted }]}>
            Checking local Pro Rescue Pack files. Please wait.
          </Text>
        </View>
      );
    }

    switch (proPackStatus) {
      case "available":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceSoft }]}>
              <Ionicons name="sparkles" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Pro Rescue Pack Ready 🎉</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              Download all premium animals, reward items, rescue scenes, and sounds.
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.muted }]}>
              Size: about 160 MB{"\n"}Recommended on Wi-Fi.
            </Text>
            <View style={styles.buttonRow}>
              <AppButton
                title="Download Now"
                variant="primary"
                onPress={downloadProAssets}
                style={styles.button}
              />
              <AppButton
                title="Later"
                variant="secondary"
                onPress={handleDismiss}
                style={styles.button}
              />
            </View>
          </View>
        );

      case "offline":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: "#FFEBEB" }]}>
              <Ionicons name="wifi-outline" size={48} color={theme.colors.danger} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Internet Required</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              Please enable Wi-Fi or mobile data to download your Pro Rescue Pack.
            </Text>
            {lastError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{lastError}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              <AppButton
                title="Retry"
                variant="primary"
                onPress={retryFailedAssets}
                style={styles.button}
              />
              <AppButton
                title="Later"
                variant="secondary"
                onPress={handleDismiss}
                style={styles.button}
              />
            </View>
          </View>
        );

      case "downloading":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceSoft }]}>
              <Ionicons name="cloud-download-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Downloading Pro Rescue Pack</Text>
            
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            
            <View style={styles.progressInfoRow}>
              <Text style={[styles.progressPct, { color: theme.colors.primaryDark }]}>{percent}%</Text>
              <Text style={[styles.progressBytes, { color: theme.colors.muted }]}>
                {downloaded} / {total}
              </Text>
            </View>
            <Text style={[styles.progressCount, { color: theme.colors.muted }]}>{label} downloaded</Text>

            {currentAssetPath ? (
              <Text numberOfLines={1} style={[styles.currentPath, { color: theme.colors.muted }]}>
                Current: {currentAssetPath}
              </Text>
            ) : null}

            <Text style={[styles.infoText, { color: theme.colors.muted }]}>
              Please keep the app open.{"\n"}If interrupted, you can resume later.
            </Text>
          </View>
        );

      case "needs_download":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceSoft }]}>
              <Ionicons name="hourglass-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Pack Partially Saved</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              Some animals and rewards are already saved. Resume downloading the remaining files?
            </Text>
            <View style={styles.buttonRow}>
              <AppButton
                title="Resume"
                variant="primary"
                onPress={resumeProAssetsDownload}
                style={styles.button}
              />
              <AppButton
                title="Later"
                variant="secondary"
                onPress={handleDismiss}
                style={styles.button}
              />
            </View>
          </View>
        );

      case "downloaded":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#137333" />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Pro Rescue Pack Downloaded ✅</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              All premium animals and rewards are ready offline.
            </Text>
            <AppButton
              title="Continue"
              variant="primary"
              onPress={handleDismiss}
              style={{ width: "100%", marginTop: spacing.md }}
            />
          </View>
        );

      case "failed":
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: "#FFEBEB" }]}>
              <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Download Interrupted</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              Some files could not be downloaded. Please check your internet connection and try again.
            </Text>
            {lastError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{lastError}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              <AppButton
                title="Retry"
                variant="primary"
                onPress={retryFailedAssets}
                style={styles.button}
              />
              <AppButton
                title="Later"
                variant="secondary"
                onPress={handleDismiss}
                style={styles.button}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isModalVisible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.card,
  },
  stateContainer: {
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
  progressTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.xs,
  },
  progressPct: {
    fontSize: 14,
    fontWeight: "900",
  },
  progressBytes: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressCount: {
    fontSize: 12,
    fontWeight: "700",
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  currentPath: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "monospace",
    alignSelf: "flex-start",
    width: "100%",
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
    marginTop: spacing.md,
  },
});
