import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { Platform } from "react-native";

import { generatedAnimals } from "../data/animals.generated";
import {
  generateMilestones,
  getAnimalMood,
  getCareState,
  getCompletedMiniMilestones,
  getMoodMeta,
  getNextMiniMilestone,
  getPreviousMilestoneSteps,
  getProgressToMilestone
} from "../data/milestones";
import type {
  Animal,
  AnimalCardStatus,
  AnimalCareState,
  AnimalMood,
  RescueMilestone,
  RescueProgress
} from "../data/types";
import { getAnimalCardStatus, canAccessAnimalIndex } from "../features/animals/animalAccess";
import {
  getCurrentAnimal,
  getLockedAnimals,
  getUnlockedAnimals
} from "../features/animals/animalSelectors";
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
  nextMiniMilestone?: number;
  careState: AnimalCareState;
  mood: AnimalMood;
  moodMeta: ReturnType<typeof getMoodMeta>;
  isRescued: boolean;
  canAccess: boolean;
  status: AnimalCardStatus;
};

type RescueEvent = {
  animalId: string;
  animalName: string;
};

type CareEvent = {
  animalId: string;
  animalName: string;
  stepTarget: number;
  label: string;
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
  dismissRescueEvent: () => void;
  dismissCareEvent: () => void;
};

const RescueContext = createContext<RescueContextValue | undefined>(undefined);

function createDefaultProgress(animals: Animal[]): RescueProgress {
  return {
    onboarded: false,
    rescuedAnimalIds: [],
    currentAnimalId: animals[0]?.id ?? "",
    claimedMiniMilestones: {},
    rescuedDates: {},
    lastKnownDate: getLocalDateKey(),
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
  const currentAnimalId =
    animals.find((animal) => animal.id === saved.currentAnimalId)?.id ??
    animals.find((animal) => !rescuedAnimalIds.includes(animal.id))?.id ??
    "";

  return {
    ...fallback,
    ...saved,
    rescuedAnimalIds,
    currentAnimalId,
    claimedMiniMilestones: saved.claimedMiniMilestones ?? {},
    rescuedDates: saved.rescuedDates ?? {},
    lastKnownDate: saved.lastKnownDate ?? getLocalDateKey(),
    dailyStepHistory: saved.dailyStepHistory ?? {}
  };
}

function nextUnrescuedAnimalId(animals: Animal[], rescuedAnimalIds: string[]) {
  return animals.find((animal) => !rescuedAnimalIds.includes(animal.id))?.id ?? "";
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastRescueEvent, setLastRescueEvent] = useState<RescueEvent>();
  const [lastCareEvent, setLastCareEvent] = useState<CareEvent>();
  // Dev-only: mock step override (undefined = use real steps)
  const [devMockSteps, setDevMockSteps] = useState<number | undefined>();

  const persistProgress = useCallback(async (next: RescueProgress) => {
    setRescueProgress(next);
    await saveRescueProgress(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    getRescueProgress()
      .then((saved) => {
        if (!mounted) {
          return;
        }

        const merged = mergeProgress(saved, animals);
        const today = getLocalDateKey();
        const normalized =
          merged.lastKnownDate === today
            ? merged
            : {
                ...merged,
                lastKnownDate: today
              };

        setRescueProgress(normalized);
        if (saved !== normalized) {
          saveRescueProgress(normalized);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
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

  // Effective steps: dev mock overrides real pedometer
  const effectiveStepsToday = devMockSteps !== undefined ? devMockSteps : steps.stepsToday;

  const lockedAnimals = useMemo(
    () => getLockedAnimals(animals, rescueProgress),
    [animals, rescueProgress]
  );
  const unlockedAnimals = useMemo(
    () => getUnlockedAnimals(animals, rescueProgress),
    [animals, rescueProgress]
  );

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
      const progress = getProgressToMilestone(
        effectiveStepsToday,
        milestone,
        index
      );
      const claimedMiniMilestones =
        rescueProgress.claimedMiniMilestones[animalId] ?? [];
      const completedMiniMilestones = getCompletedMiniMilestones(
        effectiveStepsToday,
        milestone
      );
      const mood = getAnimalMood(progress, isRescued);

      return {
        animal,
        milestone,
        index,
        previousSteps: getPreviousMilestoneSteps(index),
        progress,
        remainingSteps: Math.max(0, milestone.unlockSteps - effectiveStepsToday),
        completedMiniMilestones,
        claimedMiniMilestones,
        nextMiniMilestone: getNextMiniMilestone(effectiveStepsToday, milestone),
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

      if (!milestone.miniMilestones.includes(stepTarget)) {
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
        }
      };

      await persistProgress(next);
      const labelIndex = milestone.miniMilestones.indexOf(stepTarget);
      setLastCareEvent({
        animalId,
        animalName: animal.name,
        stepTarget,
        label: ["fresh water", "a good meal", "gentle care"][labelIndex] ?? "care"
      });
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
      const next = {
        ...rescueProgress,
        rescuedAnimalIds,
        rescuedDates: {
          ...rescueProgress.rescuedDates,
          [animalId]: getLocalDateKey()
        },
        currentAnimalId: nextUnrescuedAnimalId(animals, rescuedAnimalIds)
      };

      await persistProgress(next);
      setLastRescueEvent({ animalId, animalName: animal.name });
      triggerHaptic("rescue");
    },
    [
      animals,
      canAccessAnimal,
      getMilestone,
      persistProgress,
      rescueProgress,
      steps.stepsToday
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

    const claimed =
      rescueProgress.claimedMiniMilestones[currentAnimal.id] ?? [];
    const newlyCompleted = currentMilestone.miniMilestones.filter(
      (stepTarget) =>
        effectiveStepsToday >= stepTarget && !claimed.includes(stepTarget)
    );

    if (newlyCompleted.length > 0) {
      claimMiniMilestone(currentAnimal.id, newlyCompleted[0]);
      return;
    }

    if (effectiveStepsToday >= currentMilestone.unlockSteps) {
      rescueAnimal(currentAnimal.id, effectiveStepsToday);
    }
  }, [
    canAccessAnimal,
    claimMiniMilestone,
    currentAnimal,
    currentMilestone,
    isLoading,
    rescueAnimal,
    rescueProgress.claimedMiniMilestones,
    rescueProgress.rescuedAnimalIds,
    effectiveStepsToday
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const today = getLocalDateKey();
    const recordedToday = rescueProgress.dailyStepHistory[today] ?? 0;
    const shouldUpdate =
      rescueProgress.lastKnownDate !== today ||
      effectiveStepsToday - recordedToday >= 25 ||
      (recordedToday === 0 && effectiveStepsToday > 0);

    if (!shouldUpdate) {
      return;
    }

    persistProgress({
      ...rescueProgress,
      lastKnownDate: today,
      dailyStepHistory: {
        ...rescueProgress.dailyStepHistory,
        [today]: Math.max(recordedToday, effectiveStepsToday)
      }
    });
  }, [isLoading, persistProgress, rescueProgress, effectiveStepsToday]);

  const resetProgress = useCallback(async () => {
    const next = createDefaultProgress(animals);
    await clearRescueProgress();
    await persistProgress(next);
    setLastCareEvent(undefined);
    setLastRescueEvent(undefined);
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

    await persistProgress({
      ...rescueProgress,
      rescuedAnimalIds,
      rescuedDates: {
        ...rescueProgress.rescuedDates,
        [firstAnimal.id]: getLocalDateKey()
      },
      currentAnimalId: nextUnrescuedAnimalId(animals, rescuedAnimalIds)
    });
  }, [animals, persistProgress, rescueProgress]);

  // DEV: advance mock steps to the next unclaimed target for the current animal
  const advanceMockSteps = useCallback(() => {
    if (!currentAnimal || !currentMilestone) return;
    const claimed = rescueProgress.claimedMiniMilestones[currentAnimal.id] ?? [];
    const current = devMockSteps !== undefined ? devMockSteps : steps.stepsToday;
    // find the next target that hasn't been hit yet
    const allTargets = [...currentMilestone.miniMilestones, currentMilestone.unlockSteps];
    const nextTarget = allTargets.find((t) => current < t);
    if (nextTarget !== undefined) {
      setDevMockSteps(nextTarget);
    }
  }, [currentAnimal, currentMilestone, devMockSteps, rescueProgress.claimedMiniMilestones, steps.stepsToday]);

  const resetMockSteps = useCallback(() => {
    setDevMockSteps(undefined);
  }, []);

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
      dismissRescueEvent: () => setLastRescueEvent(undefined),
      dismissCareEvent: () => setLastCareEvent(undefined)
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
