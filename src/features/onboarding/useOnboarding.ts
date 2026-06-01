import { useCallback, useEffect, useState } from "react";

import { getOnboarded, setOnboarded } from "../../storage/rescueStorage";

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const onboarded = await getOnboarded();
    setHasOnboarded(onboarded);
    setIsLoading(false);
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
