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

async function copyCageAsset() {
  const candidates = ["cage.png", "jail.png"];
  const destination = path.join(rootDir, "assets", "generated", "cage.png");
  const source = candidates
    .map((fileName) => path.join(dataDir, fileName))
    .find((filePath) => require("node:fs").existsSync(filePath));

  if (!source) {
    console.warn("No cage.png or jail.png found; cage overlay will use fallback UI.");
    return;
  }

  await ensureDir(path.dirname(destination));
  await sharp(source)
    .resize(720, 720, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(destination);
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

  await copyCageAsset();
  await writeManifest(count, metadata);
  await writeExpoIcons();

  console.log(`Extracted ${count} rescue animals.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
