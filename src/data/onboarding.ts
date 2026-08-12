import type { ImageSourcePropType } from "react-native";

import { uiSprites } from "./ui.generated";

export type OnboardingSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  requestsStepAccess?: boolean;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "steps-save",
    title: "Your Steps Can Save Them",
    subtitle: "Every walk helps rescue a scared animal waiting for you.",
    image: uiSprites.onboardingScaredPuppy
  },
  {
    id: "feed-care",
    title: "Feed Them Along The Way",
    subtitle: "Small milestones give food, water, care, and hope.",
    image: uiSprites.onboardingRescuerWater
  },
  {
    id: "break-cage",
    title: "Break The Cage",
    subtitle: "Reach the step target and set your next animal free.",
    image: uiSprites.onboardingCageBreak
  },
  {
    id: "happy-family",
    title: "Build Your Happy Animal Family",
    subtitle: "Unlock rescued animals and watch your collection grow.",
    image: uiSprites.onboardingHappyFamily
  },
  {
    id: "step-access",
    title: "Connect Your Steps",
    subtitle:
      "Allow step access so today’s movement can power your rescue journey. Your step total stays on this device.",
    image: uiSprites.emptyPermissionPhone,
    requestsStepAccess: true
  }
];
