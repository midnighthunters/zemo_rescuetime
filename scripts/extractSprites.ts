import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type SpriteMetadata = {
  columns?: number;
  rows?: number;
  names?: string[];
};

const rootDir = process.cwd();
const happyDir = path.join(rootDir, "public", "data", "happy");
const sadDir = path.join(rootDir, "public", "data", "sad");
const uiDir = path.join(rootDir, "public", "data", "ui");
const dataDir = path.join(rootDir, "public", "data");
const generatedHappyDir = path.join(
  rootDir,
  "assets",
  "generated",
  "animals",
  "happy"
);
const generatedSadDir = path.join(
  rootDir,
  "assets",
  "generated",
  "animals",
  "sad"
);
const generatedJailDir = path.join(rootDir, "assets", "generated", "jail");
const generatedUiDir = path.join(rootDir, "assets", "generated", "ui");
const srcDataDir = path.join(rootDir, "src", "data");

const defaultNames = [
  "Lion",
  "Elephant",
  "Giraffe",
  "Panda",
  "Bunny",
  "Fox",
  "Bear",
  "Kitten",
  "Puppy",
  "Monkey",
  "Koala",
  "Penguin",
  "Owl",
  "Frog",
  "Hippo",
  "Tiger",
  "Deer",
  "Zebra",
  "Squirrel",
  "Lamb",
  "Cow",
  "Piglet",
  "Duckling",
  "Turtle",
  "Raccoon"
];

const uiSpriteKeys = [
  "onboardingScaredPuppy",
  "onboardingRescuerWater",
  "onboardingCageBreak",
  "onboardingHappyFamily",
  "onboardingHopefulPanda",
  "onboardingFootprintTrail",
  "onboardingOwlGuide",
  "onboardingSafeTurtle",
  "homeAnimalInCage",
  "homeCageOpening",
  "homeAnimalSteppingOut",
  "homeGoldenFootprint",
  "homeRescueBackpack",
  "homeSanctuaryIsland",
  "homeProgressRingMascot",
  "homeRescuerFlag",
  "careWaterBowl",
  "careFoodBowl",
  "careMedkit",
  "careBlanket",
  "careGroomingBrush",
  "careMoodHeartMeter",
  "careRewardChest",
  "careHandTreat",
  "progressPawTrophy",
  "progressWeeklyCalendar",
  "progressTimelineTrail",
  "progressCompletedBadge",
  "progressMountainTrail",
  "progressConfettiBurst",
  "progressPortraitMedal",
  "progressGemJar",
  "collectionLockedBubble",
  "collectionUnlockedFrame",
  "collectionLockedPetHouse",
  "collectionSafeHomeFrame",
  "collectionAnimalAlbum",
  "collectionSleepingCushion",
  "collectionMysteryCrate",
  "collectionPremiumBadge",
  "proSanctuaryGate",
  "proCrownedBadge",
  "proAnimalFamily",
  "proGoldenKey",
  "proDeluxeHouse",
  "proRescueMap",
  "proTreasureChest",
  "proOwlShopkeeper",
  "emptySettingsAnimal",
  "emptySleepingPedometer",
  "emptySanctuaryNest",
  "emptyOwlChecklist",
  "emptyPawCloud",
  "emptyPermissionPhone",
  "emptyLostPathSign",
  "emptyAnimalWave",
  "microPawConfetti",
  "microGiftAnimal",
  "microHeartBubble",
  "microRescueRibbon",
  "microWalkingShoe",
  "microMoodTrail",
  "microJumpingAnimal",
  "microTabOwl"
] as const;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readMetadata(dir: string): Promise<SpriteMetadata> {
  const filePath = path.join(dir, "metadata.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as SpriteMetadata;
  } catch {
    return {};
  }
}

async function findFirstPng(dir: string) {
  const entries = await fs.readdir(dir);
  const png = entries
    .filter((entry) => entry.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b))[0];

  if (!png) {
    throw new Error(`No PNG spritesheet found in ${dir}`);
  }

  return path.join(dir, png);
}

async function clearPngs(dir: string) {
  await ensureDir(dir);
  const entries = await fs.readdir(dir);
  await Promise.all(
    entries
      .filter((entry) => entry.toLowerCase().endsWith(".png"))
      .map((entry) => fs.rm(path.join(dir, entry), { force: true }))
  );
}

async function transparentizeCheckerboard(image: sharp.Sharp) {
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightest = Math.max(red, green, blue);
    const darkest = Math.min(red, green, blue);
    const isBackground =
      red > 232 && green > 232 && blue > 232 && brightest - darkest < 24;

    if (isBackground) {
      data[index + 3] = 0;
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

async function extractSheet(
  sheetPath: string,
  outputDir: string,
  metadata: SpriteMetadata
) {
  const image = sharp(sheetPath);
  const info = await image.metadata();
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  const columns = metadata.columns ?? 5;
  const rows = metadata.rows ?? 5;
  const count = columns * rows;

  if (!width || !height) {
    throw new Error(`Could not read dimensions for ${sheetPath}`);
  }

  await clearPngs(outputDir);

  for (let index = 0; index < count; index += 1) {
    const bounds = cellBounds(width, height, columns, rows, index);
    const id = `animal_${String(index + 1).padStart(3, "0")}`;

    await sharp(sheetPath)
      .extract(bounds)
      .resize(360, 360, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, `${id}.png`));
  }

  return count;
}

async function extractUiSheets() {
  try {
    const entries = await fs.readdir(uiDir);
    const sheets = entries
      .filter((entry) => entry.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b));

    if (sheets.length === 0) {
      console.warn("No UI sprite sheets found; UI sprites were not generated.");
      return 0;
    }

    await clearPngs(generatedUiDir);

    let count = 0;
    const columns = 4;
    const rows = 2;

    for (const sheet of sheets) {
      const sheetPath = path.join(uiDir, sheet);
      const info = await sharp(sheetPath).metadata();
      const width = info.width ?? 0;
      const height = info.height ?? 0;

      if (!width || !height) {
        throw new Error(`Could not read dimensions for ${sheetPath}`);
      }

      for (let index = 0; index < columns * rows; index += 1) {
        count += 1;
        const bounds = cellBounds(width, height, columns, rows, index);
        const id = `ui_${String(count).padStart(3, "0")}`;

        await sharp(sheetPath)
          .extract(bounds)
          .resize(512, 512, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(path.join(generatedUiDir, `${id}.png`));
      }
    }

    return count;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn("No public/data/ui directory found; UI sprites were not generated.");
      return 0;
    }

    throw error;
  }
}

async function extractJailSprites() {
  const candidates = ["jail.png", "cage.png"];
  const source = candidates
    .map((fileName) => path.join(dataDir, fileName))
    .find((filePath) => require("node:fs").existsSync(filePath));

  if (!source) {
    console.warn("No jail.png or cage.png found; jail sprites were not generated.");
    return;
  }

  const sprites = [
    {
      fileName: "top.png",
      left: 102,
      top: 128,
      width: 570,
      height: 214,
      outputWidth: 720,
      outputHeight: 270
    },
    {
      fileName: "open-jail.png",
      left: 84,
      top: 418,
      width: 592,
      height: 526,
      outputWidth: 720,
      outputHeight: 640
    },
    {
      fileName: "gate.png",
      left: 746,
      top: 498,
      width: 456,
      height: 404,
      outputWidth: 560,
      outputHeight: 496
    },
    {
      fileName: "platform.png",
      left: 344,
      top: 986,
      width: 620,
      height: 226,
      outputWidth: 720,
      outputHeight: 270
    }
  ];

  await ensureDir(generatedJailDir);

  await Promise.all(
    sprites.map(async (sprite) => {
      const image = await transparentizeCheckerboard(
        sharp(source).extract({
          left: sprite.left,
          top: sprite.top,
          width: sprite.width,
          height: sprite.height
        })
      );

      await image
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
        .resize(sprite.outputWidth, sprite.outputHeight, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(generatedJailDir, sprite.fileName));
    })
  );
}

async function writeExpoIcons() {
  const firstAnimal = path.join(generatedHappyDir, "animal_001.png");
  const assetsDir = path.join(rootDir, "assets");
  await ensureDir(assetsDir);

  await sharp(firstAnimal)
    .resize(1024, 1024, {
      fit: "contain",
      background: "#FFF8EA"
    })
    .png()
    .toFile(path.join(assetsDir, "icon.png"));

  await sharp(firstAnimal)
    .resize(1024, 1024, {
      fit: "contain",
      background: "#FFF8EA"
    })
    .png()
    .toFile(path.join(assetsDir, "adaptive-icon.png"));

  await sharp(firstAnimal)
    .resize(512, 512, {
      fit: "contain",
      background: "#FFF8EA"
    })
    .png()
    .toFile(path.join(assetsDir, "splash-icon.png"));
}

async function writeManifest(count: number, metadata: SpriteMetadata) {
  await ensureDir(srcDataDir);
  const names = metadata.names?.length ? metadata.names : defaultNames;
  const entries = Array.from({ length: count }, (_, index) => {
    const id = `animal_${String(index + 1).padStart(3, "0")}`;
    const name = names[index] ?? `Animal ${index + 1}`;

    return `  {
    id: "${id}",
    name: "${name}",
    sadImage: require("../../assets/generated/animals/sad/${id}.png"),
    happyImage: require("../../assets/generated/animals/happy/${id}.png")
  }`;
  }).join(",\n");

  const content = `import type { Animal } from "./types";

export const generatedAnimals: Animal[] = [
${entries}
];
`;

  await fs.writeFile(path.join(srcDataDir, "animals.generated.ts"), content);
}

async function writeUiManifest() {
  await ensureDir(srcDataDir);

  const typeEntries = uiSpriteKeys
    .map((key) => `  | "${key}"`)
    .join("\n");
  const spriteEntries = uiSpriteKeys
    .map((key, index) => {
      const id = `ui_${String(index + 1).padStart(3, "0")}`;
      return `  ${key}: require("../../assets/generated/ui/${id}.png") as ImageSourcePropType`;
    })
    .join(",\n");

  const groups = [
    ["onboardingUiSprites", 0, 8],
    ["homeUiSprites", 8, 16],
    ["careUiSprites", 16, 24],
    ["progressUiSprites", 24, 32],
    ["collectionUiSprites", 32, 40],
    ["proUiSprites", 40, 48],
    ["emptyUiSprites", 48, 56],
    ["microUiSprites", 56, 64]
  ]
    .map(([name, start, end]) => {
      const keys = uiSpriteKeys
        .slice(start as number, end as number)
        .map((key) => `  uiSprites.${key}`)
        .join(",\n");

      return `export const ${name} = [
${keys}
] as const;`;
    })
    .join("\n\n");

  const content = `import type { ImageSourcePropType } from "react-native";

export type UiSpriteKey =
${typeEntries};

export const uiSprites: Record<UiSpriteKey, ImageSourcePropType> = {
${spriteEntries}
};

${groups}
`;

  await fs.writeFile(path.join(srcDataDir, "ui.generated.ts"), content);
}

async function main() {
  const [happyMetadata, sadMetadata] = await Promise.all([
    readMetadata(happyDir),
    readMetadata(sadDir)
  ]);
  const metadata = {
    columns: happyMetadata.columns ?? sadMetadata.columns ?? 5,
    rows: happyMetadata.rows ?? sadMetadata.rows ?? 5,
    names: happyMetadata.names ?? sadMetadata.names ?? defaultNames
  };

  const [happySheet, sadSheet] = await Promise.all([
    findFirstPng(happyDir),
    findFirstPng(sadDir)
  ]);

  const [happyCount, sadCount] = await Promise.all([
    extractSheet(happySheet, generatedHappyDir, metadata),
    extractSheet(sadSheet, generatedSadDir, metadata)
  ]);

  const count = Math.min(happyCount, sadCount);
  if (happyCount !== sadCount) {
    console.warn(
      `Happy/sad sprite counts differ. Using ${count} paired animals.`
    );
  }

  await extractJailSprites();
  const uiCount = await extractUiSheets();
  await writeManifest(count, metadata);
  await writeUiManifest();
  await writeExpoIcons();

  console.log(`Extracted ${count} rescue animals.`);
  if (uiCount > 0) {
    console.log(`Extracted ${uiCount} UI sprites.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
