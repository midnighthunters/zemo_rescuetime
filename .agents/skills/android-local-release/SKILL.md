---
name: android-local-release
description: >-
  Standard procedure for generating signed Android APKs and AABs (App Bundles)
  locally using Gradle. Always use this workflow instead of GitHub Actions for
  building release artifacts.
---

# Android Local Release Build Skill Guide

## 1. Core Principle: Local Build Exclusively
All Android release builds (APKs for direct distribution/testing and AABs for Google Play Console) must be generated **locally** on this development machine using the Gradle wrapper. Do **not** trigger or depend on remote GitHub Actions workflows for release artifacts.

---

## 2. Version Bump Checklist
Before building a new release, bump both `versionCode` and `version` across all 4 project files:

1. [android/app/build.gradle](file:///c:/AnnusMirabilis/ZEMOLABS/AURORA/E2_RescueTime/android/app/build.gradle):
   ```groovy
   defaultConfig {
       versionCode 8       // Increment by 1
       versionName "1.0.6" // Semver string
   }
   ```
2. [app.config.ts](file:///c:/AnnusMirabilis/ZEMOLABS/AURORA/E2_RescueTime/app.config.ts):
   ```typescript
   version: '1.0.6',
   android: {
     versionCode: 8,
   }
   ```
3. [package.json](file:///c:/AnnusMirabilis/ZEMOLABS/AURORA/E2_RescueTime/package.json):
   ```json
   "version": "1.0.6"
   ```
4. [app/(tabs)/settings.tsx](file:///c:/AnnusMirabilis/ZEMOLABS/AURORA/E2_RescueTime/app/(tabs)/settings.tsx):
   ```typescript
   // Update displayed version label to match current release
   ```

---

## 3. Keystore & Signing Configuration
The project is preconfigured to sign release artifacts automatically with the local keystore:
- **Keystore File**: `android/app/release.keystore`
- **Store Password**: `rescuetime123`
- **Key Alias**: `rescuetime`
- **Key Password**: `rescuetime123`

In `android/app/build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword 'rescuetime123'
        keyAlias 'rescuetime'
        keyPassword 'rescuetime123'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        ...
    }
}
```

---

## 4. Architecture & ABI Size Optimization
To prevent bloated APK/AAB sizes, `android/gradle.properties` restricts builds to physical device ABIs:
```properties
reactNativeArchitectures=armeabi-v7a,arm64-v8a
android.enableSeparateBuildPerCPUArchitecture=false
```
- `armeabi-v7a`: Legacy 32-bit Android phones.
- `arm64-v8a`: Modern 64-bit Android phones.
- Excluded: `x86`, `x86_64` (emulator binaries), saving ~37 MB native library bloat.

---

## 5. Local Build Commands

### A. Build Standalone Release APK
Use this to generate a signed APK for local installation, sideloading, or internal device testing:
```powershell
cd android
./gradlew assembleRelease --no-daemon
```
- **Output Path**: `android/app/build/outputs/apk/release/app-release.apk`

### B. Build Google Play Store App Bundle (AAB)
Google Play Console requires an `.aab` file for new releases:
```powershell
cd android
./gradlew bundleRelease --no-daemon
```
- **Output Path**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 6. Verification
To verify the generated artifact before distribution:
```powershell
# Check size and timestamp
Get-Item android\app\build\outputs\apk\release\app-release.apk
Get-Item android\app\build\outputs\bundle\release\app-release.aab

# Verify APK signing
$BuildTools = (Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" | Sort-Object Name -Descending | Select-Object -First 1).FullName
& "$BuildTools\apksigner.bat" verify --verbose android\app\build\outputs\apk\release\app-release.apk
```
