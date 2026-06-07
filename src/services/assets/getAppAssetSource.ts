import type { ImageSourcePropType } from "react-native";
import type { Animal, RewardImage, RescueRewardTarget } from "../../data/types";
import type { RemoteAsset } from "./remoteAssetTypes";
import { useRemoteAssetDownloadStore } from "./remoteAssetDownloadStore";

const ANIMAL_PLACEHOLDER = require("../../../public/data/placeholders/animal-placeholder.png") as ImageSourcePropType;
const REWARD_PLACEHOLDER = require("../../../public/data/placeholders/reward-placeholder.png") as ImageSourcePropType;

export function getImageSourceForRemoteAsset(asset: RemoteAsset): ImageSourcePropType {
  const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(asset.id);
  if (cachedUri) {
    return { uri: cachedUri };
  }
  return REWARD_PLACEHOLDER;
}

export function getAudioUriForRemoteAsset(asset: RemoteAsset): string | undefined {
  return useRemoteAssetDownloadStore.getState().getCachedAssetUri(asset.id);
}

export function getAnimalImageSource(animal: Animal, mood: "happy" | "sad"): ImageSourcePropType {
  if (mood === "happy") {
    if (animal.happyImage) return animal.happyImage;
    if (animal.happyRemoteAssetId) {
      const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(animal.happyRemoteAssetId);
      if (cachedUri) return { uri: cachedUri };
    }
  } else {
    if (animal.sadImage) return animal.sadImage;
    if (animal.sadRemoteAssetId) {
      const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(animal.sadRemoteAssetId);
      if (cachedUri) return { uri: cachedUri };
    }
  }
  return ANIMAL_PLACEHOLDER;
}

export function getRewardImageSource(reward: RewardImage): ImageSourcePropType {
  if (reward.image) return reward.image;
  if (reward.remoteAssetId) {
    const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(reward.remoteAssetId);
    if (cachedUri) return { uri: cachedUri };
  }
  return REWARD_PLACEHOLDER;
}

export function getRewardTargetImageSource(target: RescueRewardTarget): ImageSourcePropType {
  if (target.image) return target.image;
  if (target.remoteAssetId) {
    const cachedUri = useRemoteAssetDownloadStore.getState().getCachedAssetUri(target.remoteAssetId);
    if (cachedUri) return { uri: cachedUri };
  }
  return REWARD_PLACEHOLDER;
}
