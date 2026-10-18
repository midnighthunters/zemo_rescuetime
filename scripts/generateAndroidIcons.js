const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const sourcePath = path.join(__dirname, '../ios/RescueAnimalsSteps/Images.xcassets/AppIcon.appiconset/AppIcon-1024.png');
  const sourceBuffer = fs.readFileSync(sourcePath);

  // 1. Root assets
  await sharp(sourceBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');
  console.log('Generated assets/icon.png');

  await sharp(sourceBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/logo.png');
  console.log('Generated assets/logo.png');

  // Adaptive icon for Expo (1024x1024, centered ~730px with transparent or black background)
  const innerSize = 730;
  const innerBuffer = await sharp(sourceBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([{ input: innerBuffer, top: Math.round((1024 - innerSize) / 2), left: Math.round((1024 - innerSize) / 2) }])
    .png()
    .toFile('assets/adaptive-icon.png');
  console.log('Generated assets/adaptive-icon.png');

  // 2. Android mipmaps
  const densities = [
    { name: 'mdpi', launcherSize: 48, foregroundSize: 108 },
    { name: 'hdpi', launcherSize: 72, foregroundSize: 162 },
    { name: 'xhdpi', launcherSize: 96, foregroundSize: 216 },
    { name: 'xxhdpi', launcherSize: 144, foregroundSize: 324 },
    { name: 'xxxhdpi', launcherSize: 192, foregroundSize: 432 },
  ];

  for (const d of densities) {
    const dir = path.join(__dirname, `../android/app/src/main/res/mipmap-${d.name}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.webp
    await sharp(sourceBuffer)
      .resize(d.launcherSize, d.launcherSize)
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher.webp'));

    // ic_launcher_round.webp (circle mask)
    const circleSvg = Buffer.from(
      `<svg width="${d.launcherSize}" height="${d.launcherSize}"><circle cx="${d.launcherSize / 2}" cy="${d.launcherSize / 2}" r="${d.launcherSize / 2}" fill="#ffffff"/></svg>`
    );
    await sharp(sourceBuffer)
      .resize(d.launcherSize, d.launcherSize)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher_round.webp'));

    // ic_launcher_foreground.webp
    // Inner size ~ 71.3% of foregroundSize so it fits the safe zone
    const fgInner = Math.round(d.foregroundSize * 0.713);
    const fgInnerBuffer = await sharp(sourceBuffer)
      .resize(fgInner, fgInner)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: d.foregroundSize,
        height: d.foregroundSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: fgInnerBuffer,
        top: Math.round((d.foregroundSize - fgInner) / 2),
        left: Math.round((d.foregroundSize - fgInner) / 2)
      }])
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher_foreground.webp'));

    console.log(`Generated mipmap-${d.name} icons`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
