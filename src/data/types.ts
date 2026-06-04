import type { ImageSourcePropType } from "react-native";

export type Animal = {
  id: string;
  name: string;
  sadImage: ImageSourcePropType;
  happyImage: ImageSourcePropType;
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
  claimedMiniMilestones: Record<string, number[]>;
  rescuedDates: Record<string, string>;
  lastKnownDate: string;
  dailyStepHistory: Record<string, number>;
};

export type DevSettings = {
  mockProEnabled?: boolean;
};
