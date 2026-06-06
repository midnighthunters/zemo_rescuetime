import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { getLocalDateKey, startOfToday } from "../../utils/date";
import { normalizePermissionStatus, type PermissionStatus } from "./stepUtils";

const LIVE_STEP_UPDATE_INTERVAL_MS = 750;

export type StepCountingMode = "full-day" | "live-session" | "unavailable";

export type StepCounterState = {
  stepsToday: number;
  historicalStepsToday: number;
  liveSteps: number;
  isAvailable: boolean;
  isLoading: boolean;
  permissionStatus: PermissionStatus;
  countingMode: StepCountingMode;
  sourceLabel: string;
  error?: string;
  refreshSteps: () => Promise<void>;
};

export function useStepCounter(): StepCounterState {
  const [historicalStepsToday, setHistoricalStepsToday] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [countingMode, setCountingMode] =
    useState<StepCountingMode>("unavailable");
  const [error, setError] = useState<string | undefined>();
  const dateKeyRef = useRef(getLocalDateKey());
  const liveRef = useRef({
    raw: 0,
    baseline: 0,
    rolloverOffset: 0
  });
  const liveUpdateRef = useRef<{
    lastPublished: number;
    lastPublishedAt: number;
    pending?: number;
    timer?: ReturnType<typeof setTimeout>;
  }>({
    lastPublished: 0,
    lastPublishedAt: 0
  });

  const resetLiveSteps = useCallback((baseline = liveRef.current.raw) => {
    if (liveUpdateRef.current.timer) {
      clearTimeout(liveUpdateRef.current.timer);
    }
    liveUpdateRef.current = {
      lastPublished: 0,
      lastPublishedAt: Date.now()
    };
    liveRef.current = {
      raw: baseline,
      baseline,
      rolloverOffset: 0
    };
    setLiveSteps((current) => (current === 0 ? current : 0));
  }, []);

  const publishLiveSteps = useCallback((steps: number) => {
    liveUpdateRef.current.lastPublished = steps;
    liveUpdateRef.current.lastPublishedAt = Date.now();
    liveUpdateRef.current.pending = undefined;
    setLiveSteps((current) => (current === steps ? current : steps));
  }, []);

  const scheduleLiveStepUpdate = useCallback(
    (steps: number) => {
      const updateState = liveUpdateRef.current;
      if (steps === updateState.lastPublished && !updateState.timer) {
        return;
      }

      updateState.pending = steps;
      const elapsed = Date.now() - updateState.lastPublishedAt;

      const flush = () => {
        const pending = liveUpdateRef.current.pending;
        liveUpdateRef.current.timer = undefined;
        if (pending !== undefined) {
          publishLiveSteps(pending);
        }
      };

      if (elapsed >= LIVE_STEP_UPDATE_INTERVAL_MS) {
        if (updateState.timer) {
          clearTimeout(updateState.timer);
          updateState.timer = undefined;
        }
        flush();
        return;
      }

      if (!updateState.timer) {
        updateState.timer = setTimeout(
          flush,
          LIVE_STEP_UPDATE_INTERVAL_MS - elapsed
        );
      }
    },
    [publishLiveSteps]
  );

  const refreshSteps = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const available = Platform.OS !== "web" && (await Pedometer.isAvailableAsync());
      setIsAvailable(available);

      if (!available) {
        setPermissionStatus("denied");
        setHistoricalStepsToday(0);
        resetLiveSteps(0);
        setCountingMode("unavailable");
        setError("Step tracking is not available on this device.");
        return;
      }

      const currentPermission =
        await Pedometer.getPermissionsAsync();
      let normalized = normalizePermissionStatus(currentPermission?.status);

      if (normalized === "undetermined") {
        const requested = await Pedometer.requestPermissionsAsync();
        normalized = normalizePermissionStatus(requested?.status);
      }

      setPermissionStatus(normalized);

      if (normalized !== "granted") {
        setHistoricalStepsToday(0);
        resetLiveSteps(0);
        setCountingMode("unavailable");
        setError("Motion permission is needed to count rescue steps.");
        return;
      }

      if (Platform.OS === "ios") {
        // Add timeout for pedometer call to prevent hanging
        const pedometerPromise = Pedometer.getStepCountAsync(startOfToday(), new Date());
        const timeoutPromise = new Promise<{steps: number}>((resolve) => {
          setTimeout(() => {
            resolve({ steps: 0 });
          }, 5000);
        });

        const result = await Promise.race([pedometerPromise, timeoutPromise]);
        setHistoricalStepsToday(Math.max(0, result.steps));
        resetLiveSteps();
        setCountingMode("full-day");
        return;
      }

      setHistoricalStepsToday(0);
      setCountingMode("live-session");
    } catch (caught) {
      setCountingMode("unavailable");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read today's step count."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSteps();
  }, [refreshSteps]);

  useEffect(() => {
    if (!isAvailable || permissionStatus !== "granted") {
      return undefined;
    }

    const subscription = Pedometer.watchStepCount(({ steps }) => {
      const raw = Math.max(0, steps);
      let { baseline, rolloverOffset } = liveRef.current;

      if (raw < liveRef.current.raw) {
        rolloverOffset += Math.max(0, liveRef.current.raw - baseline);
        baseline = raw;
      }

      const adjusted = rolloverOffset + Math.max(0, raw - baseline);
      liveRef.current = {
        raw,
        baseline,
        rolloverOffset
      };
      scheduleLiveStepUpdate(adjusted);
    });

    return () => {
      subscription.remove();
    };
  }, [isAvailable, permissionStatus, scheduleLiveStepUpdate]);

  useEffect(() => {
    return () => {
      if (liveUpdateRef.current.timer) {
        clearTimeout(liveUpdateRef.current.timer);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshSteps();
      }
    });

    return () => subscription.remove();
  }, [refreshSteps]);

  useEffect(() => {
    const timer = setInterval(() => {
      const today = getLocalDateKey();
      if (today === dateKeyRef.current) {
        return;
      }

      dateKeyRef.current = today;
      setHistoricalStepsToday(0);
      resetLiveSteps(0);
      refreshSteps();
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [refreshSteps, resetLiveSteps]);

  const stepsToday = useMemo(
    () => Math.max(0, historicalStepsToday + liveSteps),
    [historicalStepsToday, liveSteps]
  );

  const sourceLabel = useMemo(
    () =>
      countingMode === "full-day"
        ? "Device pedometer"
        : countingMode === "live-session"
          ? "Live pedometer"
          : "Unavailable",
    [countingMode]
  );

  return {
    stepsToday,
    historicalStepsToday,
    liveSteps,
    isAvailable,
    isLoading,
    permissionStatus,
    countingMode,
    sourceLabel,
    error,
    refreshSteps
  };
}
