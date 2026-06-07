export type RemoteAssetKind =
  | "animal-happy"
  | "animal-sad"
  | "reward"
  | "audio"
  | "sticker"
  | "bonus";

export type RemoteAsset = {
  id: string;
  kind: RemoteAssetKind;
  path: string;
  sizeBytes: number;
  proDownload: boolean;

  animalId?: string;
  animalName?: string;
  mood?: "happy" | "sad";

  rewardId?: string;
  rewardTitle?: string;
  rewardAnimalName?: string;

  audioKey?: string;
};

export type RemoteAssetIntegrityResult = {
  isComplete: boolean;
  missingAssets: RemoteAsset[];
  invalidAssets: RemoteAsset[];
  downloadedCount: number;
  totalCount: number;
  downloadedBytes: number;
  totalBytes: number;
};
