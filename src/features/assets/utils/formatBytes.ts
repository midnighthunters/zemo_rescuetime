export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const mb = bytes / (1024 * 1024);

  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }

  return `${(mb / 1024).toFixed(2)} GB`;
};
