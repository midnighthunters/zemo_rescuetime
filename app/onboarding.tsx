import { router } from "expo-router";

import { OnboardingCarousel } from "../src/features/onboarding/OnboardingCarousel";
import { useOnboarding } from "../src/features/onboarding/useOnboarding";
import { useRescue } from "../src/state/RescueProvider";

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const { steps } = useRescue();

  const handleDone = async () => {
    await steps.requestPermission();
    await completeOnboarding();
    router.replace("/(tabs)/home");
  };

  const handleSkipPermission = async () => {
    await completeOnboarding();
    router.replace("/(tabs)/home");
  };

  return (
    <OnboardingCarousel
      onDone={handleDone}
      onSkipPermission={handleSkipPermission}
    />
  );
}
