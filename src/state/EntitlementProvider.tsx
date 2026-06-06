import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { getDevSettings, saveDevSettings } from "../storage/rescueStorage";
import {
  getCustomerEntitlement,
  getFallbackRevenueCatPlans,
  getRevenueCatDebugInfo,
  getRevenueCatErrorMessage,
  getRevenueCatOfferings,
  isRevenueCatPurchaseCancelled,
  purchaseProPackage,
  restoreRevenueCatPurchases,
  subscribeToCustomerInfoUpdates,
  type RevenueCatDebugInfo,
  type RevenueCatEntitlementState,
  type RevenueCatOfferingsState,
  type RevenueCatPlan,
  type RevenueCatPlanId
} from "../features/purchases/purchaseService";

type EntitlementContextValue = {
  activePlanId?: RevenueCatPlanId;
  devProEnabled: boolean;
  error?: string;
  isLoading: boolean;
  isPro: boolean;
  isRevenueCatConfigured: boolean;
  managementURL?: string | null;
  offeringId?: string;
  plans: RevenueCatPlan[];
  revenueCatDebugInfo: RevenueCatDebugInfo;
  purchasePro: (planId?: RevenueCatPlanId) => Promise<boolean>;
  refreshEntitlements: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  setDevProEnabled: (enabled: boolean) => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | undefined>(
  undefined
);

const REVENUECAT_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, REVENUECAT_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function getEntitlementErrorMessage(caught: unknown) {
  return getRevenueCatErrorMessage(
    caught,
    "Could not refresh subscription status."
  );
}

export function EntitlementProvider({ children }: PropsWithChildren) {
  const [activePlanId, setActivePlanId] = useState<
    RevenueCatPlanId | undefined
  >();
  const [devProEnabled, setDevProEnabledState] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProFromRevenueCat, setIsProFromRevenueCat] = useState(false);
  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false);
  const [managementURL, setManagementURL] = useState<string | null | undefined>();
  const [offeringId, setOfferingId] = useState<string | undefined>();
  const [plans, setPlans] = useState<RevenueCatPlan[]>(
    getFallbackRevenueCatPlans
  );

  const revenueCatDebugInfo = useMemo(() => getRevenueCatDebugInfo(), []);

  const applyEntitlementState = useCallback(
    (state: RevenueCatEntitlementState) => {
      setActivePlanId(state.activePlanId);
      setIsProFromRevenueCat(state.isPro);
      setIsRevenueCatConfigured(state.isConfigured);
      setManagementURL(state.managementURL);
    },
    []
  );

  const applyOfferingsState = useCallback((state: RevenueCatOfferingsState) => {
    setIsRevenueCatConfigured((configured) => configured || state.isConfigured);
    setOfferingId(state.offeringId);
    setPlans(state.plans);
  }, []);

  const refreshEntitlements = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const [entitlementResult, offeringsResult] = await Promise.allSettled([
      withTimeout(
        getCustomerEntitlement(),
        "RevenueCat subscription check timed out."
      ),
      withTimeout(
        getRevenueCatOfferings(),
        "RevenueCat offerings check timed out."
      )
    ]);

    if (entitlementResult.status === "fulfilled") {
      applyEntitlementState(entitlementResult.value);
    } else {
      setIsRevenueCatConfigured(false);
      setIsProFromRevenueCat(false);
      setError(getEntitlementErrorMessage(entitlementResult.reason));
    }

    if (offeringsResult.status === "fulfilled") {
      applyOfferingsState(offeringsResult.value);
    } else {
      setPlans(getFallbackRevenueCatPlans());
      setError((currentError) =>
        currentError ?? getEntitlementErrorMessage(offeringsResult.reason)
      );
    }

    setIsLoading(false);
  }, [applyEntitlementState, applyOfferingsState]);

  useEffect(() => {
    let mounted = true;

    async function loadDevSettings() {
      try {
        const settings = await withTimeout(
          getDevSettings(),
          "Local test settings timed out."
        );

        if (mounted) {
          setDevProEnabledState(Boolean(settings.mockProEnabled));
        }
      } finally {
        if (mounted) {
          void refreshEntitlements();
        }
      }
    }

    void loadDevSettings();

    return () => {
      mounted = false;
    };
  }, [refreshEntitlements]);

  useEffect(() => {
    let mounted = true;
    let removeListener: (() => void) | undefined;

    subscribeToCustomerInfoUpdates((state) => {
      if (mounted) {
        applyEntitlementState(state);
      }
    })
      .then((unsubscribe) => {
        if (!mounted) {
          unsubscribe?.();
          return;
        }

        removeListener = unsubscribe;
      })
      .catch(() => {
        // The refresh path handles unavailable RevenueCat builds.
      });

    return () => {
      mounted = false;
      removeListener?.();
    };
  }, [applyEntitlementState]);

  const setDevProEnabled = useCallback(async (enabled: boolean) => {
    const settings = await getDevSettings();
    await saveDevSettings({
      ...settings,
      mockProEnabled: enabled
    });
    setDevProEnabledState(enabled);
  }, []);

  const purchasePro = useCallback(
    async (planId: RevenueCatPlanId = "yearly") => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await purchaseProPackage(planId);
        setActivePlanId(result.activePlanId);
        setIsProFromRevenueCat(result.isPro);
        setManagementURL(result.managementURL);
        return result.isPro;
      } catch (caught) {
        if (!isRevenueCatPurchaseCancelled(caught)) {
          setError(
            getRevenueCatErrorMessage(caught, "Could not complete purchase.")
          );
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await restoreRevenueCatPurchases();
      setActivePlanId(result.activePlanId);
      setIsProFromRevenueCat(result.isPro);
      setManagementURL(result.managementURL);
      return result.isPro;
    } catch (caught) {
      setError(
        getRevenueCatErrorMessage(caught, "Could not restore purchase.")
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      activePlanId,
      devProEnabled,
      error,
      isLoading,
      isPro: isProFromRevenueCat || devProEnabled,
      isRevenueCatConfigured,
      managementURL,
      offeringId,
      plans,
      revenueCatDebugInfo,
      purchasePro,
      refreshEntitlements,
      restorePurchases,
      setDevProEnabled
    }),
    [
      activePlanId,
      devProEnabled,
      error,
      isLoading,
      isProFromRevenueCat,
      isRevenueCatConfigured,
      managementURL,
      offeringId,
      plans,
      purchasePro,
      refreshEntitlements,
      restorePurchases,
      revenueCatDebugInfo,
      setDevProEnabled
    ]
  );

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);

  if (!context) {
    throw new Error("useEntitlements must be used inside EntitlementProvider");
  }

  return context;
}
