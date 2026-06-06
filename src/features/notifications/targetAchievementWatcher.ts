import { NativeModules, Platform } from "react-native";

import type { PendingUnlockEvent } from "../../data/types";

type NativeTargetAchievementModule = {
  syncPlan: (planJson: string) => Promise<void>;
  getNativeEvents: () => Promise<string>;
  getStepSnapshot?: () => Promise<string>;
  markNativeEventsConsumed: (eventIdsJson: string) => Promise<void>;
  dismissNotification: (eventId: string) => Promise<void>;
};

export type TargetAchievementPlan = {
  enabled: boolean;
  dateKey: string;
  activeStepsToday: number;
  stepsToday: number;
  pendingEventIds: string[];
  claimedTargetSteps: number[];
  currentAnimal?: {
    id: string;
    name: string;
    rescueNotificationBody?: string;
    rescueNotificationTitle?: string;
    rescued: boolean;
    unlockSteps: number;
    rewardTargets: {
      notificationBody?: string;
      notificationTitle?: string;
      rewardId: string;
      title: string;
      stepTarget: number;
    }[];
  };
};

export type NativeStepSnapshot = {
  dateKey: string;
  currentAnimalId: string;
  activeStepsToday: number;
  stepsToday: number;
};

const nativeTargetAchievementModule =
  NativeModules.TargetAchievementModule as
    | NativeTargetAchievementModule
    | undefined;

function hasNativeWatcher() {
  return Platform.OS === "android" && !!nativeTargetAchievementModule;
}

function isPendingUnlockEvent(value: unknown): value is PendingUnlockEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<PendingUnlockEvent>;
  if (
    typeof event.id !== "string" ||
    typeof event.animalId !== "string" ||
    typeof event.stepTarget !== "number" ||
    typeof event.createdAt !== "string"
  ) {
    return false;
  }

  if (event.type === "rescue") {
    return true;
  }

  return event.type === "reward" && typeof event.rewardId === "string";
}

function isNativeStepSnapshot(value: unknown): value is NativeStepSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<NativeStepSnapshot>;
  return (
    typeof snapshot.dateKey === "string" &&
    typeof snapshot.currentAnimalId === "string" &&
    typeof snapshot.activeStepsToday === "number" &&
    typeof snapshot.stepsToday === "number"
  );
}

export async function syncTargetAchievementWatcher(
  plan: TargetAchievementPlan
) {
  if (!hasNativeWatcher()) {
    return;
  }

  await nativeTargetAchievementModule?.syncPlan(JSON.stringify(plan));
}

export async function getNativeTargetAchievementEvents() {
  if (!hasNativeWatcher()) {
    return [];
  }

  const raw = await nativeTargetAchievementModule?.getNativeEvents();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isPendingUnlockEvent) : [];
  } catch {
    return [];
  }
}

export async function getNativeTargetAchievementStepSnapshot() {
  if (!hasNativeWatcher()) {
    return undefined;
  }

  const raw = await nativeTargetAchievementModule?.getStepSnapshot?.();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isNativeStepSnapshot(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function markNativeTargetAchievementEventsConsumed(
  eventIds: string[]
) {
  if (!hasNativeWatcher() || eventIds.length === 0) {
    return;
  }

  await nativeTargetAchievementModule?.markNativeEventsConsumed(
    JSON.stringify(eventIds)
  );
}

export async function dismissNativeTargetAchievementNotification(
  eventId: string
) {
  if (!hasNativeWatcher()) {
    return;
  }

  await nativeTargetAchievementModule?.dismissNotification(eventId);
}
