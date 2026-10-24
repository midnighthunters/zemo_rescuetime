---
name: rescuetime-app
description: >-
  Architecture, asset standards, memory constraints, and development guidelines
  for the Animal Rescue Step Counter (RescueAnimalsSteps) app. Use whenever modifying
  assets, screens, fonts, or core native modules for this project.
---

# Animal Rescue Step Counter (`com.zemolabs.rescuetime`) Skill Guide

## 1. Project Overview & Architecture
- **Framework**: Expo SDK 53 + React Native with New Architecture enabled (`newArchEnabled=true`, Fabric, TurboModules).
- **Engine**: Hermes JS Engine (`hermesEnabled=true`).
- **Routing**: Expo Router (`app/` filesystem-based routing).
- **Application ID**: `com.zemolabs.rescuetime` (Google Play App ID: `4972113770213821021`).
- **Platform**: Android (minSdk: 24, targetSdk: 36, compileSdk: 36, NDK: 27.1.12297006) and iOS.

---

## 2. Directory Structure
```
c:\AnnusMirabilis\ZEMOLABS\AURORA\E2_RescueTime/
├── android/                   # Native Android project configuration
│   ├── app/build.gradle      # Versioning, signingConfigs, ABI splits, vector icons
│   ├── app/release.keystore  # Release keystore for local signed builds
│   └── gradle.properties     # JVM args, architecture filters, feature flags
├── app/                       # Expo Router application screens
│   ├── (tabs)/               # Bottom tab navigation (dashboard, steps, settings, etc.)
│   └── animal/[id].tsx       # Dynamic animal detail route
├── assets/                    # App icons, splash screens, cage art, audio
├── public/data/
│   ├── generated-free/       # 170+ animal WebP artwork images
│   └── animals.json          # Animal metadata catalog
└── src/                       # Components, stores, sound player, RevenueCat integration
```

---

## 3. Critical Asset & Memory Optimization Guidelines

> [!CAUTION]
> **Android Heap OOM Startup Crashes**: Never place full-resolution (e.g. 2048x2048) images into `public/data/generated-free/`. Android decodes images into uncompressed bitmaps in memory (`width × height × 4 bytes`). Loading 150+ large images causes immediate `OutOfMemoryError` on app startup.

### Image Dimensions
- All animal images in `public/data/generated-free/` **MUST be 500×500 WebP**.
- Keep transparent padding and RGBA transparency intact.
- Use Sharp or Lanczos3 resampling when generating or replacing animal images:
  ```python
  from PIL import Image
  img = Image.open("animal.webp").convert("RGBA")
  img = img.resize((500, 500), Image.Resampling.LANCZOS)
  img.save("animal.webp", "WEBP", quality=85)
  ```

### PNG Assets & Color Modes
- Root icons (`icon.png`, `adaptive-icon.png`, `logo.png`, `splash-icon.png`, `cage.png`) must always be saved as standard **32-bit RGBA** (Mode `RGBA`).
- Avoid indexed palette mode (`P`), which can cause `BitmapFactory` decoding failures on certain Android versions.

### Icon Font Tree-Shaking
- Do **NOT** import from `@expo/vector-icons` root:
  ```typescript
  // ❌ Inefficient - imports large bundle
  import { Ionicons } from '@expo/vector-icons';
  ```
- Always import directly from the icon subfamily:
  ```typescript
  // ✅ Tree-shakeable - only packages Ionicons
  import Ionicons from '@expo/vector-icons/Ionicons';
  ```
- `android/app/build.gradle` is configured with `project.ext.vectoricons = [ iconFontNames: [ 'Ionicons.ttf' ] ]` to strip unused `.ttf` fonts (MaterialIcons, FontAwesome, etc.), saving ~3.6 MB.

### Audio Compression
- Store audio effects in compressed `.mp3` format (e.g., `unlock-chime.mp3`, ~26 KB), avoiding uncompressed `.wav` files (~136 KB+).

---

## 4. Dependencies & Core Integrations
- **RevenueCat (`react-native-purchases`)**: Subscription and paywall logic configured in `src/utils/` and `src/services/`.
- **Audio (`expo-av`)**: Sound playback utility in `src/utils/playUnlockChime.ts`.
- **Sensors / Steps**: Pedometer and target step achievements handled natively with background sync.
