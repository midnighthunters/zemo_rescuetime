import { router } from "expo-router";

import { OnboardingCarousel } from "../src/features/onboarding/OnboardingCarousel";
import { useOnboarding } from "../src/features/onboarding/useOnboarding";

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();

  const handleDone = async () => {
    await completeOnboarding();
    router.replace("/(tabs)/home");
  };

  return <OnboardingCarousel onDone={handleDone} />;
}
