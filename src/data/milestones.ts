import type {
  Animal,
  AnimalCareState,
  AnimalMood,
  RescueMilestone
} from "./types";
import { getGeneratedRewardsForAnimal } from "./rewards.generated";

const unlockStepTargets = [
  5000,
  8000,
  12000,
  14000,
  18000,
  20000,
  22000,
  24000,
  26000,
  28000,
  30000
];

function getUnlockStepTarget(index: number) {
  return unlockStepTargets[index] ?? 30000;
}

export function generateMilestones(animals: Animal[]): RescueMilestone[] {
  return animals.map((animal, index) => {
    const target = getUnlockStepTarget(index);
    const rewards = getGeneratedRewardsForAnimal(animal.name).slice(0, 6);
    const rewardTargets = rewards.map((reward, rewardIndex) => {
      const stepTarget = Math.round(
        target * ((rewardIndex + 1) / (rewards.length + 1))
      );

      return {
        id: `${animal.id}_${reward.id}`,
        animalId: animal.id,
        rewardId: reward.id,
        label: reward.label,
        title: reward.title,
        image: reward.image,
        stepTarget,
        rewardIndex
      };
    });

    return {
      animalId: animal.id,
      unlockSteps: target,
      isFree: index === 0,
      miniMilestones: rewardTargets.map((reward) => reward.stepTarget),
      rewardTargets
    };
  });
}

export function getPreviousMilestoneSteps(index: number) {
  return 0;
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
  const requiredSteps = Math.max(1, milestone.unlockSteps);
  return clampProgress(stepsToday / requiredSteps);
}

export function getCompletedMiniMilestones(
  stepsToday: number,
  milestone: RescueMilestone
) {
  return milestone.miniMilestones.filter((stepTarget) => stepsToday >= stepTarget);
}

export function getCompletedRewardTargets(
  stepsToday: number,
  milestone: RescueMilestone
) {
  return milestone.rewardTargets.filter(
    (target) => stepsToday >= target.stepTarget
  );
}

export function getNextRewardTarget(
  stepsToday: number,
  milestone: RescueMilestone
) {
  return milestone.rewardTargets.find(
    (target) => stepsToday < target.stepTarget
  );
}

export function getRewardTargetByStep(
  milestone: RescueMilestone,
  stepTarget: number
) {
  return milestone.rewardTargets.find(
    (target) => target.stepTarget === stepTarget
  );
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
