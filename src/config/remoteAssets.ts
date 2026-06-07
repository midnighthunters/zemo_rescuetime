export const REMOTE_ASSET_BASE_URL =
  process.env.EXPO_PUBLIC_REMOTE_ASSET_BASE_URL ||
  "https://YOUR_CLOUDFLARE_PUBLIC_DOMAIN/zemo-animal-rescue-assets/v1";

export const REMOTE_ASSET_CACHE_DIR = "zemo-animal-rescue-pro-assets-v1";

export const REMOTE_ASSET_PACK_VERSION = "v1";

export const isRemoteAssetHostConfigured = () =>
  Boolean(REMOTE_ASSET_BASE_URL) &&
  !REMOTE_ASSET_BASE_URL.includes("YOUR_CLOUDFLARE_PUBLIC_DOMAIN");
