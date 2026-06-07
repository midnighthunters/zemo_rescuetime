import { REMOTE_ASSET_BASE_URL } from "../../config/remoteAssets";
import type { RemoteAsset } from "./remoteAssetTypes";

const encodeRemotePath = (path: string) =>
  path.split("/").map(encodeURIComponent).join("/");

export const getRemoteAssetUrl = (path: string) =>
  `${REMOTE_ASSET_BASE_URL.replace(/\/+$/, "")}/${encodeRemotePath(path)}`;

export const getRemoteAssetUrlForAsset = (asset: RemoteAsset) =>
  getRemoteAssetUrl(asset.path);

export const getRemoteAssetIdFromPath = (path: string) =>
  path
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const getRemoteAssetFileUri = (localPath: string) =>
  localPath.startsWith("file://") ? localPath : `file://${localPath}`;
