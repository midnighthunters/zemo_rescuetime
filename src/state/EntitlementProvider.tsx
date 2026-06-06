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
  purchaseProPackage,
  restoreRevenueCatPurchases
} from "../features/purchases/purchaseService";

type EntitlementContextValue = {
  isPro: boolean;
  isLoading: boolean;
  isRevenueCatConfigured: boolean;
  error?: string;
  devProEnabled: boolean;
  refreshEntitlements: () => Promise<void>;
  purchasePro: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  setDevProEnabled: (enabled: boolean) => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | undefined>(
  undefined
);

export function EntitlementProvider({ children }: PropsWithChildren) {
  const [isProFromRevenueCat, setIsProFromRevenueCat] = useState(false);
  const [devProEnabled, setDevProEnabledState] = useState(false);
  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const refreshEntitlements = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Add timeout to prevent hanging in production builds (RevenueCat API call)
      const timeoutPromise = new Promise<{isConfigured: boolean; isPro: boolean}>((resolve) => {
        setTimeout(() => {
          resolve({ isConfigured: false, isPro: false });
        }, 5000);
      });

      const entitlementPromise = getCustomerEntitlement();
      
      const result = await Promise.race([entitlementPromise, timeoutPromise]);
      setIsRevenueCatConfigured(result.isConfigured);
      setIsProFromRevenueCat(result.isPro);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not refresh subscription status."
      );
      setIsRevenueCatConfigured(false);
      setIsProFromRevenueCat(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Add timeout to prevent hanging on AsyncStorage
    const timeoutId = setTimeout(() => {
      if (mounted) {
        refreshEntitlements();
      }
    }, 3000);

    getDevSettings()
      .then((settings) => {
        if (mounted) {
          clearTimeout(timeoutId);
          setDevProEnabledState(Boolean(settings.mockProEnabled));
        }
      })
      .catch(() => {
        if (mounted) {
          clearTimeout(timeoutId);
        }
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(timeoutId);
          refreshEntitlements();
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [refreshEntitlements]);

  const setDevProEnabled = useCallback(async (enabled: boolean) => {
    if (!__DEV__) {
      return;
    }

    const settings = await getDevSettings();
    await saveDevSettings({
      ...settings,
      mockProEnabled: enabled
    });
    setDevProEnabledState(enabled);
  }, []);

  const purchasePro = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const purchased = await purchaseProPackage();
      setIsProFromRevenueCat(purchased);
      return purchased;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not complete purchase."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const restored = await restoreRevenueCatPurchases();
      setIsProFromRevenueCat(restored);
      return restored;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not restore purchase."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      isPro: isProFromRevenueCat || (__DEV__ && devProEnabled),
      isLoading,
      isRevenueCatConfigured,
      error,
      devProEnabled,
      refreshEntitlements,
      purchasePro,
      restorePurchases,
      setDevProEnabled
    }),
    [
      devProEnabled,
      error,
      isLoading,
      isProFromRevenueCat,
      isRevenueCatConfigured,
      purchasePro,
      refreshEntitlements,
      restorePurchases,
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
