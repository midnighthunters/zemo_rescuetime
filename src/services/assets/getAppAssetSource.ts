import type { ImageSourcePropType } from "react-native";
import type { Animal, RewardImage, RescueRewardTarget } from "../../data/types";
import type { RemoteAsset } from "./remoteAssetTypes";
import { useRemoteAssetDownloadStore } from "./remoteAssetDownloadStore";
import { REMOTE_ASSET_BY_ID } from "./remoteAssetManifest";
import { getRemoteAssetUrlForAsset } from "./remoteAssetResolver";
import { isRemoteAssetHostConfigured } from "../../config/remoteAssets";

const ANIMAL_PLACEHOLDER = require("../../../public/data/placeholders/animal-placeholder.webp") as ImageSourcePropType;
const REWARD_PLACEHOLDER = require("../../../public/data/placeholders/reward-placeholder.webp") as ImageSourcePropType;

function getFallbackRemoteSource(remoteAssetId?: string): ImageSourcePropType | undefined {
  if (!remoteAssetId || !isRemoteAssetHostConfigured()) return undefined;
  const asset = REMOTE_ASSET_BY_ID[remoteAssetId];
  if (asset) {
    return { uri: getRemoteAssetUrlForAsset(asset) };
  }
  return undefined;
}

export function getImageSourceForRemoteAsset(asset: RemoteAsset): ImageSourcePropType {
  const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(asset.id);
  if (cachedUri) {
    return { uri: cachedUri };
  }
  if (isRemoteAssetHostConfigured()) {
    return { uri: getRemoteAssetUrlForAsset(asset) };
  }
  return REWARD_PLACEHOLDER;
}

export function getAudioUriForRemoteAsset(asset: RemoteAsset): string | undefined {
  return useRemoteAssetDownloadStore.getState().getCachedAssetUri(asset.id);
}

export function getAnimalImageSource(animal: Animal, mood: "happy" | "sad"): ImageSourcePropType {
  const remoteAssetId = mood === "happy" ? animal.happyRemoteAssetId : animal.sadRemoteAssetId;
  const localImage = mood === "happy" ? animal.happyImage : animal.sadImage;

  if (localImage) return localImage;
  if (remoteAssetId) {
    const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(remoteAssetId);
    if (cachedUri) return { uri: cachedUri };

    const fallbackSource = getFallbackRemoteSource(remoteAssetId);
    if (fallbackSource) return fallbackSource;
  }
  return ANIMAL_PLACEHOLDER;
}

export function getRewardImageSource(reward: RewardImage): ImageSourcePropType {
  if (reward.image) return reward.image;
  if (reward.remoteAssetId) {
    const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(reward.remoteAssetId);
    if (cachedUri) return { uri: cachedUri };

    const fallbackSource = getFallbackRemoteSource(reward.remoteAssetId);
    if (fallbackSource) return fallbackSource;
  }
  return REWARD_PLACEHOLDER;
}

export function getRewardTargetImageSource(target: RescueRewardTarget): ImageSourcePropType {
  if (target.image) return target.image;
  if (target.remoteAssetId) {
    const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(target.remoteAssetId);
    if (cachedUri) return { uri: cachedUri };

    const fallbackSource = getFallbackRemoteSource(target.remoteAssetId);
    if (fallbackSource) return fallbackSource;
  }
  return REWARD_PLACEHOLDER;
}
