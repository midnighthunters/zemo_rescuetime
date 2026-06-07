import fs from "node:fs";
import path from "node:path";

// Dynamically import @aws-sdk/client-s3 if available, otherwise print setup instructions
async function main() {
  const args = process.argv.slice(2);
  let bucket = "YOUR_BUCKET";
  let prefix = "zemo-animal-rescue-assets/v1";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--bucket" && args[i + 1]) {
      bucket = args[i + 1];
      i++;
    } else if (args[i] === "--prefix" && args[i + 1]) {
      prefix = args[i + 1];
      i++;
    }
  }

  // Support reading from env if placeholders are still present
  const r2Bucket = process.env.R2_BUCKET || bucket;
  const r2Prefix = process.env.R2_PREFIX || prefix;
  const r2AccountId = process.env.R2_ACCOUNT_ID; // Cloudflare Account ID

  console.log(`Preparing upload to R2 bucket "${r2Bucket}" under prefix "${r2Prefix}"...`);

  let S3Client, PutObjectCommand;
  try {
    const s3Sdk = require("@aws-sdk/client-s3");
    S3Client = s3Sdk.S3Client;
    PutObjectCommand = s3Sdk.PutObjectCommand;
  } catch {
    console.error("\n[Error] '@aws-sdk/client-s3' is required to run the upload script.");
    console.error("Please install it first: npm install --save-dev @aws-sdk/client-s3\n");
    console.error("Make sure to configure your Cloudflare R2 environment variables:");
    console.error("  R2_ACCOUNT_ID          (Cloudflare Account ID)");
    console.error("  AWS_ACCESS_KEY_ID      (R2 Access Key)");
    console.error("  AWS_SECRET_ACCESS_KEY  (R2 Secret Key)\n");
    process.exit(1);
  }

  if (!r2AccountId) {
    console.error("[Error] R2_ACCOUNT_ID environment variable is missing.");
    console.error("Please configure R2_ACCOUNT_ID before running this script.");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const remoteAssetsSourceDir = path.join(process.cwd(), "remote-assets-source");

  function getFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath));
      } else {
        if (file !== ".gitkeep") {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  const files = getFilesRecursively(remoteAssetsSourceDir);
  console.log(`Found ${files.length} files to upload.`);

  const getContentType = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".png": return "image/png";
      case ".jpg":
      case ".jpeg": return "image/jpeg";
      case ".webp": return "image/webp";
      case ".mp3": return "audio/mpeg";
      case ".m4a": return "audio/mp4";
      case ".wav": return "audio/wav";
      case ".json": return "application/json";
      default: return "application/octet-stream";
    }
  };

  for (const file of files) {
    const relativePath = path.relative(remoteAssetsSourceDir, file).replace(/\\/g, "/");
    const key = `${r2Prefix.replace(/\/+$/, "")}/${relativePath}`;
    const fileBuffer = fs.readFileSync(file);
    const contentType = getContentType(file);

    console.log(`Uploading ${relativePath} -> ${key} (${contentType})...`);

    try {
      const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      });
      await s3.send(command);
    } catch (err) {
      console.error(`Failed to upload ${relativePath}:`, err);
      process.exit(1);
    }
  }

  console.log("\nAll assets uploaded successfully to Cloudflare R2!");
}

main().catch((err) => {
  console.error("Upload process crashed:", err);
  process.exit(1);
});
