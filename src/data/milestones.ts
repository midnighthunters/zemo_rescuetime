import type {
  Animal,
  AnimalCareState,
  AnimalMood,
  RescueMilestone
} from "./types";

const baseMilestones = [
  1000, 2500, 5000, 7500, 10000, 12500, 15000, 20000
];

export const feedingMilestoneLabels = ["Water", "Food", "Care"];
export const feedingMilestoneIcons = ["water", "nutrition", "medkit"];

export function generateMilestones(animals: Animal[]): RescueMilestone[] {
  return animals.map((animal, index) => {
    const previous = getPreviousMilestoneSteps(index);
    const target = baseMilestones[index] ?? previous + 2500;
    const gap = target - previous;

    return {
      animalId: animal.id,
      unlockSteps: target,
      isFree: index === 0,
      miniMilestones: [
        Math.round(previous + gap * 0.25),
        Math.round(previous + gap * 0.5),
        Math.round(previous + gap * 0.75)
      ]
    };
  });
}

export function getPreviousMilestoneSteps(index: number) {
  if (index <= 0) {
    return 0;
  }

  return baseMilestones[index - 1] ?? index * 2500;
}

export function clampProgress(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export function getProgressToMilestone(
  stepsToday: number,
  milestone: RescueMilestone,
  animalIndex: number
) {
  const previous = getPreviousMilestoneSteps(animalIndex);
  const requiredGap = Math.max(1, milestone.unlockSteps - previous);
  return clampProgress((stepsToday - previous) / requiredGap);
}

export function getCompletedMiniMilestones(
  stepsToday: number,
  milestone: RescueMilestone
) {
  return milestone.miniMilestones.filter((stepTarget) => stepsToday >= stepTarget);
}

export function getAnimalMood(progress: number, isRescued: boolean): AnimalMood {
  if (isRescued || progress >= 1) {
    return "rescued";
  }

  if (progress <= 0.15) {
    return "very_sad";
  }

  if (progress <= 0.4) {
    return "sad";
  }

  if (progress <= 0.7) {
    return "hopeful";
  }

  return "happy";
}

export function getCareState(mood: AnimalMood): AnimalCareState {
  switch (mood) {
    case "very_sad":
      return "hungry";
    case "sad":
      return "fed";
    case "hopeful":
      return "healing";
    case "happy":
      return "hopeful";
    case "rescued":
      return "ready_to_rescue";
  }
}

export function getMoodMeta(mood: AnimalMood) {
  switch (mood) {
    case "very_sad":
      return {
        label: "Very Sad",
        icon: "sad-outline",
        helper: "Still scared... keep walking",
        tint: "#7B8AA0"
      };
    case "sad":
      return {
        label: "Sad",
        icon: "rainy-outline",
        helper: "It needs care",
        tint: "#5F7EA6"
      };
    case "hopeful":
      return {
        label: "Hopeful",
        icon: "leaf-outline",
        helper: "Getting stronger",
        tint: "#2FA866"
      };
    case "happy":
      return {
        label: "Happy",
        icon: "heart-outline",
        helper: "Almost free!",
        tint: "#FF8A5B"
      };
    case "rescued":
      return {
        label: "Rescued",
        icon: "sparkles-outline",
        helper: "You saved your friend!",
        tint: "#1FAD6B"
      };
  }
}

export function getNextMiniMilestone(
  stepsToday: number,
  milestone: RescueMilestone
) {
  return milestone.miniMilestones.find((stepTarget) => stepsToday < stepTarget);
}
