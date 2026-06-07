import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";

type RewardConcept = {
  id: string;
  globalIndex: number;
  animalName: string;
  label: string;
  title: string;
  fileName: string;
  pack: number;
  sheetInPack: number;
  globalSheet: number;
  cell: number;
};

type AnimalAsset = {
  id: string;
  name: string;
  fileName: string;
  sourceCell: number;
  sourceSheet: number;
  sourceSheetCell: number;
};

const rootDir = process.cwd();
const publicDataDir = path.join(rootDir, "public", "data");
const happySourceDir = path.join(publicDataDir, "happy");
const sadSourceDir = path.join(publicDataDir, "sad");
const packsSourceDir = path.join(publicDataDir, "packs");
const generatedDir = path.join(publicDataDir, "generated");
const packsGeneratedDir = path.join(packsSourceDir, "generated");
const srcDataDir = path.join(rootDir, "src", "data");

const freeGeneratedDir = path.join(publicDataDir, "generated-free");
const freeAnimalDir = path.join(freeGeneratedDir, "animals");
const freeRewardDir = path.join(freeGeneratedDir, "rewards");

const remoteAssetsDir = path.join(rootDir, "remote-assets-source");
const remoteGeneratedDir = path.join(remoteAssetsDir, "data", "generated");
const remoteAnimalDir = path.join(remoteGeneratedDir, "animals");
const remoteRewardDir = path.join(remoteGeneratedDir, "rewards");

const promptPaths = [
  process.env.REWARD_PROMPT_PACK_1 ??
    path.join(os.homedir(), "Downloads", "animal_rescue_reward_image_prompts_pack_1.md"),
  process.env.REWARD_PROMPT_PACK_2 ??
    path.join(os.homedir(), "Downloads", "animal_rescue_reward_image_prompts_pack_2.md"),
  process.env.REWARD_PROMPT_PACK_3 ??
    path.join(os.homedir(), "Downloads", "animal_rescue_reward_image_prompts_pack_3.md")
];

const animalColumns = 5;
const animalRows = 2;
const rewardColumns = 5;
const rewardRows = 4;
const animalCellCountPerSheet = animalColumns * animalRows;
const rewardCellCountPerSheet = rewardColumns * rewardRows;

// The animal sheets include one extra flamingo before Mandarin Duck.
// Reward prompts do not include a second flamingo group, so generated animal data skips it.
const duplicateAnimalSheetCells = new Set([60]);

function assertGeneratedPath(targetPath: string) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);
  const allowedRoots = [
    path.resolve(generatedDir),
    path.resolve(packsGeneratedDir),
    path.resolve(srcDataDir),
    path.resolve(freeGeneratedDir),
    path.resolve(remoteAssetsDir)
  ];

  const isInWorkspace = resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
  const isAllowed = allowedRoots.some(
    (allowedRoot) =>
      resolvedTarget === allowedRoot ||
      resolvedTarget.startsWith(`${allowedRoot}${path.sep}`)
  );

  if (!isInWorkspace || !isAllowed) {
    throw new Error(`Refusing to write outside generated targets: ${targetPath}`);
  }
}

async function resetDir(dir: string) {
  assertGeneratedPath(dir);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function ensureDir(dir: string) {
  assertGeneratedPath(dir);
  await fs.mkdir(dir, { recursive: true });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cellBounds(
  width: number,
  height: number,
  columns: number,
  rows: number,
  index: number
) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = Math.round((width / columns) * column);
  const top = Math.round((height / rows) * row);
  const right = Math.round((width / columns) * (column + 1));
  const bottom = Math.round((height / rows) * (row + 1));

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

async function listImageFiles(dir: string) {
  const entries = await fs.readdir(dir);

  return entries
    .filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((entry) => path.join(dir, entry));
}

async function readRewardConcepts() {
  const concepts: RewardConcept[] = [];

  for (const promptPath of promptPaths) {
    const raw = await fs.readFile(promptPath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s+(.+?)\s+\+\s+(.+?)\s*$/);
      if (!match) {
        continue;
      }

      const globalIndex = Number(match[1]);
      const animalName = match[2].trim();
      const label = match[3].trim();
      const globalSheet = Math.ceil(globalIndex / rewardCellCountPerSheet);
      const pack = Math.ceil(globalSheet / 8);
      const sheetInPack = ((globalSheet - 1) % 8) + 1;
      const cell = ((globalIndex - 1) % rewardCellCountPerSheet) + 1;
      const id = `reward_${String(globalIndex).padStart(3, "0")}`;
      const fileName = `${id}_${slugify(animalName)}_${slugify(label)}.png`;

      concepts.push({
        id,
        globalIndex,
        animalName,
        label,
        title: titleCase(label),
        fileName,
        pack,
        sheetInPack,
        globalSheet,
        cell
      });
    }
  }

  concepts.sort((a, b) => a.globalIndex - b.globalIndex);

  if (concepts.length !== 480) {
    throw new Error(`Expected 480 reward concepts, found ${concepts.length}.`);
  }

  concepts.forEach((concept, index) => {
    const expectedIndex = index + 1;
    if (concept.globalIndex !== expectedIndex) {
      throw new Error(
        `Reward concept order mismatch. Expected ${expectedIndex}, got ${concept.globalIndex}.`
      );
    }
  });

  return concepts;
}

function getAnimalNamesFromRewards(concepts: RewardConcept[]) {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const concept of concepts) {
    if (concept.animalName === "Animal Rescue Bonus") {
      continue;
    }

    if (!seen.has(concept.animalName)) {
      seen.add(concept.animalName);
      names.push(concept.animalName);
    }
  }

  return names;
}

function buildAnimalAssets(animalNames: string[]) {
  return animalNames.map<AnimalAsset>((name, index) => {
    let sourceCell = index;
    while (duplicateAnimalSheetCells.has(sourceCell)) {
      sourceCell += 1;
    }

    // After the duplicate cell, every later reward animal maps one cell later.
    if (index >= 60) {
      sourceCell = index + 1;
    }

    const id = `animal_${String(index + 1).padStart(3, "0")}`;
    const sourceSheet = Math.floor(sourceCell / animalCellCountPerSheet) + 1;
    const sourceSheetCell = (sourceCell % animalCellCountPerSheet) + 1;

    return {
      id,
      name,
      fileName: `${id}_${slugify(name)}.png`,
      sourceCell,
      sourceSheet,
      sourceSheetCell
    };
  });
}

function isNearWhiteBackgroundPixel(
  data: Buffer,
  offset: number,
  channels: number
) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = channels === 4 ? data[offset + 3] : 255;
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);

  return (
    alpha > 0 &&
    red > 245 &&
    green > 245 &&
    blue > 245 &&
    brightest - darkest < 16
  );
}

async function removeConnectedWhiteBackground(image: sharp.Sharp) {
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueueIfBackground = (pixelIndex: number) => {
    if (visited[pixelIndex]) {
      return;
    }

    const offset = pixelIndex * info.channels;
    if (!isNearWhiteBackgroundPixel(data, offset, info.channels)) {
      return;
    }

    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueueIfBackground(x);
    enqueueIfBackground((info.height - 1) * info.width + x);
  }

  for (let y = 0; y < info.height; y += 1) {
    enqueueIfBackground(y * info.width);
    enqueueIfBackground(y * info.width + info.width - 1);
  }

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;

    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);

    if (x > 0) enqueueIfBackground(pixelIndex - 1);
    if (x < info.width - 1) enqueueIfBackground(pixelIndex + 1);
    if (y > 0) enqueueIfBackground(pixelIndex - info.width);
    if (y < info.height - 1) enqueueIfBackground(pixelIndex + info.width);
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (visited[pixelIndex]) {
      data[pixelIndex * info.channels + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  });
}

async function extractCellImage(options: {
  sheetPath: string;
  columns: number;
  rows: number;
  cellIndex: number;
  outputSize: number;
  removeWhiteBackground: boolean;
  inset?: Partial<Record<"left" | "right" | "top" | "bottom", number>>;
}) {
  const metadata = await sharp(options.sheetPath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error(`Could not read dimensions for ${options.sheetPath}`);
  }

  const rawBounds = cellBounds(
    width,
    height,
    options.columns,
    options.rows,
    options.cellIndex
  );
  const inset = options.inset ?? {};
  const bounds = {
    left: rawBounds.left + (inset.left ?? 0),
    top: rawBounds.top + (inset.top ?? 0),
    width: rawBounds.width - (inset.left ?? 0) - (inset.right ?? 0),
    height: rawBounds.height - (inset.top ?? 0) - (inset.bottom ?? 0)
  };
  const cell = sharp(options.sheetPath).extract(bounds).ensureAlpha();
  const transparent = options.removeWhiteBackground
    ? await removeConnectedWhiteBackground(cell)
    : cell;

  return transparent
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 4
    })
    .resize(options.outputSize, options.outputSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

async function writeAnimalAssets(animals: AnimalAsset[]) {
  const happySheets = await listImageFiles(happySourceDir);
  const sadSheets = await listImageFiles(sadSourceDir);

  if (happySheets.length !== 8 || sadSheets.length !== 8) {
    throw new Error(
      `Expected 8 happy and 8 sad sheets, found ${happySheets.length} happy and ${sadSheets.length} sad.`
    );
  }

  await resetDir(path.join(freeAnimalDir, "happy"));
  await resetDir(path.join(freeAnimalDir, "sad"));
  await resetDir(path.join(remoteAnimalDir, "happy"));
  await resetDir(path.join(remoteAnimalDir, "sad"));

  for (let index = 0; index < animals.length; index++) {
    const animal = animals[index];
    const isFree = index === 0;
    const targetDir = isFree ? freeAnimalDir : remoteAnimalDir;

    const happySheet = happySheets[animal.sourceSheet - 1];
    const sadSheet = sadSheets[animal.sourceSheet - 1];
    const cellIndex = animal.sourceSheetCell - 1;

    const [happyBuffer, sadBuffer] = await Promise.all([
      extractCellImage({
        sheetPath: happySheet,
        columns: animalColumns,
        rows: animalRows,
        cellIndex,
        outputSize: 512,
        removeWhiteBackground: true,
        inset: animal.name === "Mandarin Duck" ? { right: 30 } : undefined
      }),
      extractCellImage({
        sheetPath: sadSheet,
        columns: animalColumns,
        rows: animalRows,
        cellIndex,
        outputSize: 512,
        removeWhiteBackground: true,
        inset: animal.name === "Mandarin Duck" ? { right: 30 } : undefined
      })
    ]);

    await Promise.all([
      fs.writeFile(
        path.join(targetDir, "happy", animal.fileName),
        happyBuffer
      ),
      fs.writeFile(
        path.join(targetDir, "sad", animal.fileName),
        sadBuffer
      )
    ]);
  }
}

async function writeRewardAssets(concepts: RewardConcept[], freeAnimalName: string) {
  await resetDir(freeRewardDir);
  await resetDir(remoteRewardDir);
  await resetDir(packsGeneratedDir);

  const sheetsByPack = new Map<number, string[]>();
  for (const pack of [1, 2, 3]) {
    sheetsByPack.set(pack, await listImageFiles(path.join(packsSourceDir, `${pack}`)));
  }

  for (const concept of concepts) {
    const packSheets = sheetsByPack.get(concept.pack) ?? [];
    const sheetPath = packSheets[concept.sheetInPack - 1];

    if (!sheetPath) {
      throw new Error(
        `Missing source sheet for pack ${concept.pack}, image ${concept.sheetInPack}.`
      );
    }

    const buffer = await extractCellImage({
      sheetPath,
      columns: rewardColumns,
      rows: rewardRows,
      cellIndex: concept.cell - 1,
      outputSize: 384,
      removeWhiteBackground: true
    });
    const start = (concept.globalSheet - 1) * rewardCellCountPerSheet + 1;
    const end = start + rewardCellCountPerSheet - 1;
    const sheetDir = path.join(
      packsGeneratedDir,
      `${concept.pack}`,
      `image_${String(concept.sheetInPack).padStart(2, "0")}_rewards_${String(start).padStart(3, "0")}_${String(end).padStart(3, "0")}`
    );

    await ensureDir(sheetDir);

    const isFree = concept.animalName === freeAnimalName;
    const targetRewardDir = isFree ? freeRewardDir : remoteRewardDir;

    await Promise.all([
      fs.writeFile(path.join(targetRewardDir, concept.fileName), buffer),
      fs.writeFile(path.join(sheetDir, concept.fileName), buffer)
    ]);
  }
}

async function writeAnimalManifest(animals: AnimalAsset[]) {
  const entries = animals
    .map((animal, index) => {
      const isFree = index === 0;
      if (isFree) {
        return `  {
    id: "${animal.id}",
    name: "${animal.name}",
    sadImage: require("../../public/data/generated-free/animals/sad/${animal.fileName}"),
    happyImage: require("../../public/data/generated-free/animals/happy/${animal.fileName}")
  }`;
      } else {
        const sadId = `animal-${animal.id.replace(/_/g, "-")}-sad`;
        const happyId = `animal-${animal.id.replace(/_/g, "-")}-happy`;
        return `  {
    id: "${animal.id}",
    name: "${animal.name}",
    sadRemoteAssetId: "${sadId}",
    happyRemoteAssetId: "${happyId}"
  }`;
      }
    })
    .join(",\n");

  const content = `import type { Animal } from "./types";

export const generatedAnimals: Animal[] = [
${entries}
];
`;

  await fs.writeFile(path.join(srcDataDir, "animals.generated.ts"), content);
}

async function writeRewardManifest(concepts: RewardConcept[], freeAnimalName: string) {
  const entries = concepts
    .map((concept) => {
      const isFree = concept.animalName === freeAnimalName;
      if (isFree) {
        return `  {
    id: "${concept.id}",
    animalName: "${concept.animalName}",
    label: "${concept.label}",
    title: "${concept.title}",
    image: require("../../public/data/generated-free/rewards/${concept.fileName}"),
    globalIndex: ${concept.globalIndex},
    pack: ${concept.pack},
    sheet: ${concept.sheetInPack},
    cell: ${concept.cell}
  }`;
      } else {
        const rewardSlugId = `reward-${concept.id.replace(/_/g, "-")}-${slugify(concept.animalName).replace(/_/g, "-")}-${slugify(concept.label).replace(/_/g, "-")}`;
        return `  {
    id: "${concept.id}",
    animalName: "${concept.animalName}",
    label: "${concept.label}",
    title: "${concept.title}",
    remoteAssetId: "${rewardSlugId}",
    globalIndex: ${concept.globalIndex},
    pack: ${concept.pack},
    sheet: ${concept.sheetInPack},
    cell: ${concept.cell}
  }`;
      }
    })
    .join(",\n");

  const content = `import type { RewardImage } from "./types";

export const generatedRewardImages: RewardImage[] = [
${entries}
];

export const generatedRewardGroups = generatedRewardImages.reduce<Record<string, RewardImage[]>>(
  (groups, reward) => {
    groups[reward.animalName] = groups[reward.animalName] ?? [];
    groups[reward.animalName].push(reward);
    return groups;
  },
  {}
);

export function getGeneratedRewardsForAnimal(animalName: string) {
  return generatedRewardGroups[animalName] ?? [];
}
`;

  await fs.writeFile(path.join(srcDataDir, "rewards.generated.ts"), content);
}

async function writeVerificationManifest(
  animals: AnimalAsset[],
  concepts: RewardConcept[]
) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    animals: {
      count: animals.length,
      columns: animalColumns,
      rows: animalRows,
      skippedSourceCells: Array.from(duplicateAnimalSheetCells).map((cell) => ({
        zeroBasedCell: cell,
        sheet: Math.floor(cell / animalCellCountPerSheet) + 1,
        cell: (cell % animalCellCountPerSheet) + 1,
        reason: "duplicate flamingo before Mandarin Duck"
      })),
      items: animals
    },
    rewards: {
      count: concepts.length,
      columns: rewardColumns,
      rows: rewardRows,
      items: concepts.map(({ fileName, ...concept }) => ({
        ...concept,
        fileName
      }))
    }
  };

  await fs.writeFile(
    path.join(freeGeneratedDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

async function main() {
  await fs.rm(generatedDir, { recursive: true, force: true }).catch(() => {});
  const concepts = await readRewardConcepts();
  const animals = buildAnimalAssets(getAnimalNamesFromRewards(concepts));

  if (animals.length !== 79) {
    throw new Error(`Expected 79 animal reward groups, found ${animals.length}.`);
  }

  const freeAnimalName = animals[0].name;

  await writeAnimalAssets(animals);
  await writeRewardAssets(concepts, freeAnimalName);
  await writeAnimalManifest(animals);
  await writeRewardManifest(concepts, freeAnimalName);
  await writeVerificationManifest(animals, concepts);

  console.log(`Generated ${animals.length} animal pairs.`);
  console.log(`Generated ${concepts.length} reward images.`);
  console.log("Wrote public/data/generated-free/manifest.json.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
