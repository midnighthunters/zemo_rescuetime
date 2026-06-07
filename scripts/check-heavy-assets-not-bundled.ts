import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function getFolderSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      size += getFolderSize(fullPath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

const formatMB = (bytes: number): string => {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function main() {
  console.log("Checking folder sizes to verify asset bundling safety...\n");

  const remoteAssetsSourceSize = getFolderSize(path.join(rootDir, "remote-assets-source"));
  const freeGeneratedSize = getFolderSize(path.join(rootDir, "public", "data", "generated-free"));
  const placeholdersSize = getFolderSize(path.join(rootDir, "public", "data", "placeholders"));

  // Heavy folders that should NOT contain Pro assets in production
  const checkFolders = [
    { name: "public/data/generated", path: path.join(rootDir, "public", "data", "generated") },
    { name: "public/data/happy", path: path.join(rootDir, "public", "data", "happy") },
    { name: "public/data/sad", path: path.join(rootDir, "public", "data", "sad") },
    { name: "public/data/packs", path: path.join(rootDir, "public", "data", "packs") },
    { name: "src/assets", path: path.join(rootDir, "src", "assets") }
  ];

  console.log(`remote-assets-source: ${formatMB(remoteAssetsSourceSize)}`);
  console.log(`public/data/generated-free: ${formatMB(freeGeneratedSize)}`);
  console.log(`public/data/placeholders: ${formatMB(placeholdersSize)}`);
  console.log();

  let hasHeavyAssetsBundled = false;

  for (const item of checkFolders) {
    const size = getFolderSize(item.path);
    console.log(`Folder [${item.name}]: ${formatMB(size)}`);

    // If public/data/generated folder exists and is non-empty, we warn or fail.
    // Specifically, happy/sad and packs folders are source assets, but if generated contains files,
    // we want to ensure it is not heavy. (Free generated is in public/data/generated-free now).
    if (item.name === "public/data/generated" && size > 1024 * 1024) { // > 1MB
      hasHeavyAssetsBundled = true;
    }
  }

  if (hasHeavyAssetsBundled) {
    console.error("\nERROR: Pro assets are still inside bundled app folders (e.g. public/data/generated).");
    console.error("Move Pro-only assets to remote-assets-source before release.");
    process.exit(1);
  } else {
    console.log("\nSuccess: No heavy Pro assets found in bundled directories. Bundle size is safe!");
  }
}

main();
