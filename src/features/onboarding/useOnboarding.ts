import { useCallback, useEffect, useState } from "react";

import { getOnboarded, setOnboarded } from "../../storage/rescueStorage";

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Add timeout to prevent hanging in production builds
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.log('Onboarding check timeout - using default value');
          resolve(false);
        }, 3000);
      });

      const onboardedPromise = getOnboarded();
      
      const onboarded = await Promise.race([onboardedPromise, timeoutPromise]);
      setHasOnboarded(onboarded);
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
      setHasOnboarded(false);
    } finally {
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
