# Zemo Animal Rescue — Remote Asset System (Cloudflare R2)

To reduce the size of the animal rescue app binary (from ~160 MB to ~2.1 MB), we have moved the Pro-only assets (animals and rewards) to **Cloudflare R2** and implemented a resumable download manager that caches them locally on demand.

## 1. Why Pro Assets are Remote
Bundling 79 high-resolution animal illustrations (sad and happy states) and 480 reward images causes the compiled Android APK/iOS IPA file size to inflate significantly. Moving the 78 Pro-only animals and their corresponding 474 reward images to a remote bucket ensures users install a lightweight, fast-loading bundle immediately, while Pro users can download the remaining rescue assets on-demand.

---

## 2. Folder Structure
* `remote-assets-source/`: Holds Pro-only assets that are uploaded to Cloudflare R2.
  * `data/generated/animals/happy/`
  * `data/generated/animals/sad/`
  * `data/generated/rewards/`
  * `data/audio/`
  * `data/stickers/`
  * `data/bonus/`
* `public/data/`: Holds assets bundled inside the app binary.
  * `placeholders/`: 1x1 transparent PNG files used before downloads complete.
  * `generated-free/`: Only the first free animal (Dog) and its rewards.
  * `cage/`, `onboarding/`, `ui/`: Standard UI elements.

---

## 3. How to Generate Assets
To regenerate the cut spritesheets:
```bash
npm run generate:rescue-assets
```
This automatically runs `scripts/generateRescueAssets.ts`, which:
1. Cleans the output folders.
2. Extracts the first animal ("Dog") and its rewards to `public/data/generated-free/`.
3. Extracts all remaining animals and rewards to `remote-assets-source/data/generated/`.
4. Outputs split configurations in `src/data/animals.generated.ts` and `src/data/rewards.generated.ts`.

---

## 4. How to Generate the Remote Manifest
To compile the metadata (sizes, relative paths, types) of all Pro assets:
```bash
npm run assets:manifest
```
This script scans the `remote-assets-source` directory and outputs a typed manifest at `src/services/assets/remoteAssetManifest.ts`.

---

## 5. How to Upload to Cloudflare R2
Configure your credentials in your shell or env:
```bash
export R2_ACCOUNT_ID="YOUR_ACCOUNT_ID"
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
```
Then run the sync script:
```bash
npm run assets:r2:upload -- --bucket YOUR_BUCKET --prefix zemo-animal-rescue-assets/v1
```
This uploads all files to R2 under `zemo-animal-rescue-assets/v1` with proper MIME types and Cache-Control headers (`public, max-age=31536000, immutable`).

---

## 6. Public URL and Cache Configuration
Settings are configured in [remoteAssets.ts](file:///c:/Battleworld/RescueTime/src/config/remoteAssets.ts):
```ts
export const REMOTE_ASSET_BASE_URL =
  process.env.EXPO_PUBLIC_REMOTE_ASSET_BASE_URL ||
  "https://YOUR_CLOUDFLARE_PUBLIC_DOMAIN/zemo-animal-rescue-assets/v1";
```
You can override the domain globally using `EXPO_PUBLIC_REMOTE_ASSET_BASE_URL` in your `.env` files.

---

## 7. How the Download Flow Works
1. **Purchase Success:** When RevenueCat unlocks Pro, the app updates `useSubscriptionStore` and triggers the `ProAssetDownloadModal` to show the download prompt.
2. **Download Choice:** The user can select `Download Now` or `Download Later`.
3. **Connectivity Check:** Before starting, the app checks internet connectivity using `@react-native-community/netinfo`. If offline, it asks the user to connect and try again.
4. **Resumable Progress:** Files are downloaded to a `.download` temp file using `expo-file-system/legacy`. Once the download completes, the file size is verified, it is moved to the final path, and the cached URI is saved in `AsyncStorage`.
5. **App Restart/Verification:** On launch, the app runs `checkProPackIntegrity()` which physically scans the disk. If files are missing, the status changes to `needs_download`, prompting a resume.
6. **Clearing Cache:** Users can clear downloaded local files from Settings via `clearDownloadedProAssets()`, reverting status to `needs_download` while keeping their Pro active.

---

## 8. Safety Verification
To confirm no heavy assets are accidentally bundled before releasing:
```bash
npm run assets:check-bundle-size
```
This script asserts that folders like `public/data/generated` do not exceed 1 MB, ensuring that release builds remain light.
