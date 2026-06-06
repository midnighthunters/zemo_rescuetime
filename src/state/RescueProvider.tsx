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
import { AppState, Platform } from "react-native";

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
  getNativeTargetAchievementEvents,
  getNativeTargetAchievementStepSnapshot,
  markNativeTargetAchievementEventsConsumed,
  syncTargetAchievementWatcher,
  type NativeStepSnapshot
} from "../features/notifications/targetAchievementWatcher";
import {
  useStepCounter,
  type StepCounterState
} from "../features/steps/useStepCounter";
import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslateFn } from "../i18n/translations";
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
  activeStepsToday: number;
  weeklySteps: number;
  lastRescueEvent?: RescueEvent;
  lastCareEvent?: CareEvent;
  canAccessAnimal: (animalId: string) => boolean;
  getAnimalStatus: (animalId: string) => AnimalCardStatus;
  getMilestone: (animalId: string) => RescueMilestone | undefined;
  getAnimalMetrics: (animalId: string) => AnimalMetrics | undefined;
  claimMiniMilestone: (animalId: string, stepTarget: number) => Promise<void>;
  rescueAnimal: (animalId: string, unlockedAtSteps?: number) => Promise<void>;
  resetProgress: () => Promise<void>;
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
  milestones: RescueMilestone[],
  t: TranslateFn,
  formatNumber: (value: number) => string
): UnlockNotificationPayload | undefined {
  const animal = animals.find((item) => item.id === event.animalId);
  if (!animal) {
    return undefined;
  }

  if (event.type === "rescue") {
    return {
      animalId: event.animalId,
      body: t("notifications.rescueBody", {
        steps: formatNumber(event.stepTarget)
      }),
      eventId: event.id,
      eventType: "rescue",
      title: t("notifications.rescueTitle", { animal: animal.name })
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
    body: t("notifications.rewardBody", {
      animal: animal.name,
      steps: formatNumber(event.stepTarget)
    }),
    eventId: event.id,
    eventType: "reward",
    title: t("notifications.rewardTitle", { reward: target.title })
  };
}

function mergeNativeUnlockEvents(
  progress: RescueProgress,
  events: PendingUnlockEvent[],
  animals: Animal[],
  milestones: RescueMilestone[]
) {
  const validEvents = events.filter((event) =>
    isValidPendingUnlockEvent(event, animals, milestones)
  );

  if (validEvents.length === 0) {
    return progress;
  }

  return validEvents.reduce((current, event) => {
    const claimed = current.claimedMiniMilestones[event.animalId] ?? [];
    const nextClaimed =
      event.type === "reward" && !claimed.includes(event.stepTarget)
        ? {
            ...current.claimedMiniMilestones,
            [event.animalId]: [...claimed, event.stepTarget].sort((a, b) => a - b)
          }
        : current.claimedMiniMilestones;

    const rescuedAnimalIds =
      event.type === "rescue" &&
      !current.rescuedAnimalIds.includes(event.animalId)
        ? [...current.rescuedAnimalIds, event.animalId]
        : current.rescuedAnimalIds;

    return {
      ...current,
      activeJourneyStepsToday:
        event.type === "rescue" ? 0 : current.activeJourneyStepsToday,
      claimedMiniMilestones: nextClaimed,
      currentAnimalId:
        event.type === "rescue"
          ? nextUnrescuedAnimalId(animals, rescuedAnimalIds)
          : current.currentAnimalId,
      pendingUnlockEvents: appendPendingUnlockEvents(
        current.pendingUnlockEvents,
        [event]
      ),
      rescuedAnimalIds,
      rescuedDates:
        event.type === "rescue"
          ? {
              ...current.rescuedDates,
              [event.animalId]: current.rescuedDates[event.animalId] ?? getLocalDateKey()
            }
          : current.rescuedDates
    };
  }, progress);
}

function mergeNativeStepSnapshot(
  progress: RescueProgress,
  snapshot?: NativeStepSnapshot
) {
  const today = getLocalDateKey();
  if (!snapshot || snapshot.dateKey !== today) {
    return progress;
  }

  const nativeStepsToday = Math.max(0, snapshot.stepsToday);
  const nativeActiveSteps = Math.max(0, snapshot.activeStepsToday);
  const recordedStepsToday = progress.dailyStepHistory[today] ?? 0;
  const canApplyActiveSteps =
    snapshot.currentAnimalId === progress.currentAnimalId &&
    !progress.rescuedAnimalIds.includes(snapshot.currentAnimalId);
  const nextActiveSteps = canApplyActiveSteps
    ? Math.max(progress.activeJourneyStepsToday ?? 0, nativeActiveSteps)
    : progress.activeJourneyStepsToday;
  const nextStepsToday = Math.max(recordedStepsToday, nativeStepsToday);

  if (
    progress.lastKnownDate === today &&
    nextActiveSteps === progress.activeJourneyStepsToday &&
    nextStepsToday === recordedStepsToday
  ) {
    return progress;
  }

  return {
    ...progress,
    activeJourneyStepsToday: nextActiveSteps,
    dailyStepHistory: {
      ...progress.dailyStepHistory,
      [today]: nextStepsToday
    },
    lastKnownDate: today
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
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();
  const [rescueProgress, setRescueProgress] = useState<RescueProgress>(() =>
    createDefaultProgress(animals)
  );
  const rescueProgressRef = useRef(rescueProgress);
  const liveSessionBaselineRef = useRef(0);
  const liveSessionOffsetRef = useRef(0);
  const liveDailyBaselineRef = useRef(0);
  const liveDailyOffsetRef = useRef(0);
  const knownPendingUnlockEventIdsRef = useRef<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      .then(async (saved) => {
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

        const [nativeEvents, nativeStepSnapshot] = await Promise.all([
          getNativeTargetAchievementEvents().catch(() => []),
          getNativeTargetAchievementStepSnapshot().catch(() => undefined)
        ]);
        const imported = mergeNativeStepSnapshot(
          mergeNativeUnlockEvents(
            normalized,
            nativeEvents,
            animals,
            milestones
          ),
          nativeStepSnapshot
        );

        liveSessionBaselineRef.current = 0;
        liveSessionOffsetRef.current = imported.activeJourneyStepsToday;
        liveDailyBaselineRef.current = 0;
        liveDailyOffsetRef.current =
          imported.lastKnownDate === today
            ? imported.dailyStepHistory[today] ?? 0
            : 0;
        rescueProgressRef.current = imported;
        setRescueProgress(imported);
        if (saved !== imported || nativeEvents.length > 0 || nativeStepSnapshot) {
          saveRescueProgress(imported).then(() => {
            const eventIds = nativeEvents.map((event) => event.id);
            return markNativeTargetAchievementEventsConsumed(eventIds);
          }).catch(() => {
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
  }, [animals, milestones]);

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
  const rawStepsToday = Math.max(0, steps.stepsToday);
  const rawStepsTodayRef = useRef(rawStepsToday);
  const recordedStepsToday = progressIsForToday
    ? rescueProgress.dailyStepHistory[todayKey] ?? 0
    : 0;
  const liveSessionTotalStepsToday = progressIsForToday
    ? liveDailyOffsetRef.current +
      Math.max(0, rawStepsToday - liveDailyBaselineRef.current)
    : rawStepsToday;
  const measuredStepsToday =
    steps.countingMode === "live-session"
      ? liveSessionTotalStepsToday
      : rawStepsToday;
  const totalStepsToday = Math.max(measuredStepsToday, recordedStepsToday);
  const rawActiveStepsToday = Math.max(
    0,
    rawStepsToday - rescueProgress.stepBaselineToday
  );
  const liveSessionActiveStepsToday =
    progressIsForToday
      ? liveSessionOffsetRef.current +
        Math.max(0, rawStepsToday - liveSessionBaselineRef.current)
      : 0;
  const restoredActiveStepsToday = progressIsForToday
    ? rescueProgress.activeJourneyStepsToday
    : 0;

  const effectiveStepsToday =
    steps.countingMode === "live-session"
      ? Math.max(liveSessionActiveStepsToday, restoredActiveStepsToday)
      : Math.max(rawActiveStepsToday, restoredActiveStepsToday);

  useEffect(() => {
    rawStepsTodayRef.current = rawStepsToday;
  }, [rawStepsToday]);

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
      const payload = createUnlockNotificationPayload(
        event,
        animals,
        milestones,
        t,
        formatLocalizedNumber
      );
      if (payload) {
        void presentUnlockNotification(payload).catch(() => {});
      }
    });
  }, [
    animals,
    formatLocalizedNumber,
    isLoading,
    milestones,
    rescueProgress.pendingUnlockEvents,
    t
  ]);

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

  const importNativeProgress = useCallback(async () => {
    const [nativeEvents, nativeStepSnapshot] = await Promise.all([
      getNativeTargetAchievementEvents().catch(() => []),
      getNativeTargetAchievementStepSnapshot().catch(() => undefined)
    ]);

    if (nativeEvents.length === 0 && !nativeStepSnapshot) {
      return;
    }

    const current = rescueProgressRef.current;
    const withEvents = mergeNativeUnlockEvents(
      current,
      nativeEvents,
      animals,
      milestones
    );
    const next = mergeNativeStepSnapshot(withEvents, nativeStepSnapshot);

    if (nativeEvents.length > 0) {
      knownPendingUnlockEventIdsRef.current = new Set(
        next.pendingUnlockEvents.map((event) => event.id)
      );
    }

    if (nativeStepSnapshot) {
      const today = getLocalDateKey();
      const rawSteps = rawStepsTodayRef.current;
      liveSessionBaselineRef.current = rawSteps;
      liveSessionOffsetRef.current =
        next.lastKnownDate === today ? next.activeJourneyStepsToday : 0;
      liveDailyBaselineRef.current = rawSteps;
      liveDailyOffsetRef.current =
        next.lastKnownDate === today ? next.dailyStepHistory[today] ?? 0 : 0;
    }

    if (next !== current) {
      await persistProgress(next);
    }

    if (nativeEvents.length > 0) {
      await markNativeTargetAchievementEventsConsumed(
        nativeEvents.map((event) => event.id)
      ).catch(() => {});
    }
  }, [animals, milestones, persistProgress]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void importNativeProgress();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void importNativeProgress();
      }
    });

    return () => subscription.remove();
  }, [importNativeProgress, isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const claimedTargetSteps = currentAnimal
      ? rescueProgress.claimedMiniMilestones[currentAnimal.id] ?? []
      : [];
    const canTrack =
      !!currentAnimal &&
      !!currentMilestone &&
      canAccessAnimal(currentAnimal.id) &&
      !rescueProgress.rescuedAnimalIds.includes(currentAnimal.id);

    void syncTargetAchievementWatcher({
      activeStepsToday: Math.max(0, effectiveStepsToday),
      stepsToday: Math.max(0, totalStepsToday),
      claimedTargetSteps,
      currentAnimal:
        canTrack && currentAnimal && currentMilestone
          ? {
              id: currentAnimal.id,
              name: currentAnimal.name,
              rescueNotificationBody: t("notifications.rescueBody", {
                steps: formatLocalizedNumber(currentMilestone.unlockSteps)
              }),
              rescueNotificationTitle: t("notifications.rescueTitle", {
                animal: currentAnimal.name
              }),
              rescued: rescueProgress.rescuedAnimalIds.includes(currentAnimal.id),
              rewardTargets: currentMilestone.rewardTargets.map((target) => ({
                notificationBody: t("notifications.rewardBody", {
                  animal: currentAnimal.name,
                  steps: formatLocalizedNumber(target.stepTarget)
                }),
                notificationTitle: t("notifications.rewardTitle", {
                  reward: target.title
                }),
                rewardId: target.rewardId,
                stepTarget: target.stepTarget,
                title: target.title
              })),
              unlockSteps: currentMilestone.unlockSteps
            }
          : undefined,
      dateKey: getLocalDateKey(),
      enabled: canTrack,
      pendingEventIds: rescueProgress.pendingUnlockEvents.map((event) => event.id)
    }).catch(() => {});
  }, [
    canAccessAnimal,
    currentAnimal,
    currentMilestone,
    effectiveStepsToday,
    formatLocalizedNumber,
    isLoading,
    rescueProgress.claimedMiniMilestones,
    rescueProgress.pendingUnlockEvents,
    rescueProgress.rescuedAnimalIds,
    t,
    totalStepsToday
  ]);

  const getAnimalMetrics = useCallback(
    (animalId: string): AnimalMetrics | undefined => {
      const index = animals.findIndex((animal) => animal.id === animalId);
      const animal = animals[index];
      const milestone = milestones[index];

      if (!animal || !milestone) {
        return undefined;
      }

      const isRescued = rescueProgress.rescuedAnimalIds.includes(animalId);
      const status = getAnimalStatus(animalId);
      const canAccess = canAccessAnimal(animalId);
      const metricSteps = isRescued
        ? milestone.unlockSteps
        : status === "active" && canAccess
          ? effectiveStepsToday
          : 0;
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
        nextMiniMilestone: getNextMiniMilestone(metricSteps, milestone),
        nextRewardTarget,
        careState: getCareState(mood),
        mood,
        moodMeta: getMoodMeta(mood),
        isRescued,
        canAccess,
        status
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
      const today = getLocalDateKey();
      const storedStepsToday = Math.max(
        rescueProgress.dailyStepHistory[today] ?? 0,
        totalStepsToday
      );
      liveSessionBaselineRef.current = rawStepsToday;
      liveSessionOffsetRef.current = 0;
      if (steps.countingMode === "live-session") {
        liveDailyBaselineRef.current = rawStepsToday;
        liveDailyOffsetRef.current = storedStepsToday;
      }
      const next = {
        ...rescueProgress,
        rescuedAnimalIds,
        stepBaselineToday:
          rawStepsToday,
        activeJourneyStepsToday: 0,
        dailyStepHistory: {
          ...rescueProgress.dailyStepHistory,
          [today]: storedStepsToday
        },
        rescuedDates: {
          ...rescueProgress.rescuedDates,
          [animalId]: today
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
      triggerHaptic("rescue");
    },
    [
      animals,
      canAccessAnimal,
      getMilestone,
      persistProgress,
      rescueProgress,
      rawStepsToday,
      steps.countingMode,
      totalStepsToday,
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
    const today = getLocalDateKey();
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
      liveSessionBaselineRef.current = rawStepsToday;
      liveSessionOffsetRef.current = 0;
    }

    persistProgress((current) => {
      const storedStepsToday = Math.max(
        current.dailyStepHistory[today] ?? 0,
        totalStepsToday
      );

      if (shouldRescue && steps.countingMode === "live-session") {
        liveDailyBaselineRef.current = rawStepsToday;
        liveDailyOffsetRef.current = storedStepsToday;
      }

      return {
        ...current,
        stepBaselineToday:
          shouldRescue
            ? rawStepsToday
            : current.stepBaselineToday,
        activeJourneyStepsToday: shouldRescue
          ? 0
          : Math.max(current.activeJourneyStepsToday ?? 0, effectiveStepsToday),
        dailyStepHistory: shouldRescue
          ? {
              ...current.dailyStepHistory,
              [today]: storedStepsToday
            }
          : current.dailyStepHistory,
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
              [currentAnimal.id]: today
            }
          : current.rescuedDates,
        currentAnimalId: shouldRescue
          ? nextUnrescuedAnimalId(animals, rescuedAnimalIds)
          : current.currentAnimalId,
        pendingUnlockEvents: appendPendingUnlockEvents(
          current.pendingUnlockEvents,
          pendingEvents
        )
      };
    });
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
    rawStepsToday,
    steps.countingMode,
    totalStepsToday,
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
      totalStepsToday - recordedToday >= DAILY_STEP_HISTORY_WRITE_DELTA ||
      effectiveStepsToday - recordedActiveSteps >= DAILY_STEP_HISTORY_WRITE_DELTA ||
      (recordedActiveSteps === 0 && effectiveStepsToday > 0) ||
      (recordedToday === 0 && totalStepsToday > 0);

    if (!shouldUpdate) {
      return;
    }

    persistProgress((current) => {
      const isSameRecordedDay = current.lastKnownDate === today;
      if (!isSameRecordedDay) {
        liveSessionBaselineRef.current = rawStepsToday;
        liveSessionOffsetRef.current = 0;
      }

      const nextStepBaseline = isSameRecordedDay ? current.stepBaselineToday : 0;
      const nextDailySteps = isSameRecordedDay
        ? totalStepsToday
        : rawStepsToday;
      const currentRecordedToday = current.dailyStepHistory[today] ?? 0;
      const nextRecordedToday = Math.max(currentRecordedToday, nextDailySteps);

      if (steps.countingMode === "live-session") {
        liveDailyBaselineRef.current = rawStepsToday;
        liveDailyOffsetRef.current = nextRecordedToday;
      }

      return {
        ...current,
        lastKnownDate: today,
        stepBaselineToday: nextStepBaseline,
        activeJourneyStepsToday: isSameRecordedDay
          ? Math.max(current.activeJourneyStepsToday ?? 0, effectiveStepsToday)
          : 0,
        dailyStepHistory: {
          ...current.dailyStepHistory,
          [today]: nextRecordedToday
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
    rawStepsToday,
    steps.countingMode,
    totalStepsToday
  ]);

  const resetProgress = useCallback(async () => {
    const next = createDefaultProgress(animals);
    liveSessionBaselineRef.current = 0;
    liveSessionOffsetRef.current = 0;
    liveDailyBaselineRef.current = 0;
    liveDailyOffsetRef.current = 0;
    await clearRescueProgress();
    await persistProgress(next);
  }, [animals, persistProgress]);

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
      stepsToday: totalStepsToday,
      activeStepsToday: effectiveStepsToday,
      weeklySteps,
      lastRescueEvent,
      lastCareEvent,
      canAccessAnimal,
      getAnimalStatus,
      getMilestone,
      getAnimalMetrics,
      claimMiniMilestone,
      rescueAnimal,
      resetProgress,
      focusUnlockEvent,
      dismissRescueEvent: dismissUnlockEvent,
      dismissCareEvent: dismissUnlockEvent
    }),
    [
      animals,
      canAccessAnimal,
      claimMiniMilestone,
      currentAnimal,
      currentAnimalIndex,
      currentMilestone,
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
      unlockedAnimals,
      weeklySteps,
      totalStepsToday,
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
