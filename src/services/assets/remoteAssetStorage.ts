import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProPackStatus } from "./remoteAssetDownloadStore";

export const REMOTE_ASSET_CACHE_KEY = "remote_asset_cache_v1";

export type StoredRemoteAssetCache = {
  cachedUris: Record<string, string>;
  failedAssets: string[];
  proPackStatus: ProPackStatus;
  hasPromptedForDownload: boolean;
  lastCompletedAt?: string;
  lastFailedAt?: string;
  userStartedDownload?: boolean;
};

export const getStoredAssetCache = async (): Promise<StoredRemoteAssetCache | null> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_ASSET_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredAssetCache = async (cache: StoredRemoteAssetCache): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMOTE_ASSET_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

export const clearStoredAssetCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REMOTE_ASSET_CACHE_KEY);
  } catch {
    // Ignore
  }
};
