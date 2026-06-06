import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage
} from "react-native-purchases";

type PurchasesModule = typeof import("react-native-purchases");
type RevenueCatModule = PurchasesModule["default"];
type ExtraConfig = Record<string, unknown>;

export type RevenueCatPlanId = "monthly" | "yearly";

export type RevenueCatPlan = {
  id: RevenueCatPlanId;
  title: string;
  price: string;
  periodLabel: string;
  detail: string;
  badge?: string;
  packageId: string;
  productId: string;
  isAvailable: boolean;
  source: "revenuecat" | "fallback";
};

export type RevenueCatEntitlementState = {
  isConfigured: boolean;
  isPro: boolean;
  activePlanId?: RevenueCatPlanId;
  managementURL?: string | null;
};

export type RevenueCatOfferingsState = {
  isConfigured: boolean;
  offeringId?: string;
  plans: RevenueCatPlan[];
};

export type RevenueCatPurchaseResult = {
  isPro: boolean;
  activePlanId?: RevenueCatPlanId;
  managementURL?: string | null;
};

export type RevenueCatDebugInfo = {
  activeProductIds: Record<RevenueCatPlanId, string>;
  apiKeySource:
    | "android"
    | "ios"
    | "none"
    | "test"
    | "test-android"
    | "test-ios";
  entitlementId: string;
  hasApiKey: boolean;
  packageIds: Record<RevenueCatPlanId, string>;
  platform: string;
  productIds: {
    android: Record<RevenueCatPlanId, string>;
    ios: Record<RevenueCatPlanId, string>;
  };
  testAppUserId: string;
  usesTestStore: boolean;
};

export const ENTITLEMENT_PRO =
  getExtraString("revenueCatEntitlementId", "pro") || "pro";

const PLAN_DETAILS: Record<
  RevenueCatPlanId,
  {
    fallbackPrice: string;
    packageExtraKey: string;
    packageFallback: string;
    periodLabel: string;
    title: string;
  }
> = {
  monthly: {
    fallbackPrice: "$6",
    packageExtraKey: "revenueCatMonthlyPackageId",
    packageFallback: "$rc_monthly",
    periodLabel: "per month",
    title: "Monthly"
  },
  yearly: {
    fallbackPrice: "$50",
    packageExtraKey: "revenueCatYearlyPackageId",
    packageFallback: "$rc_annual",
    periodLabel: "per year",
    title: "Yearly"
  }
};

let purchases: RevenueCatModule | null = null;
let configured = false;
let configuredApiKey: string | null = null;
let lastConfigurationError: string | undefined;

function getExtra() {
  return (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
}

function getExtraString(key: string, fallback = "") {
  const value = getExtra()[key];

  if (typeof value === "string") {
    return value.trim();
  }

  return fallback;
}

function getExtraBoolean(key: string) {
  const value = getExtra()[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}

function getPackageId(planId: RevenueCatPlanId) {
  const plan = PLAN_DETAILS[planId];
  return getExtraString(plan.packageExtraKey, plan.packageFallback);
}

function getPlatformProductId(
  planId: RevenueCatPlanId,
  platform: "android" | "ios" | string = Platform.OS
) {
  if (platform === "ios") {
    return getExtraString(
      planId === "monthly"
        ? "revenueCatIosMonthlyProductId"
        : "revenueCatIosYearlyProductId"
    );
  }

  if (platform === "android") {
    return getExtraString(
      planId === "monthly"
        ? "revenueCatAndroidMonthlyProductId"
        : "revenueCatAndroidYearlyProductId"
    );
  }

  return "";
}

function getProductIdsForPlan(planId: RevenueCatPlanId) {
  return [
    getPlatformProductId(planId, Platform.OS),
    getPlatformProductId(planId, "ios"),
    getPlatformProductId(planId, "android")
  ].filter(Boolean);
}

function getApiKeyConfig() {
  const usesTestStore = getExtraBoolean("revenueCatUseTestStore");

  if (usesTestStore || __DEV__) {
    const platformTestApiKey =
      Platform.OS === "ios"
        ? getExtraString("revenueCatTestIosApiKey")
        : Platform.OS === "android"
          ? getExtraString("revenueCatTestAndroidApiKey")
          : "";
    const sharedTestApiKey = getExtraString("revenueCatTestApiKey");

    if (platformTestApiKey) {
      return {
        apiKey: platformTestApiKey,
        source:
          Platform.OS === "ios" ? ("test-ios" as const) : ("test-android" as const)
      };
    }

    if (sharedTestApiKey) {
      return {
        apiKey: sharedTestApiKey,
        source: "test" as const
      };
    }
  }

  if (Platform.OS === "ios") {
    return {
      apiKey: getExtraString("revenueCatIosApiKey"),
      source: "ios" as const
    };
  }

  if (Platform.OS === "android") {
    return {
      apiKey: getExtraString("revenueCatAndroidApiKey"),
      source: "android" as const
    };
  }

  return {
    apiKey: "",
    source: "none" as const
  };
}

function getConfiguredAppUserId() {
  const testAppUserId = getExtraString("revenueCatTestAppUserId");

  if ((__DEV__ || getExtraBoolean("revenueCatUseTestStore")) && testAppUserId) {
    return testAppUserId;
  }

  return undefined;
}

function loadPurchasesModule() {
  if (purchases) {
    return purchases;
  }

  try {
    const module = require("react-native-purchases") as PurchasesModule & {
      default?: RevenueCatModule;
    };
    purchases = module.default ?? (module as unknown as RevenueCatModule);
    return purchases;
  } catch (caught) {
    lastConfigurationError = getRevenueCatErrorMessage(
      caught,
      "RevenueCat could not be loaded for this build."
    );
    return null;
  }
}

function hasProEntitlement(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_PRO]);
}

function getPlanIdFromProductId(productId?: string | null) {
  if (!productId) {
    return undefined;
  }

  const normalizedProductId = productId.toLowerCase();

  if (
    getProductIdsForPlan("monthly").some((configuredProductId) =>
      configuredProductId.toLowerCase() === normalizedProductId
    ) ||
    normalizedProductId.includes("monthly") ||
    normalizedProductId.includes("month")
  ) {
    return "monthly" as const;
  }

  if (
    getProductIdsForPlan("yearly").some((configuredProductId) =>
      configuredProductId.toLowerCase() === normalizedProductId
    ) ||
    normalizedProductId.includes("yearly") ||
    normalizedProductId.includes("annual") ||
    normalizedProductId.includes("year")
  ) {
    return "yearly" as const;
  }

  return undefined;
}

function mapCustomerInfo(customerInfo: CustomerInfo): RevenueCatEntitlementState {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PRO];

  return {
    activePlanId: getPlanIdFromProductId(entitlement?.productIdentifier),
    isConfigured: true,
    isPro: hasProEntitlement(customerInfo),
    managementURL: customerInfo.managementURL
  };
}

function getPlanShortcut(
  offering: PurchasesOffering,
  planId: RevenueCatPlanId
) {
  return planId === "monthly" ? offering.monthly : offering.annual;
}

function getPackageType(planId: RevenueCatPlanId) {
  const packageType = purchases?.PACKAGE_TYPE;

  return planId === "monthly"
    ? packageType?.MONTHLY ?? "MONTHLY"
    : packageType?.ANNUAL ?? "ANNUAL";
}

function findPackageForPlan(
  offering: PurchasesOffering | null | undefined,
  planId: RevenueCatPlanId
) {
  if (!offering) {
    return null;
  }

  const packages = offering.availablePackages ?? [];
  const packageId = getPackageId(planId);
  const productIds = getProductIdsForPlan(planId);

  return (
    packages.find((candidate) => candidate.identifier === packageId) ??
    packages.find((candidate) =>
      productIds.includes(candidate.product.identifier)
    ) ??
    getPlanShortcut(offering, planId) ??
    packages.find((candidate) => candidate.packageType === getPackageType(planId)) ??
    null
  );
}

function getPackageDetail(
  planId: RevenueCatPlanId,
  purchasePackage: PurchasesPackage | null
) {
  if (planId === "monthly") {
    return "Billed monthly";
  }

  const monthlyEquivalent = purchasePackage?.product.pricePerMonthString;
  return monthlyEquivalent
    ? `${monthlyEquivalent} per month`
    : "About $4.17 per month";
}

function buildPlan(
  planId: RevenueCatPlanId,
  purchasePackage: PurchasesPackage | null
): RevenueCatPlan {
  const plan = PLAN_DETAILS[planId];

  return {
    badge: planId === "yearly" ? "Best value" : undefined,
    detail: getPackageDetail(planId, purchasePackage),
    id: planId,
    isAvailable: Boolean(purchasePackage),
    packageId: purchasePackage?.identifier ?? getPackageId(planId),
    periodLabel: plan.periodLabel,
    price: purchasePackage?.product.priceString ?? plan.fallbackPrice,
    productId: purchasePackage?.product.identifier ?? getPlatformProductId(planId),
    source: purchasePackage ? "revenuecat" : "fallback",
    title: plan.title
  };
}

function getFallbackSubscriptionPlans() {
  return (["monthly", "yearly"] as const).map((planId) =>
    buildPlan(planId, null)
  );
}

export function getFallbackRevenueCatPlans() {
  return getFallbackSubscriptionPlans();
}

async function getCurrentOffering() {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    return null;
  }

  const offerings = await purchases.getOfferings();
  return offerings.current;
}

export function getRevenueCatDebugInfo(): RevenueCatDebugInfo {
  const apiKeyConfig = getApiKeyConfig();

  return {
    activeProductIds: {
      monthly: getPlatformProductId("monthly"),
      yearly: getPlatformProductId("yearly")
    },
    apiKeySource: apiKeyConfig.source,
    entitlementId: ENTITLEMENT_PRO,
    hasApiKey: Boolean(apiKeyConfig.apiKey),
    packageIds: {
      monthly: getPackageId("monthly"),
      yearly: getPackageId("yearly")
    },
    platform: Platform.OS,
    productIds: {
      android: {
        monthly: getPlatformProductId("monthly", "android"),
        yearly: getPlatformProductId("yearly", "android")
      },
      ios: {
        monthly: getPlatformProductId("monthly", "ios"),
        yearly: getPlatformProductId("yearly", "ios")
      }
    },
    testAppUserId: getExtraString("revenueCatTestAppUserId"),
    usesTestStore: getExtraBoolean("revenueCatUseTestStore")
  };
}

export async function configurePurchases() {
  if (Platform.OS === "web") {
    lastConfigurationError =
      "RevenueCat purchases are not enabled on the web build.";
    return false;
  }

  const apiKeyConfig = getApiKeyConfig();
  const module = loadPurchasesModule();

  if (!apiKeyConfig.apiKey) {
    lastConfigurationError =
      "RevenueCat is missing an API key for this platform.";
    return false;
  }

  if (!module) {
    return false;
  }

  if (configured && configuredApiKey === apiKeyConfig.apiKey) {
    return true;
  }

  try {
    if (__DEV__) {
      await module.setLogLevel(module.LOG_LEVEL.DEBUG);
    }

    module.configure({
      apiKey: apiKeyConfig.apiKey,
      appUserID: getConfiguredAppUserId()
    });
    configured = true;
    configuredApiKey = apiKeyConfig.apiKey;
    lastConfigurationError = undefined;
    return true;
  } catch (caught) {
    configured = false;
    configuredApiKey = null;
    lastConfigurationError = getRevenueCatErrorMessage(
      caught,
      "RevenueCat could not be configured for this build."
    );
    return false;
  }
}

export async function getCustomerEntitlement(): Promise<RevenueCatEntitlementState> {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    return {
      isConfigured: false,
      isPro: false
    };
  }

  const customerInfo = await purchases.getCustomerInfo();
  return mapCustomerInfo(customerInfo);
}

export async function getRevenueCatOfferings(): Promise<RevenueCatOfferingsState> {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    return {
      isConfigured: false,
      plans: getFallbackSubscriptionPlans()
    };
  }

  const offering = await getCurrentOffering();

  return {
    isConfigured: true,
    offeringId: offering?.identifier,
    plans: (["monthly", "yearly"] as const).map((planId) =>
      buildPlan(planId, findPackageForPlan(offering, planId))
    )
  };
}

export async function purchaseProPackage(
  planId: RevenueCatPlanId = "yearly"
): Promise<RevenueCatPurchaseResult> {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    throw new Error(
      lastConfigurationError ?? "RevenueCat is not configured for this build."
    );
  }

  const offering = await getCurrentOffering();
  const packageToPurchase = findPackageForPlan(offering, planId);

  if (!packageToPurchase) {
    throw new Error(
      `No RevenueCat ${PLAN_DETAILS[planId].title.toLowerCase()} package is available.`
    );
  }

  const result = await purchases.purchasePackage(packageToPurchase);

  return {
    activePlanId:
      getPlanIdFromProductId(result.productIdentifier) ??
      getPlanIdFromProductId(
        result.customerInfo.entitlements.active[ENTITLEMENT_PRO]
          ?.productIdentifier
      ) ??
      planId,
    isPro: hasProEntitlement(result.customerInfo),
    managementURL: result.customerInfo.managementURL
  };
}

export async function restoreRevenueCatPurchases(): Promise<RevenueCatPurchaseResult> {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    throw new Error(
      lastConfigurationError ?? "RevenueCat is not configured for this build."
    );
  }

  const customerInfo = await purchases.restorePurchases();
  const entitlementState = mapCustomerInfo(customerInfo);

  return {
    activePlanId: entitlementState.activePlanId,
    isPro: entitlementState.isPro,
    managementURL: entitlementState.managementURL
  };
}

export async function subscribeToCustomerInfoUpdates(
  listener: (state: RevenueCatEntitlementState) => void
) {
  const ready = await configurePurchases();

  if (!ready || !purchases) {
    return undefined;
  }

  const customerInfoListener: CustomerInfoUpdateListener = (customerInfo) => {
    listener(mapCustomerInfo(customerInfo));
  };

  purchases.addCustomerInfoUpdateListener(customerInfoListener);

  return () => {
    purchases?.removeCustomerInfoUpdateListener(customerInfoListener);
  };
}

export function isRevenueCatPurchaseCancelled(caught: unknown) {
  const error = caught as Partial<PurchasesError> | undefined;
  return (
    error?.userCancelled === true ||
    error?.code === purchases?.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    error?.code === "1"
  );
}

export function getRevenueCatErrorMessage(
  caught: unknown,
  fallback: string
) {
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }

  const maybeError = caught as { message?: unknown } | undefined;
  if (typeof maybeError?.message === "string" && maybeError.message) {
    return maybeError.message;
  }

  return fallback;
}
