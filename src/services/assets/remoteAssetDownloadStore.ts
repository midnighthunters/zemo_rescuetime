import { create } from "zustand";
import * as FileSystem from "expo-file-system/legacy";
import { documentDirectory } from "expo-file-system/legacy";
import { REMOTE_ASSET_CACHE_DIR } from "../../config/remoteAssets";
import { PRO_UNLOCK_REMOTE_ASSETS } from "./remoteAssetManifest";
import { getRemoteAssetUrlForAsset, getRemoteAssetFileUri } from "./remoteAssetResolver";
import { hasInternetConnection } from "./remoteAssetNetwork";
import { getStoredAssetCache, saveStoredAssetCache } from "./remoteAssetStorage";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import type { RemoteAsset, RemoteAssetIntegrityResult } from "./remoteAssetTypes";
import { formatBytes } from "../../features/assets/utils/formatBytes";

export type ProPackStatus =
  | "not_available"
  | "available"
  | "checking"
  | "needs_download"
  | "downloaded"
  | "downloading"
  | "paused"
  | "failed"
  | "offline";

const cacheRoot = `${documentDirectory ?? ""}${REMOTE_ASSET_CACHE_DIR}/`;

type RemoteAssetDownloadState = {
  hydrated: boolean;

  proPackStatus: ProPackStatus;
  hasPromptedForDownload: boolean;
  userStartedDownload: boolean;

  cachedUris: Record<string, string>;
  failedAssets: string[];

  isChecking: boolean;
  isDownloading: boolean;

  progress: number;
  downloadedBytes: number;
  totalBytes: number;

  downloadedAssetCount: number;
  totalAssetCount: number;

  currentAssetPath?: string;
  lastError?: string;

  lastCompletedAt?: string;
  lastFailedAt?: string;

  hydrate: () => Promise<void>;

  markProPackAvailable: () => void;
  dismissDownloadPrompt: () => void;

  checkProPackIntegrity: () => Promise<RemoteAssetIntegrityResult>;

  downloadProAssets: () => Promise<void>;
  resumeProAssetsDownload: () => Promise<void>;
  retryFailedAssets: () => Promise<void>;

  ensureAsset: (asset: RemoteAsset) => Promise<string | undefined>;
  getCachedAssetUri: (assetId: string) => string | undefined;

  clearDownloadedProAssets: () => Promise<void>;

  getFormattedProgress: () => {
    percent: number;
    downloaded: string;
    total: string;
    label: string;
  };
};

export const useRemoteAssetDownloadStore = create<RemoteAssetDownloadState>((set, get) => {
  // Save cache state helper
  const syncToStorage = async () => {
    const { cachedUris, failedAssets, proPackStatus, hasPromptedForDownload, lastCompletedAt, lastFailedAt, userStartedDownload } = get();
    await saveStoredAssetCache({
      cachedUris,
      failedAssets,
      proPackStatus,
      hasPromptedForDownload,
      lastCompletedAt,
      lastFailedAt,
      userStartedDownload,
    });
  };

  return {
    hydrated: false,
    proPackStatus: "not_available",
    hasPromptedForDownload: false,
    userStartedDownload: false,
    cachedUris: {},
    failedAssets: [],
    isChecking: false,
    isDownloading: false,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    downloadedAssetCount: 0,
    totalAssetCount: 0,

    hydrate: async () => {
      if (get().hydrated) return;
      const stored = await getStoredAssetCache();
      if (stored) {
        set({
          cachedUris: stored.cachedUris || {},
          failedAssets: stored.failedAssets || [],
          proPackStatus: stored.proPackStatus || "not_available",
          hasPromptedForDownload: stored.hasPromptedForDownload || false,
          lastCompletedAt: stored.lastCompletedAt,
          lastFailedAt: stored.lastFailedAt,
          userStartedDownload: stored.userStartedDownload || false,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    },

    markProPackAvailable: () => {
      const currentStatus = get().proPackStatus;
      if (currentStatus === "not_available") {
        set({ proPackStatus: "available" });
        void syncToStorage();
      }
    },

    dismissDownloadPrompt: () => {
      set({ hasPromptedForDownload: true });
      void syncToStorage();
    },

    checkProPackIntegrity: async () => {
      set({ isChecking: true });
      const assets = PRO_UNLOCK_REMOTE_ASSETS;
      const totalCount = assets.length;
      const totalBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);

      let downloadedCount = 0;
      let downloadedBytes = 0;
      const missingAssets: RemoteAsset[] = [];
      const invalidAssets: RemoteAsset[] = [];
      const validCachedUris: Record<string, string> = {};

      for (const asset of assets) {
        const localPath = `${cacheRoot}${asset.path}`;
        try {
          const info = await FileSystem.getInfoAsync(localPath);
          if (info.exists) {
            const size = info.size ?? 0;
            if (size >= asset.sizeBytes) {
              downloadedCount++;
              downloadedBytes += size;
              validCachedUris[asset.id] = getRemoteAssetFileUri(localPath);
            } else {
              invalidAssets.push(asset);
              // Clean up corrupted file
              await FileSystem.deleteAsync(localPath, { idempotent: true });
            }
          } else {
            missingAssets.push(asset);
          }
        } catch {
          missingAssets.push(asset);
        }
      }

      const isComplete = missingAssets.length === 0 && invalidAssets.length === 0;
      const proPackStatus: ProPackStatus = isComplete
        ? "downloaded"
        : get().userStartedDownload
        ? "needs_download"
        : get().proPackStatus === "not_available"
        ? "available"
        : get().proPackStatus;

      set({
        isChecking: false,
        cachedUris: validCachedUris,
        proPackStatus,
        downloadedAssetCount: downloadedCount,
        totalAssetCount: totalCount,
        downloadedBytes,
        totalBytes,
        progress: totalBytes > 0 ? downloadedBytes / totalBytes : 0,
      });

      void syncToStorage();

      return {
        isComplete,
        missingAssets,
        invalidAssets,
        downloadedCount,
        totalCount,
        downloadedBytes,
        totalBytes,
      };
    },

    downloadProAssets: async () => {
      if (!useSubscriptionStore.getState().isPro) {
        set({ lastError: "Pro is required to download these assets." });
        return;
      }

      const isConnected = await hasInternetConnection();
      if (!isConnected) {
        set({
          proPackStatus: "offline",
          isDownloading: false,
          lastError: "Internet is required to download the Pro Rescue Pack.",
        });
        return;
      }

      set({
        proPackStatus: "downloading",
        isDownloading: true,
        userStartedDownload: true,
        lastError: undefined,
      });
      await syncToStorage();

      const integrity = await get().checkProPackIntegrity();
      if (integrity.isComplete) {
        set({
          proPackStatus: "downloaded",
          isDownloading: false,
          lastCompletedAt: new Date().toISOString(),
        });
        await syncToStorage();
        return;
      }

      const toDownload = [...integrity.missingAssets, ...integrity.invalidAssets];
      const failedList: string[] = [];

      let currentBytes = integrity.downloadedBytes;
      const cached = { ...get().cachedUris };

      // Ensure directory
      try {
        const rootInfo = await FileSystem.getInfoAsync(cacheRoot);
        if (!rootInfo.exists) {
          await FileSystem.makeDirectoryAsync(cacheRoot, { intermediates: true });
        }
      } catch (err) {
        set({
          proPackStatus: "failed",
          isDownloading: false,
          lastError: "Failed to initialize storage: " + String(err),
          lastFailedAt: new Date().toISOString(),
        });
        await syncToStorage();
        return;
      }

      for (const asset of toDownload) {
        const isConnectedLoop = await hasInternetConnection();
        if (!isConnectedLoop) {
          set({
            proPackStatus: "offline",
            isDownloading: false,
            lastError: "Connection lost during download.",
          });
          await syncToStorage();
          return;
        }

        const localPath = `${cacheRoot}${asset.path}`;
        const tempPath = `${localPath}.download`;

        // Ensure subdirectories exist
        const parentDir = localPath.substring(0, localPath.lastIndexOf("/"));
        try {
          const parentInfo = await FileSystem.getInfoAsync(parentDir);
          if (!parentInfo.exists) {
            await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
          }
        } catch {}

        set({ currentAssetPath: asset.path });

        try {
          // Clean old temp file if any
          await FileSystem.deleteAsync(tempPath, { idempotent: true });

          const downloadUrl = getRemoteAssetUrlForAsset(asset);
          const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempPath);

          if (downloadResult.status !== 200) {
            throw new Error(`HTTP Status ${downloadResult.status}`);
          }

          const fileInfo = await FileSystem.getInfoAsync(tempPath);
          if (!fileInfo.exists || (fileInfo.size ?? 0) < asset.sizeBytes) {
            throw new Error("Downloaded file size mismatch or missing");
          }

          // Move to final path
          await FileSystem.deleteAsync(localPath, { idempotent: true });
          await FileSystem.moveAsync({ from: tempPath, to: localPath });

          cached[asset.id] = getRemoteAssetFileUri(localPath);
          currentBytes += asset.sizeBytes;

          set({
            cachedUris: { ...cached },
            downloadedAssetCount: get().downloadedAssetCount + 1,
            downloadedBytes: currentBytes,
            progress: get().totalBytes > 0 ? currentBytes / get().totalBytes : 0,
          });

          // Throttle sync slightly or sync per file
          await syncToStorage();
        } catch (err) {
          failedList.push(asset.path);
          // Clean up temp
          await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
        }
      }

      const finalIntegrity = await get().checkProPackIntegrity();
      if (finalIntegrity.isComplete) {
        set({
          proPackStatus: "downloaded",
          isDownloading: false,
          failedAssets: [],
          lastCompletedAt: new Date().toISOString(),
        });
      } else {
        set({
          proPackStatus: "failed",
          isDownloading: false,
          failedAssets: failedList,
          lastError: failedList.length > 0 ? `${failedList.length} files failed to download.` : "Integrity check failed.",
          lastFailedAt: new Date().toISOString(),
        });
      }

      await syncToStorage();
    },

    resumeProAssetsDownload: async () => {
      await get().downloadProAssets();
    },

    retryFailedAssets: async () => {
      await get().downloadProAssets();
    },

    ensureAsset: async (asset: RemoteAsset) => {
      const cached = get().cachedUris[asset.id];
      if (cached) {
        const info = await FileSystem.getInfoAsync(cached);
        if (info.exists) {
          return cached;
        }
      }
      return undefined;
    },

    getCachedAssetUri: (assetId: string) => {
      return get().cachedUris[assetId];
    },

    clearDownloadedProAssets: async () => {
      try {
        await FileSystem.deleteAsync(cacheRoot, { idempotent: true });
      } catch {}

      set({
        cachedUris: {},
        failedAssets: [],
        proPackStatus: "needs_download",
        progress: 0,
        downloadedBytes: 0,
        downloadedAssetCount: 0,
        userStartedDownload: false,
      });

      await syncToStorage();
    },

    getFormattedProgress: () => {
      const { progress, downloadedBytes, totalBytes, downloadedAssetCount, totalAssetCount } = get();
      const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
      return {
        percent: pct,
        downloaded: formatBytes(downloadedBytes),
        total: formatBytes(totalBytes),
        label: `${downloadedAssetCount} / ${totalAssetCount} files`,
      };
    },
  };
});
