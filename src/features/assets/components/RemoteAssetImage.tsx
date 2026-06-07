import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import { useRemoteAssetDownloadStore } from "../../../services/assets/remoteAssetDownloadStore";
import type { RemoteAsset } from "../../../services/assets/remoteAssetTypes";

type RemoteAssetImageProps = {
  asset?: RemoteAsset;
  placeholderSource: ImageSourcePropType;
  locked?: boolean;
  style?: any;
  contentFit?: "cover" | "contain";
};

export const RemoteAssetImage: React.FC<RemoteAssetImageProps> = ({
  asset,
  placeholderSource,
  locked,
  style,
  contentFit = "contain",
}) => {
  const isPro = useSubscriptionStore((state) => state.isPro);
  const cachedUris = useRemoteAssetDownloadStore((state) => state.cachedUris);

  if (!asset) {
    return <Image source={placeholderSource} style={style} contentFit={contentFit} />;
  }

  const cachedUri = cachedUris[asset.id];

  if (cachedUri) {
    return <Image source={{ uri: cachedUri }} style={style} contentFit={contentFit} />;
  }

  const showLock = locked || !isPro;

  return (
    <View style={[styles.container, style]}>
      <Image source={placeholderSource} style={StyleSheet.absoluteFill} contentFit={contentFit} />
      {showLock ? (
        <View style={styles.overlay}>
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={16} color="#FFF" />
          </View>
        </View>
      ) : (
        <View style={styles.overlay}>
          <View style={[styles.badge, styles.downloadBadge]}>
            <Ionicons name="cloud-download" size={16} color="#FFF" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(18, 31, 45, 0.8)",
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1.5,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadBadge: {
    backgroundColor: "rgba(47, 168, 102, 0.85)", // primary color theme
  },
});
