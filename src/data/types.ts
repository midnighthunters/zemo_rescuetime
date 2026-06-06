import type { ImageSourcePropType } from "react-native";
import type { AppLanguage } from "../i18n/languages";

export type Animal = {
  id: string;
  name: string;
  sadImage: ImageSourcePropType;
  happyImage: ImageSourcePropType;
};

export type RewardImage = {
  id: string;
  animalName: string;
  label: string;
  title: string;
  image: ImageSourcePropType;
  globalIndex: number;
  pack: number;
  sheet: number;
  cell: number;
};

export type AnimalCareState =
  | "hungry"
  | "fed"
  | "healing"
  | "hopeful"
  | "ready_to_rescue";

export type AnimalMood =
  | "very_sad"
  | "sad"
  | "hopeful"
  | "happy"
  | "rescued";

export type RescueMilestone = {
  animalId: string;
  unlockSteps: number;
  isFree: boolean;
  miniMilestones: number[];
  rewardTargets: RescueRewardTarget[];
};

export type RescueRewardTarget = {
  id: string;
  animalId: string;
  rewardId: string;
  label: string;
  title: string;
  image: ImageSourcePropType;
  stepTarget: number;
  rewardIndex: number;
};

export type AnimalCardStatus =
  | "locked"
  | "active"
  | "unlocked"
  | "pro_locked";

export type RescueProgress = {
  onboarded: boolean;
  rescuedAnimalIds: string[];
  currentAnimalId: string;
  stepBaselineToday: number;
  claimedMiniMilestones: Record<string, number[]>;
  focusedUnlockEventId?: string;
  pendingUnlockEvents: PendingUnlockEvent[];
  rescuedDates: Record<string, string>;
  lastKnownDate: string;
  activeJourneyStepsToday: number;
  dailyStepHistory: Record<string, number>;
};

export type PendingUnlockEvent =
  | {
      id: string;
      type: "reward";
      animalId: string;
      rewardId: string;
      stepTarget: number;
      createdAt: string;
    }
  | {
      id: string;
      type: "rescue";
      animalId: string;
      stepTarget: number;
      createdAt: string;
    };

export type DevSettings = {
  mockProEnabled?: boolean;
};

export type AppSettings = {
  language?: AppLanguage;
  unlockAudioEnabled?: boolean;
};
