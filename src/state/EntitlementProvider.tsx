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
      const result = await getCustomerEntitlement();
      setIsRevenueCatConfigured(result.isConfigured);
      setIsProFromRevenueCat(result.isPro);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not refresh subscription status."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    getDevSettings()
      .then((settings) => {
        if (mounted) {
          setDevProEnabledState(Boolean(settings.mockProEnabled));
        }
      })
      .finally(() => {
        if (mounted) {
          refreshEntitlements();
        }
      });

    return () => {
      mounted = false;
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
