import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Rescue Animals Steps",
  slug: "rescue-animals-step-counter",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "rescueanimals",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFF8EA"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.annusmirabilis.rescueanimalssteps",
    infoPlist: {
      NSMotionUsageDescription:
        "Your steps help feed, care for, and rescue animals in the app."
    }
  },
  android: {
    package: "com.annusmirabilis.rescueanimalssteps",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFF8EA"
    },
    permissions: ["ACTIVITY_RECOGNITION"]
  },
  plugins: ["expo-router", "expo-font"],
  extra: {
    revenueCatEntitlementId:
      process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro",
    revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    revenueCatAndroidApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? ""
  }
});
