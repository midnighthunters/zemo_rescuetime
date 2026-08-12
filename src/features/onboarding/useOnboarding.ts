import { useCallback, useEffect, useState } from "react";

import { getOnboarded, setOnboarded } from "../../storage/rescueStorage";

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(false);
        }, 3000);
      });

      const onboardedPromise = getOnboarded();
      const onboarded = await Promise.race([onboardedPromise, timeoutPromise]);
      setHasOnboarded(onboarded);
    } catch {
      setHasOnboarded(false);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(async () => {
    await setOnboarded(true);
    setHasOnboarded(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await setOnboarded(false);
    setHasOnboarded(false);
  }, []);

  return {
    isLoading,
    hasOnboarded,
    completeOnboarding,
    resetOnboarding,
    refresh
  };
}
