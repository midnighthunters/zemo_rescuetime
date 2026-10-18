const fs = require('fs');
const path = require('path');

// 1. Update src/data/animals.generated.ts
const happyFiles = fs.readdirSync('public/data/generated-free/animals/happy');
const sadFiles = fs.readdirSync('public/data/generated-free/animals/sad');

// Read existing animals to get names and ids
const animalsFileContent = fs.readFileSync('src/data/animals.generated.ts', 'utf8');
const idNameRegex = /{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;

let match;
const animals = [];
while ((match = idNameRegex.exec(animalsFileContent)) !== null) {
  animals.push({ id: match[1], name: match[2] });
}

console.log(`Found ${animals.length} animals in src/data/animals.generated.ts`);

let animalsTs = `import type { Animal } from "./types";\n\nexport const generatedAnimals: Animal[] = [\n`;
for (const a of animals) {
  const happy = happyFiles.find(f => f.startsWith(a.id + '_'));
  const sad = sadFiles.find(f => f.startsWith(a.id + '_'));
  if (!happy || !sad) {
    throw new Error(`Missing asset for ${a.id}`);
  }
  animalsTs += `  {\n`;
  animalsTs += `    id: "${a.id}",\n`;
  animalsTs += `    name: "${a.name}",\n`;
  animalsTs += `    sadImage: require("../../public/data/generated-free/animals/sad/${sad}"),\n`;
  animalsTs += `    happyImage: require("../../public/data/generated-free/animals/happy/${happy}")\n`;
  animalsTs += `  },\n`;
}
animalsTs = animalsTs.replace(/,\n$/, '\n') + `];\n`;
fs.writeFileSync('src/data/animals.generated.ts', animalsTs, 'utf8');
console.log('Successfully updated src/data/animals.generated.ts with all 79 local webp images');

// 2. Update src/data/rewards.generated.ts for rewards 007 to 024
const rewardFiles = fs.readdirSync('public/data/generated-free/rewards');
let rewardsFileContent = fs.readFileSync('src/data/rewards.generated.ts', 'utf8');

for (let i = 7; i <= 24; i++) {
  const pad = String(i).padStart(3, '0');
  const rewardId = `reward_${pad}`;
  const file = rewardFiles.find(f => f.startsWith(rewardId + '_'));
  if (!file) {
    throw new Error(`Missing reward file for ${rewardId}`);
  }

  // Replace remoteAssetId: "reward-..." in this block with image: require(...)
  const blockRegex = new RegExp(`(id:\\s*"${rewardId}",[\\s\\S]*?)remoteAssetId:\\s*"[^"]*",?([\\s\\S]*?cell:\\s*\\d+)`);
  rewardsFileContent = rewardsFileContent.replace(blockRegex, `$1image: require("../../public/data/generated-free/rewards/${file}"),$2`);
}

fs.writeFileSync('src/data/rewards.generated.ts', rewardsFileContent, 'utf8');
console.log('Successfully updated src/data/rewards.generated.ts for rewards 007-024');
