import Constants from "expo-constants";
import { Platform } from "react-native";

export const ENTITLEMENT_PRO =
  Constants.expoConfig?.extra?.revenueCatEntitlementId ?? "pro";

type RevenueCatModule = {
  LOG_LEVEL?: { DEBUG: string };
  setLogLevel?: (level: string) => Promise<void> | void;
  configure: (options: { apiKey: string }) => void;
  getCustomerInfo: () => Promise<{
    entitlements: { active: Record<string, unknown> };
  }>;
  getOfferings: () => Promise<{
    current?: { availablePackages: unknown[] } | null;
  }>;
  purchasePackage: (purchasePackage: unknown) => Promise<{
    customerInfo: { entitlements: { active: Record<string, unknown> } };
  }>;
  restorePurchases: () => Promise<{
    entitlements: { active: Record<string, unknown> };
  }>;
};

let purchases: RevenueCatModule | null = null;
let configured = false;

function getApiKey() {
  const extra = Constants.expoConfig?.extra ?? {};
  if (Platform.OS === "ios") {
    return String(extra.revenueCatIosApiKey ?? "");
  }

  return String(extra.revenueCatAndroidApiKey ?? "");
}

function loadPurchasesModule() {
  if (purchases) {
    return purchases;
  }

  try {
    const module = require("react-native-purchases") as {
      default?: RevenueCatModule;
    } & RevenueCatModule;
    purchases = module.default ?? module;
    return purchases;
  } catch {
    return null;
  }
}

function hasProEntitlement(customerInfo: {
  entitlements: { active: Record<string, unknown> };
}) {
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_PRO]);
}

export async function configurePurchases() {
  if (configured) {
    return true;
  }

  if (Platform.OS === "web") {
    return false;
  }

  const apiKey = getApiKey();
  const module = loadPurchasesModule();

  if (!apiKey || !module) {
    return false;
  }

  if (__DEV__ && module.LOG_LEVEL?.DEBUG && module.setLogLevel) {
    await module.setLogLevel(module.LOG_LEVEL.DEBUG);
  }

  module.configure({ apiKey });
  configured = true;
  return true;
}

export async function getCustomerEntitlement() {
  const ready = await configurePurchases();
  if (!ready || !purchases) {
    return { isConfigured: false, isPro: false };
  }

  const customerInfo = await purchases.getCustomerInfo();
  return {
    isConfigured: true,
    isPro: hasProEntitlement(customerInfo)
  };
}

export async function purchaseProPackage() {
  const ready = await configurePurchases();
  if (!ready || !purchases) {
    throw new Error("RevenueCat is not configured for this build.");
  }

  const offerings = await purchases.getOfferings();
  const packageToPurchase = offerings.current?.availablePackages[0];

  if (!packageToPurchase) {
    throw new Error("No RevenueCat offering is available.");
  }

  const result = await purchases.purchasePackage(packageToPurchase);
  return hasProEntitlement(result.customerInfo);
}

export async function restoreRevenueCatPurchases() {
  const ready = await configurePurchases();
  if (!ready || !purchases) {
    throw new Error("RevenueCat is not configured for this build.");
  }

  const customerInfo = await purchases.restorePurchases();
  return hasProEntitlement(customerInfo);
}
