import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { Platform } from "react-native";

import { generatedAnimals } from "../data/animals.generated";
import {
  getCompletedRewardTargets,
  generateMilestones,
  getAnimalMood,
  getCareState,
  getCompletedMiniMilestones,
  getMoodMeta,
  getNextMiniMilestone,
  getNextRewardTarget,
  getPreviousMilestoneSteps,
  getProgressToMilestone
} from "../data/milestones";
import type {
  Animal,
  AnimalCardStatus,
  AnimalCareState,
  AnimalMood,
  PendingUnlockEvent,
  RescueMilestone,
  RescueProgress,
  RescueRewardTarget
} from "../data/types";
import { getAnimalCardStatus, canAccessAnimalIndex } from "../features/animals/animalAccess";
import {
  getCurrentAnimal,
  getLockedAnimals,
  getUnlockedAnimals
} from "../features/animals/animalSelectors";
import {
  dismissUnlockNotification,
  presentUnlockNotification,
  type UnlockNotificationPayload
} from "../features/notifications/unlockNotifications";
import {
  useStepCounter,
  type StepCounterState
} from "../features/steps/useStepCounter";
import {
  clearRescueProgress,
  getRescueProgress,
  saveRescueProgress
} from "../storage/rescueStorage";
import { getCurrentWeekDateKeys, getLocalDateKey } from "../utils/date";
import { useEntitlements } from "./EntitlementProvider";

export type AnimalMetrics = {
  animal: Animal;
  milestone: RescueMilestone;
  index: number;
  previousSteps: number;
  progress: number;
  remainingSteps: number;
  completedMiniMilestones: number[];
  claimedMiniMilestones: number[];
  completedRewardTargets: RescueRewardTarget[];
  claimedRewardTargets: RescueRewardTarget[];
  nextMiniMilestone?: number;
  nextRewardTarget?: RescueRewardTarget;
  careState: AnimalCareState;
  mood: AnimalMood;
  moodMeta: ReturnType<typeof getMoodMeta>;
  isRescued: boolean;
  canAccess: boolean;
  status: AnimalCardStatus;
};

type RescueEvent = {
  id: string;
  animalId: string;
  animalName: string;
  stepTarget: number;
};

type CareEvent = {
  id: string;
  animalId: string;
  animalName: string;
  stepTarget: number;
  label: string;
  title: string;
  rewardId: string;
  rewardIndex: number;
  image: RescueRewardTarget["image"];
};

type RescueContextValue = {
  animals: Animal[];
  milestones: RescueMilestone[];
  rescueProgress: RescueProgress;
  isLoading: boolean;
  currentAnimal?: Animal;
  currentMilestone?: RescueMilestone;
  currentAnimalIndex: number;
  lockedAnimals: Animal[];
  unlockedAnimals: Animal[];
  steps: StepCounterState;
  stepsToday: number;
  weeklySteps: number;
  lastRescueEvent?: RescueEvent;
  lastCareEvent?: CareEvent;
  devMockSteps?: number;
  canAccessAnimal: (animalId: string) => boolean;
  getAnimalStatus: (animalId: string) => AnimalCardStatus;
  getMilestone: (animalId: string) => RescueMilestone | undefined;
  getAnimalMetrics: (animalId: string) => AnimalMetrics | undefined;
  claimMiniMilestone: (animalId: string, stepTarget: number) => Promise<void>;
  rescueAnimal: (animalId: string, unlockedAtSteps?: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  unlockFirstAnimal: () => Promise<void>;
  advanceMockSteps: () => void;
  resetMockSteps: () => void;
  focusUnlockEvent: (eventId: string) => void;
  dismissRescueEvent: () => void;
  dismissCareEvent: () => void;
};

const RescueContext = createContext<RescueContextValue | undefined>(undefined);
const DAILY_STEP_HISTORY_WRITE_DELTA = 100;

function createDefaultProgress(animals: Animal[]): RescueProgress {
  return {
    onboarded: false,
    rescuedAnimalIds: [],
    currentAnimalId: animals[0]?.id ?? "",
    stepBaselineToday: 0,
    claimedMiniMilestones: {},
    pendingUnlockEvents: [],
    rescuedDates: {},
    lastKnownDate: getLocalDateKey(),
    activeJourneyStepsToday: 0,
    dailyStepHistory: {}
  };
}

function mergeProgress(saved: RescueProgress | null, animals: Animal[]) {
  const fallback = createDefaultProgress(animals);
  if (!saved) {
    return fallback;
  }

  const rescuedAnimalIds = Array.isArray(saved.rescuedAnimalIds)
    ? saved.rescuedAnimalIds.filter((id) =>
        animals.some((animal) => animal.id === id)
      )
    : [];
  const pendingUnlockEvents = Array.isArray(saved.pendingUnlockEvents)
    ? saved.pendingUnlockEvents.filter((event) =>
        animals.some((animal) => animal.id === event.animalId)
      )
    : [];
  const currentAnimalId =
    animals.find((animal) => animal.id === saved.currentAnimalId)?.id ??
    animals.find((animal) => !rescuedAnimalIds.includes(animal.id))?.id ??
    "";
  const focusedUnlockEventId = pendingUnlockEvents.some(
    (event) => event.id === saved.focusedUnlockEventId
  )
    ? saved.focusedUnlockEventId
    : undefined;

  const today = getLocalDateKey();
  const savedActiveJourneySteps =
    typeof saved.activeJourneyStepsToday === "number"
      ? saved.activeJourneyStepsToday
      : saved.dailyStepHistory?.[today] ?? 0;

  return {
    ...fallback,
    ...saved,
    rescuedAnimalIds,
    currentAnimalId,
    focusedUnlockEventId,
    stepBaselineToday: Math.max(0, saved.stepBaselineToday ?? 0),
    claimedMiniMilestones: saved.claimedMiniMilestones ?? {},
    pendingUnlockEvents,
    rescuedDates: saved.rescuedDates ?? {},
    lastKnownDate: saved.lastKnownDate ?? getLocalDateKey(),
    activeJourneyStepsToday: Math.max(0, savedActiveJourneySteps),
    dailyStepHistory: saved.dailyStepHistory ?? {}
  };
}

function nextUnrescuedAnimalId(animals: Animal[], rescuedAnimalIds: string[]) {
  return animals.find((animal) => !rescuedAnimalIds.includes(animal.id))?.id ?? "";
}

function appendPendingUnlockEvents(
  existingEvents: PendingUnlockEvent[],
  nextEvents: PendingUnlockEvent[]
) {
  const existingIds = new Set(existingEvents.map((event) => event.id));
  const uniqueNextEvents = nextEvents.filter((event) => {
    if (existingIds.has(event.id)) {
      return false;
    }

    existingIds.add(event.id);
    return true;
  });

  return [...existingEvents, ...uniqueNextEvents];
}

function isValidPendingUnlockEvent(
  event: PendingUnlockEvent,
  animals: Animal[],
  milestones: RescueMilestone[]
) {
  const animalExists = animals.some((animal) => animal.id === event.animalId);
  if (!animalExists) {
    return false;
  }

  if (event.type === "rescue") {
    return true;
  }

  return milestones.some(
    (milestone) =>
      milestone.animalId === event.animalId &&
      milestone.rewardTargets.some((target) => target.rewardId === event.rewardId)
  );
}

function createRewardUnlockEvent(
  animalId: string,
  target: RescueRewardTarget,
  createdAt: string
): PendingUnlockEvent {
  return {
    id: `reward:${animalId}:${target.rewardId}`,
    type: "reward",
    animalId,
    rewardId: target.rewardId,
    stepTarget: target.stepTarget,
    createdAt
  };
}

function createRescueUnlockEvent(
  animalId: string,
  stepTarget: number,
  createdAt: string
): PendingUnlockEvent {
  return {
    id: `rescue:${animalId}`,
    type: "rescue",
    animalId,
    stepTarget,
    createdAt
  };
}

function createUnlockNotificationPayload(
  event: PendingUnlockEvent,
  animals: Animal[],
  milestones: RescueMilestone[]
): UnlockNotificationPayload | undefined {
  const animal = animals.find((item) => item.id === event.animalId);
  if (!animal) {
    return undefined;
  }

  if (event.type === "rescue") {
    return {
      animalId: event.animalId,
      body: `${event.stepTarget.toLocaleString()} steps complete. Tap to view the rescue card.`,
      eventId: event.id,
      eventType: "rescue",
      title: `${animal.name} rescue unlocked`
    };
  }

  const milestone = milestones.find((item) => item.animalId === event.animalId);
  const target = milestone?.rewardTargets.find(
    (item) => item.rewardId === event.rewardId
  );

  if (!target) {
    return undefined;
  }

  return {
    animalId: event.animalId,
    body: `${animal.name} reached ${event.stepTarget.toLocaleString()} steps. Tap to view the unlock card.`,
    eventId: event.id,
    eventType: "reward",
    title: `${target.title} unlocked`
  };
}

async function triggerHaptic(kind: "care" | "rescue") {
  if (Platform.OS === "web") {
    return;
  }

  try {
    if (kind === "rescue") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are optional and should never block progress.
  }
}

export function RescueProvider({ children }: PropsWithChildren) {
  const animals = generatedAnimals;
  const milestones = useMemo(() => generateMilestones(animals), [animals]);
  const steps = useStepCounter();
  const { isPro } = useEntitlements();
  const [rescueProgress, setRescueProgress] = useState<RescueProgress>(() =>
    createDefaultProgress(animals)
  );
  const rescueProgressRef = useRef(rescueProgress);
  const liveSessionBaselineRef = useRef(0);
  const liveSessionOffsetRef = useRef(0);
  const knownPendingUnlockEventIdsRef = useRef<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Dev-only: mock step override (undefined = use real steps)
  const [devMockSteps, setDevMockSteps] = useState<number | undefined>();

  useEffect(() => {
    rescueProgressRef.current = rescueProgress;
  }, [rescueProgress]);

  const persistProgress = useCallback(async (
    nextOrUpdater: RescueProgress | ((current: RescueProgress) => RescueProgress)
  ) => {
    const next =
      typeof nextOrUpdater === "function"
        ? nextOrUpdater(rescueProgressRef.current)
        : nextOrUpdater;

    rescueProgressRef.current = next;
    setRescueProgress(next);
    await saveRescueProgress(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Add timeout to prevent hanging in production builds
    const timeoutId = setTimeout(() => {
      if (mounted) {
        const merged = mergeProgress(null, animals);
        setRescueProgress(merged);
        setIsLoading(false);
      }
    }, 3000);

    getRescueProgress()
      .then((saved) => {
        if (!mounted) {
          return;
        }

        clearTimeout(timeoutId);

        const merged = mergeProgress(saved, animals);
        const today = getLocalDateKey();
        const normalized =
          merged.lastKnownDate === today
            ? merged
            : {
                ...merged,
                lastKnownDate: today,
                stepBaselineToday: 0,
                activeJourneyStepsToday: 0
              };

        liveSessionBaselineRef.current = 0;
        liveSessionOffsetRef.current = normalized.activeJourneyStepsToday;
        setRescueProgress(normalized);
        if (saved !== normalized) {
          saveRescueProgress(normalized).catch(() => {
            // Persistence failure should not block UI
          });
        }
      })
      .catch(() => {
        if (mounted) {
          clearTimeout(timeoutId);
          const merged = mergeProgress(null, animals);
          setRescueProgress(merged);
        }
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [animals]);

  const currentAnimal = useMemo(
    () => getCurrentAnimal(animals, rescueProgress),
    [animals, rescueProgress]
  );
  const currentAnimalIndex = currentAnimal
    ? animals.findIndex((animal) => animal.id === currentAnimal.id)
    : -1;
  const currentMilestone =
    currentAnimalIndex >= 0 ? milestones[currentAnimalIndex] : undefined;

  const todayKey = getLocalDateKey();
  const progressIsForToday = rescueProgress.lastKnownDate === todayKey;
  const rawActiveStepsToday = Math.max(
    0,
    steps.stepsToday - rescueProgress.stepBaselineToday
  );
  const liveSessionActiveStepsToday =
    progressIsForToday
      ? liveSessionOffsetRef.current +
        Math.max(0, steps.stepsToday - liveSessionBaselineRef.current)
      : 0;
  const restoredActiveStepsToday = progressIsForToday
    ? rescueProgress.activeJourneyStepsToday
    : 0;

  // Effective steps: dev mock overrides real pedometer
  const effectiveStepsToday =
    devMockSteps !== undefined
      ? devMockSteps
      : steps.countingMode === "live-session"
        ? Math.max(liveSessionActiveStepsToday, restoredActiveStepsToday)
        : Math.max(rawActiveStepsToday, restoredActiveStepsToday);

  const lockedAnimals = useMemo(
    () => getLockedAnimals(animals, rescueProgress),
    [animals, rescueProgress]
  );
  const unlockedAnimals = useMemo(
    () => getUnlockedAnimals(animals, rescueProgress),
    [animals, rescueProgress]
  );

  const focusedUnlockEvent = rescueProgress.focusedUnlockEventId
    ? rescueProgress.pendingUnlockEvents.find(
        (event) =>
          event.id === rescueProgress.focusedUnlockEventId &&
          isValidPendingUnlockEvent(event, animals, milestones)
      )
    : undefined;
  const activeUnlockEvent =
    focusedUnlockEvent ??
    rescueProgress.pendingUnlockEvents.find((event) =>
      isValidPendingUnlockEvent(event, animals, milestones)
    );
  const lastCareEvent = useMemo<CareEvent | undefined>(() => {
    if (!activeUnlockEvent || activeUnlockEvent.type !== "reward") {
      return undefined;
    }

    const animal = animals.find((item) => item.id === activeUnlockEvent.animalId);
    const milestone = milestones.find(
      (item) => item.animalId === activeUnlockEvent.animalId
    );
    const target = milestone?.rewardTargets.find(
      (item) => item.rewardId === activeUnlockEvent.rewardId
    );

    if (!animal || !target) {
      return undefined;
    }

    return {
      id: activeUnlockEvent.id,
      animalId: animal.id,
      animalName: animal.name,
      stepTarget: activeUnlockEvent.stepTarget,
      label: target.label,
      title: target.title,
      rewardId: target.rewardId,
      rewardIndex: target.rewardIndex,
      image: target.image
    };
  }, [activeUnlockEvent, animals, milestones]);
  const lastRescueEvent = useMemo<RescueEvent | undefined>(() => {
    if (!activeUnlockEvent || activeUnlockEvent.type !== "rescue") {
      return undefined;
    }

    const animal = animals.find((item) => item.id === activeUnlockEvent.animalId);
    if (!animal) {
      return undefined;
    }

    return {
      id: activeUnlockEvent.id,
      animalId: animal.id,
      animalName: animal.name,
      stepTarget: activeUnlockEvent.stepTarget
    };
  }, [activeUnlockEvent, animals]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const validEvents = rescueProgress.pendingUnlockEvents.filter((event) =>
      isValidPendingUnlockEvent(event, animals, milestones)
    );
    const currentIds = new Set(validEvents.map((event) => event.id));

    if (!knownPendingUnlockEventIdsRef.current) {
      knownPendingUnlockEventIdsRef.current = currentIds;
      return;
    }

    const knownIds = knownPendingUnlockEventIdsRef.current;
    const newlyAddedEvents = validEvents.filter((event) => !knownIds.has(event.id));
    knownPendingUnlockEventIdsRef.current = currentIds;

    newlyAddedEvents.forEach((event) => {
      const payload = createUnlockNotificationPayload(event, animals, milestones);
      if (payload) {
        void presentUnlockNotification(payload).catch(() => {});
      }
    });
  }, [animals, isLoading, milestones, rescueProgress.pendingUnlockEvents]);

  const canAccessAnimal = useCallback(
    (animalId: string) => {
      const index = animals.findIndex((animal) => animal.id === animalId);
      return index >= 0 && canAccessAnimalIndex(index, isPro);
    },
    [animals, isPro]
  );

  const getAnimalStatus = useCallback(
    (animalId: string) => {
      const index = animals.findIndex((animal) => animal.id === animalId);
      if (index < 0) {
        return "locked";
      }

      return getAnimalCardStatus({
        index,
        animalId,
        currentAnimalId: rescueProgress.currentAnimalId,
        rescuedAnimalIds: rescueProgress.rescuedAnimalIds,
        isPro
      });
    },
    [animals, isPro, rescueProgress.currentAnimalId, rescueProgress.rescuedAnimalIds]
  );

  const getMilestone = useCallback(
    (animalId: string) =>
      milestones.find((milestone) => milestone.animalId === animalId),
    [milestones]
  );

  const getAnimalMetrics = useCallback(
    (animalId: string): AnimalMetrics | undefined => {
      const index = animals.findIndex((animal) => animal.id === animalId);
      const animal = animals[index];
      const milestone = milestones[index];

      if (!animal || !milestone) {
        return undefined;
      }

      const isRescued = rescueProgress.rescuedAnimalIds.includes(animalId);
      const metricSteps = isRescued ? milestone.unlockSteps : effectiveStepsToday;
      const progress = getProgressToMilestone(
        metricSteps,
        milestone,
        index
      );
      const claimedMiniMilestones =
        rescueProgress.claimedMiniMilestones[animalId] ?? [];
      const completedMiniMilestones = getCompletedMiniMilestones(
        metricSteps,
        milestone
      );
      const completedRewardTargets = getCompletedRewardTargets(
        metricSteps,
        milestone
      );
      const claimedRewardTargets = milestone.rewardTargets.filter((target) =>
        claimedMiniMilestones.includes(target.stepTarget)
      );
      const nextRewardTarget = isRescued
        ? undefined
        : getNextRewardTarget(
            metricSteps,
            milestone
          );
      const mood = getAnimalMood(progress, isRescued);

      return {
        animal,
        milestone,
        index,
        previousSteps: getPreviousMilestoneSteps(index),
        progress,
        remainingSteps: Math.max(0, milestone.unlockSteps - metricSteps),
        completedMiniMilestones,
        claimedMiniMilestones,
        completedRewardTargets,
        claimedRewardTargets,
        nextMiniMilestone: getNextMiniMilestone(effectiveStepsToday, milestone),
        nextRewardTarget,
        careState: getCareState(mood),
        mood,
        moodMeta: getMoodMeta(mood),
        isRescued,
        canAccess: canAccessAnimal(animalId),
        status: getAnimalStatus(animalId)
      };
    },
    [
      animals,
      canAccessAnimal,
      getAnimalStatus,
      milestones,
      rescueProgress.claimedMiniMilestones,
      rescueProgress.rescuedAnimalIds,
      effectiveStepsToday
    ]
  );

  const claimMiniMilestone = useCallback(
    async (animalId: string, stepTarget: number) => {
      const animal = animals.find((item) => item.id === animalId);
      const milestone = getMilestone(animalId);

      if (!animal || !milestone || !canAccessAnimal(animalId)) {
        return;
      }

      const target = milestone.rewardTargets.find(
        (item) => item.stepTarget === stepTarget
      );

      if (!target) {
        return;
      }

      const claimed = rescueProgress.claimedMiniMilestones[animalId] ?? [];
      if (claimed.includes(stepTarget)) {
        return;
      }

      const next = {
        ...rescueProgress,
        claimedMiniMilestones: {
          ...rescueProgress.claimedMiniMilestones,
          [animalId]: [...claimed, stepTarget].sort((a, b) => a - b)
        },
        pendingUnlockEvents: appendPendingUnlockEvents(
          rescueProgress.pendingUnlockEvents,
          [createRewardUnlockEvent(animalId, target, new Date().toISOString())]
        )
      };

      await persistProgress(next);
      triggerHaptic("care");
    },
    [
      animals,
      canAccessAnimal,
      getMilestone,
      persistProgress,
      rescueProgress
    ]
  );

  const rescueAnimal = useCallback(
    async (animalId: string, unlockedAtSteps = effectiveStepsToday) => {
      const animal = animals.find((item) => item.id === animalId);
      const milestone = getMilestone(animalId);

      if (!animal || !milestone || !canAccessAnimal(animalId)) {
        return;
      }

      if (unlockedAtSteps < milestone.unlockSteps) {
        return;
      }

      if (rescueProgress.rescuedAnimalIds.includes(animalId)) {
        return;
      }

      const rescuedAnimalIds = [...rescueProgress.rescuedAnimalIds, animalId];
      liveSessionBaselineRef.current = steps.stepsToday;
      liveSessionOffsetRef.current = 0;
      const next = {
        ...rescueProgress,
        rescuedAnimalIds,
        stepBaselineToday:
          devMockSteps !== undefined ? rescueProgress.stepBaselineToday : steps.stepsToday,
        activeJourneyStepsToday: 0,
        rescuedDates: {
          ...rescueProgress.rescuedDates,
          [animalId]: getLocalDateKey()
        },
        currentAnimalId: nextUnrescuedAnimalId(animals, rescuedAnimalIds),
        pendingUnlockEvents: appendPendingUnlockEvents(
          rescueProgress.pendingUnlockEvents,
          [
            createRescueUnlockEvent(
              animalId,
              milestone.unlockSteps,
              new Date().toISOString()
            )
          ]
        )
      };

      await persistProgress(next);
      if (devMockSteps !== undefined) {
        setDevMockSteps(0);
      }
      triggerHaptic("rescue");
    },
    [
      animals,
      canAccessAnimal,
      getMilestone,
      persistProgress,
      rescueProgress,
      devMockSteps,
      steps.stepsToday,
      effectiveStepsToday
    ]
  );

  useEffect(() => {
    if (isLoading || !currentAnimal || !currentMilestone) {
      return;
    }

    if (!canAccessAnimal(currentAnimal.id)) {
      return;
    }

    if (rescueProgress.rescuedAnimalIds.includes(currentAnimal.id)) {
      return;
    }

    const claimed = rescueProgress.claimedMiniMilestones[currentAnimal.id] ?? [];
    const newlyCompletedTargets = currentMilestone.rewardTargets.filter(
      (target) =>
        effectiveStepsToday >= target.stepTarget &&
        !claimed.includes(target.stepTarget)
    );
    const shouldRescue = effectiveStepsToday >= currentMilestone.unlockSteps;

    if (newlyCompletedTargets.length === 0 && !shouldRescue) {
      return;
    }

    const createdAt = new Date().toISOString();
    const pendingEvents = newlyCompletedTargets.map((target) =>
      createRewardUnlockEvent(currentAnimal.id, target, createdAt)
    );
    const rescuedAnimalIds = shouldRescue
      ? [...rescueProgress.rescuedAnimalIds, currentAnimal.id]
      : rescueProgress.rescuedAnimalIds;

    if (shouldRescue) {
      pendingEvents.unshift(
        createRescueUnlockEvent(
          currentAnimal.id,
          currentMilestone.unlockSteps,
          createdAt
        )
      );
    }

    if (shouldRescue) {
      liveSessionBaselineRef.current = steps.stepsToday;
      liveSessionOffsetRef.current = 0;
    }

    persistProgress((current) => ({
      ...current,
      stepBaselineToday:
        shouldRescue && devMockSteps === undefined
          ? steps.stepsToday
          : current.stepBaselineToday,
      activeJourneyStepsToday: shouldRescue
        ? 0
        : Math.max(current.activeJourneyStepsToday ?? 0, effectiveStepsToday),
      claimedMiniMilestones: {
        ...current.claimedMiniMilestones,
        [currentAnimal.id]: [
          ...(current.claimedMiniMilestones[currentAnimal.id] ?? []),
          ...newlyCompletedTargets.map((target) => target.stepTarget)
        ].sort((a, b) => a - b)
      },
      rescuedAnimalIds,
      rescuedDates: shouldRescue
        ? {
            ...current.rescuedDates,
            [currentAnimal.id]: getLocalDateKey()
          }
        : current.rescuedDates,
      currentAnimalId: shouldRescue
        ? nextUnrescuedAnimalId(animals, rescuedAnimalIds)
        : current.currentAnimalId,
      pendingUnlockEvents: appendPendingUnlockEvents(
        current.pendingUnlockEvents,
        pendingEvents
      )
    }));
    if (shouldRescue && devMockSteps !== undefined) {
      setDevMockSteps(0);
    }
    triggerHaptic(shouldRescue ? "rescue" : "care");
  }, [
    animals,
    canAccessAnimal,
    currentAnimal,
    currentMilestone,
    isLoading,
    rescueProgress.claimedMiniMilestones,
    rescueProgress.currentAnimalId,
    rescueProgress.pendingUnlockEvents,
    rescueProgress.rescuedDates,
    rescueProgress.rescuedAnimalIds,
    persistProgress,
    devMockSteps,
    steps.stepsToday,
    effectiveStepsToday
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const today = getLocalDateKey();
    const recordedToday = rescueProgress.dailyStepHistory[today] ?? 0;
    const recordedActiveSteps = rescueProgress.activeJourneyStepsToday ?? 0;
    const shouldUpdate =
      rescueProgress.lastKnownDate !== today ||
      effectiveStepsToday - recordedToday >= DAILY_STEP_HISTORY_WRITE_DELTA ||
      effectiveStepsToday - recordedActiveSteps >= DAILY_STEP_HISTORY_WRITE_DELTA ||
      (recordedActiveSteps === 0 && effectiveStepsToday > 0) ||
      (recordedToday === 0 && effectiveStepsToday > 0);

    if (!shouldUpdate) {
      return;
    }

    persistProgress((current) => {
      const isSameRecordedDay = current.lastKnownDate === today;
      if (!isSameRecordedDay) {
        liveSessionBaselineRef.current = steps.stepsToday;
        liveSessionOffsetRef.current = 0;
      }

      const nextStepBaseline = isSameRecordedDay ? current.stepBaselineToday : 0;
      const nextEffectiveSteps = isSameRecordedDay
        ? effectiveStepsToday
        : steps.stepsToday;

      return {
        ...current,
        lastKnownDate: today,
        stepBaselineToday: nextStepBaseline,
        activeJourneyStepsToday: isSameRecordedDay
          ? Math.max(current.activeJourneyStepsToday ?? 0, effectiveStepsToday)
          : 0,
        dailyStepHistory: {
          ...current.dailyStepHistory,
          [today]: Math.max(recordedToday, nextEffectiveSteps)
        }
      };
    });
  }, [
    effectiveStepsToday,
    isLoading,
    persistProgress,
    rescueProgress.dailyStepHistory,
    rescueProgress.lastKnownDate,
    rescueProgress.activeJourneyStepsToday,
    steps.stepsToday
  ]);

  const resetProgress = useCallback(async () => {
    const next = createDefaultProgress(animals);
    liveSessionBaselineRef.current = 0;
    liveSessionOffsetRef.current = 0;
    await clearRescueProgress();
    await persistProgress(next);
    setDevMockSteps(undefined);
  }, [animals, persistProgress]);

  const unlockFirstAnimal = useCallback(async () => {
    const firstAnimal = animals[0];
    if (!firstAnimal) {
      return;
    }

    const rescuedAnimalIds = rescueProgress.rescuedAnimalIds.includes(
      firstAnimal.id
    )
      ? rescueProgress.rescuedAnimalIds
      : [...rescueProgress.rescuedAnimalIds, firstAnimal.id];

    liveSessionBaselineRef.current = steps.stepsToday;
    liveSessionOffsetRef.current = 0;
    await persistProgress({
      ...rescueProgress,
      rescuedAnimalIds,
      stepBaselineToday: steps.stepsToday,
      activeJourneyStepsToday: 0,
      rescuedDates: {
        ...rescueProgress.rescuedDates,
        [firstAnimal.id]: getLocalDateKey()
      },
      currentAnimalId: nextUnrescuedAnimalId(animals, rescuedAnimalIds),
      pendingUnlockEvents: appendPendingUnlockEvents(
        rescueProgress.pendingUnlockEvents,
        [
          createRescueUnlockEvent(
            firstAnimal.id,
            milestones[0]?.unlockSteps ?? 0,
            new Date().toISOString()
          )
        ]
      )
    });
    setDevMockSteps(0);
  }, [animals, milestones, persistProgress, rescueProgress, steps.stepsToday]);

  // DEV: advance mock steps to the next unclaimed target for the current animal
  const advanceMockSteps = useCallback(() => {
    if (!currentAnimal || !currentMilestone) return;
    const claimed = rescueProgress.claimedMiniMilestones[currentAnimal.id] ?? [];
    const current = devMockSteps !== undefined
      ? devMockSteps
      : Math.max(0, steps.stepsToday - rescueProgress.stepBaselineToday);
    // find the next target that hasn't been hit yet
    const allTargets = [...currentMilestone.miniMilestones, currentMilestone.unlockSteps];
    const nextTarget = allTargets.find((t) => current < t);
    if (nextTarget !== undefined) {
      setDevMockSteps(nextTarget);
    }
  }, [
    currentAnimal,
    currentMilestone,
    devMockSteps,
    rescueProgress.claimedMiniMilestones,
    rescueProgress.stepBaselineToday,
    steps.stepsToday
  ]);

  const resetMockSteps = useCallback(() => {
    setDevMockSteps(undefined);
  }, []);

  const focusUnlockEvent = useCallback(
    (eventId: string) => {
      const event = rescueProgressRef.current.pendingUnlockEvents.find(
        (item) => item.id === eventId
      );

      if (!event || !isValidPendingUnlockEvent(event, animals, milestones)) {
        return;
      }

      void persistProgress((current) => ({
        ...current,
        focusedUnlockEventId: eventId
      }));
    },
    [animals, milestones, persistProgress]
  );

  const dismissUnlockEvent = useCallback(async () => {
    if (!activeUnlockEvent) {
      return;
    }

    const dismissedEventId = activeUnlockEvent.id;
    await dismissUnlockNotification(dismissedEventId).catch(() => {});
    await persistProgress((current) => {
      const pendingUnlockEvents = current.pendingUnlockEvents.filter(
        (event) => event.id !== dismissedEventId
      );

      return {
        ...current,
        focusedUnlockEventId:
          current.focusedUnlockEventId === dismissedEventId
            ? undefined
            : current.focusedUnlockEventId,
        pendingUnlockEvents
      };
    });
  }, [activeUnlockEvent, persistProgress]);

  const weeklySteps = useMemo(() => {
    const keys = getCurrentWeekDateKeys();
    return keys.reduce(
      (total, key) => total + (rescueProgress.dailyStepHistory[key] ?? 0),
      0
    );
  }, [rescueProgress.dailyStepHistory]);

  const value = useMemo<RescueContextValue>(
    () => ({
      animals,
      milestones,
      rescueProgress,
      isLoading,
      currentAnimal,
      currentMilestone,
      currentAnimalIndex,
      lockedAnimals,
      unlockedAnimals,
      steps,
      stepsToday: effectiveStepsToday,
      weeklySteps,
      lastRescueEvent,
      lastCareEvent,
      devMockSteps,
      canAccessAnimal,
      getAnimalStatus,
      getMilestone,
      getAnimalMetrics,
      claimMiniMilestone,
      rescueAnimal,
      resetProgress,
      unlockFirstAnimal,
      advanceMockSteps,
      resetMockSteps,
      focusUnlockEvent,
      dismissRescueEvent: dismissUnlockEvent,
      dismissCareEvent: dismissUnlockEvent
    }),
    [
      animals,
      advanceMockSteps,
      resetMockSteps,
      canAccessAnimal,
      claimMiniMilestone,
      currentAnimal,
      currentAnimalIndex,
      currentMilestone,
      devMockSteps,
      dismissUnlockEvent,
      focusUnlockEvent,
      getAnimalMetrics,
      getAnimalStatus,
      getMilestone,
      isLoading,
      lastCareEvent,
      lastRescueEvent,
      lockedAnimals,
      milestones,
      rescueAnimal,
      rescueProgress,
      resetProgress,
      steps,
      unlockFirstAnimal,
      unlockedAnimals,
      weeklySteps,
      effectiveStepsToday
    ]
  );

  return (
    <RescueContext.Provider value={value}>{children}</RescueContext.Provider>
  );
}

export function useRescue() {
  const context = useContext(RescueContext);

  if (!context) {
    throw new Error("useRescue must be used inside RescueProvider");
  }

  return context;
}
