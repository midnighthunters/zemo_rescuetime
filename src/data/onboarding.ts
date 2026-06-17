import type { ImageSourcePropType } from "react-native";

export type OnboardingSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "steps-save",
    title: "Your Steps Can Save Them",
    subtitle: "Every walk helps rescue a scared animal waiting for you.",
    image: require("../../public/data/onboarding/ChatGPT Image Jun 1, 2026, 09_50_56 AM.webp")
  },
  {
    id: "feed-care",
    title: "Feed Them Along The Way",
    subtitle: "Small milestones give food, water, care, and hope.",
    image: require("../../public/data/onboarding/ChatGPT Image Jun 1, 2026, 09_51_00 AM.webp")
  },
  {
    id: "break-cage",
    title: "Break The Cage",
    subtitle: "Reach the step target and set your next animal free.",
    image: require("../../public/data/onboarding/ChatGPT Image Jun 1, 2026, 09_51_03 AM.webp")
  },
  {
    id: "happy-family",
    title: "Build Your Happy Animal Family",
    subtitle: "Unlock rescued animals and watch your collection grow.",
    image: require("../../public/data/onboarding/ChatGPT Image Jun 1, 2026, 09_51_06 AM.webp")
  }
];
