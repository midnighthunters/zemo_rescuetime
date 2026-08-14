import type { ConfigContext, ExpoConfig } from "expo/config";

const boolFromEnv = (value: string | undefined) => value === "true";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Rescue Animals Steps",
  slug: "rescue-animals-step-counter",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  scheme: "rescueanimals",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFF8EA"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.zemolabs.rescuetime",
    requireFullScreen: false,
    infoPlist: {
      NSHealthShareUsageDescription:
        "Rescue Animals Steps reads your step count so your walks can unlock animal care and rescue progress.",
      NSHealthUpdateUsageDescription:
        "Rescue Animals Steps does not write any data to Health.",
      UIRequiresFullScreen: false
    },
    entitlements: {
      "com.apple.developer.healthkit": true
    }
  },
  android: {
    package: "com.zemolabs.rescuetime",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFF8EA"
    },
    permissions: [
      "ACTIVITY_RECOGNITION",
      "POST_NOTIFICATIONS",
      "com.android.vending.BILLING"
    ]
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-notifications",
  ],
  extra: {
    eas: {
      projectId: "41d8c626-78f9-4b01-a6f0-90ae40bee098"
    },
    revenueCatEntitlementId:
      process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro",
    revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    revenueCatAndroidApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
    revenueCatUseTestStore: boolFromEnv(
      process.env.EXPO_PUBLIC_REVENUECAT_USE_TEST_STORE
    ),
    revenueCatTestApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "",
    revenueCatTestIosApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_TEST_IOS_API_KEY ?? "",
    revenueCatTestAndroidApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_TEST_ANDROID_API_KEY ?? "",
    revenueCatTestAppUserId:
      process.env.EXPO_PUBLIC_REVENUECAT_TEST_APP_USER_ID ??
      "rescue-animals-test-user",
    revenueCatMonthlyPackageId:
      process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PACKAGE_ID ?? "$rc_monthly",
    revenueCatYearlyPackageId:
      process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PACKAGE_ID ?? "$rc_annual",
    revenueCatIosMonthlyProductId:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_MONTHLY_PRODUCT_ID ??
      "com.zemolabs.rescuetime.pro.monthly",
    revenueCatIosYearlyProductId:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_YEARLY_PRODUCT_ID ??
      "com.zemolabs.rescuetime.pro.yearly",
    revenueCatAndroidMonthlyProductId:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID ??
      "rescue_animals_pro_monthly",
    revenueCatAndroidYearlyProductId:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_YEARLY_PRODUCT_ID ??
      "rescue_animals_pro_yearly"
  }
});
